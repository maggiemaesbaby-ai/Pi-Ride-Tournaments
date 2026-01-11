"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Locate,
  AlertTriangle,
  Car,
  Shield,
  Navigation,
  XCircle,
  MapPin,
  Clock,
  Route,
  Play,
  Fuel,
  Coffee,
  Utensils,
  Volume2,
  VolumeX,
  Home,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/contexts/currency-provider"
import { getMapboxToken } from "@/app/actions/get-mapbox-token"
import { LocationPermissionDialog } from "@/components/location-permission-dialog"
import { BusinessMapManager } from "@/lib/business-map-manager"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog" // Import Dialog components
import mapboxgl from "mapbox-gl" // Import mapboxgl

interface RoadAlert {
  id: string
  type: "wreck" | "police" | "broke-down" | "hazard" | "detour"
  lat: number
  lng: number
  timestamp: Date
  userName: string
  confirmCount: number
}

interface RouteOption {
  id: string
  name: string
  distance: string
  duration: string
  warnings: string[]
  coordinates: [number, number][]
  steps: any[]
}

interface POI {
  id: string
  type: "gas" | "food" | "restroom"
  name: string
  lat: number
  lng: number
  distance: string
  price?: string
}

interface TurnInstruction {
  id: string
  instruction: string
  distance: string
  roadName: string
}

interface PiBusiness {
  id: string
  name: string
  category: string
  lat: number
  lng: number
  address: string
  description: string
  verified: boolean
}

export function MapTab() {
  console.log("[v0] ===== MAPTAB COMPONENT FUNCTION CALLED =====")

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null) // Use mapboxgl.Map type
  const markerRef = useRef<any>(null)
  const alertMarkersRef = useRef<any[]>([])
  const watchIdRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)
  const hasInitializedMapRef = useRef(false)
  const isInitializingRef = useRef(false)
  const { toast } = useToast()
  const { convertToDisplayPrice } = useCurrency()

  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [roadAlerts, setRoadAlerts] = useState<RoadAlert[]>([])
  const [piBusinesses, setPiBusinesses] = useState<PiBusiness[]>([])
  const piBusinessMarkersRef = useRef<any[]>([])

  const [selectedAlertType, setSelectedAlertType] = useState<RoadAlert["type"] | "">("")
  const [isPlacingMarker, setIsPlacingMarker] = useState(false)

  const [navigationMode, setNavigationMode] = useState<"planning" | "navigating" | "idle">("idle")
  const [startPoint, setStartPoint] = useState("")
  const [destination, setDestination] = useState("")
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([])
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null)
  const [currentInstruction, setCurrentInstruction] = useState<TurnInstruction | null>(null)
  const [upcomingInstructions, setUpcomingInstructions] = useState<TurnInstruction[]>([])
  const [nearbyPOIs, setNearbyPOIs] = useState<POI[]>([])
  const routeLineRef = useRef<any>(null)

  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showStartSuggestions, setShowStartSuggestions] = useState(false)
  const [showDestSuggestions, setShowDestSuggestions] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [tokenLoading, setTokenLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false)

  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const hasAnnouncedRouteRef = useRef(false)

  const wakeLockRef = useRef<any>(null)
  const [isBackgroundMode, setIsBackgroundMode] = useState(false)

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const lastAnnouncedStepRef = useRef(-1)
  const routeProgressRef = useRef({ totalDistance: 0, remainingDistance: 0 })

  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number>(0)
  const [lastDistanceAnnouncement, setLastDistanceAnnouncement] = useState<number>(-1)
  const hasAnnounced1000FtRef = useRef(false)
  const hasAnnounced50FtRef = useRef(false)
  const navigationWatchIdRef = useRef<number | null>(null)
  const routeStepsRef = useRef<any[]>([])
  const [showUseCurrentLocation, setShowUseCurrentLocation] = useState(false)

  const [homeAddress, setHomeAddress] = useState("")
  const [showHomeAddressDialog, setShowHomeAddressDialog] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false)
  const [waitlistCity, setWaitlistCity] = useState("")

  const handleJoinWaitlist = async () => {
    if (!userPosition) {
      // Changed from pickupLocation to userPosition as it's more consistently available here
      toast({
        title: "Location Required",
        description: "Please select a pickup location first",
      })
      return
    }

    try {
      const response = await fetch("/api/rideshare/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: waitlistCity || userPosition.city || "Unknown", // Assuming userPosition might have a city property, otherwise use waitlistCity
          location: {
            lat: userPosition.lat,
            lng: userPosition.lng,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Added to Waitlist",
          description: "We'll notify you when drivers become available in your area",
        })
        setShowWaitlistDialog(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Failed to Join Waitlist",
        description: error.message,
      })
    }
  }

  useEffect(() => {
    console.log("[v0] ===== MAP TAB MOUNTED =====")
    console.log("[v0] Map tab mounted, mapboxToken:", !!mapboxToken, "userLocation:", userLocation)

    if (!userLocation && navigator.geolocation) {
      console.log("[v0] Fetching initial location...")
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          console.log("[v0] Initial location fetched:", location)
          setUserLocation(location)
        },
        (error) => {
          console.error("[v0] Error fetching initial location:", error.message, error.code)
          // Use San Francisco as default when location fails
          const defaultLocation = { lat: 37.7749, lng: -122.4194 }
          console.log("[v0] Using default location:", defaultLocation)
          setUserLocation(defaultLocation)
          toast({
            title: "Using Default Location",
            description: "Enable location services for better experience. Tap the location button to try again.",
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else if (!userLocation) {
      // No geolocation support - use default
      console.log("[v0] Geolocation not available, using default")
      setUserLocation({ lat: 37.7749, lng: -122.4194 })
    }
  }, [])

  useEffect(() => {
    isMountedRef.current = true

    if (!locationPermissionAsked) {
      setShowLocationDialog(true)
      setLocationPermissionAsked(true)
    }

    return () => {
      isMountedRef.current = false
    }
  }, [locationPermissionAsked])

  // Fetch Mapbox token on mount
  useEffect(() => {
    console.log("[v0] ===== MAPBOX TOKEN USEEFFECT STARTING =====")

    const fetchToken = async () => {
      try {
        console.log("[v0] Calling getMapboxToken()...")
        const token = await getMapboxToken()
        console.log("[v0] getMapboxToken() returned, token length:", token?.length || 0)

        if (!token) {
          console.error("[v0] ❌ Token is empty or null!")
          setMapError("Mapbox API token is missing. Please ensure MAPBOX_TOKEN is set in environment variables.")
          setTokenLoading(false)
        } else {
          console.log("[v0] ✓ Token received successfully, setting state...")
          setMapboxToken(token)
          console.log("[v0] ✓ Mapbox token state updated")
          setMapError(null)
          setTokenLoading(false)
        }
      } catch (error) {
        console.error("[v0] ❌ Error in fetchToken:", error)
        setMapError(`Failed to retrieve Mapbox API token: ${error instanceof Error ? error.message : "Unknown error"}`)
        setTokenLoading(false)
      }
    }

    fetchToken()
  }, [])

  // Load saved home address
  useEffect(() => {
    const saved = localStorage.getItem("homeAddress")
    if (saved) {
      setHomeAddress(saved)
    }
  }, [])

  useEffect(() => {
    if (!userLocation) return

    const loadBusinesses = () => {
      const allBusinesses = BusinessMapManager.getAllBusinesses()
      const formattedBusinesses: PiBusiness[] = allBusinesses.map((business) => ({
        id: business.id,
        name: business.businessName,
        category: business.category,
        lat: business.coordinates.lat || userLocation.lat + (Math.random() - 0.5) * 0.02,
        lng: business.coordinates.lng || userLocation.lng + (Math.random() - 0.5) * 0.02,
        address: business.address,
        description: business.description || "",
        verified: business.approved,
      }))

      setPiBusinesses(formattedBusinesses)
      console.log("[v0] Loaded businesses from map:", formattedBusinesses.length)
    }

    loadBusinesses()

    const interval = setInterval(loadBusinesses, 30000)

    return () => clearInterval(interval)
  }, [userLocation])

  useEffect(() => {
    console.log("[v0] Map init check:", {
      hasUserLocation: !!userLocation,
      hasContainer: !!mapContainerRef.current,
      alreadyInitialized: hasInitializedMapRef.current,
      hasToken: !!mapboxToken,
      isInitializing: isInitializingRef.current,
    })

    if (
      !userLocation ||
      !mapContainerRef.current ||
      hasInitializedMapRef.current ||
      !mapboxToken ||
      isInitializingRef.current ||
      mapError // Added check for mapError state
    ) {
      if (!mapboxToken) {
        console.log("[v0] Map initialization blocked: Waiting for Mapbox token...")
      } else if (mapError) {
        console.log("[v0] Map initialization blocked: Map error is present.")
      }
      return
    }

    isInitializingRef.current = true
    hasInitializedMapRef.current = true

    const initMap = async () => {
      try {
        console.log("[v0] Initializing map with location:", userLocation)
        isInitializingRef.current = true

        if (!mapContainerRef.current || mapRef.current) {
          console.log("[v0] Map already initialized or container not ready")
          return
        }

        console.log("[v0] Creating new Mapbox map...")
        mapboxgl.accessToken = mapboxToken // Set Mapbox access token

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/navigation-day-v1", // Use Mapbox navigation style
          center: [userLocation.lng, userLocation.lat], // Mapbox expects [lng, lat]
          zoom: 15,
          failIfMajorPerformanceCaveat: false,
        })

        map.on("error", (e) => {
          console.error("[v0] Map error:", e)
          setMapError("Failed to load map. Your browser may not support 3D maps.")
        })

        mapRef.current = map
        console.log("[v0] Map instance created successfully")

        // Add user location marker
        const userIcon = document.createElement("div")
        userIcon.className = "user-location-marker"
        userIcon.style.width = "20px"
        userIcon.style.height = "20px"
        userIcon.style.background = "#8b5cf6"
        userIcon.style.border = "3px solid white"
        userIcon.style.borderRadius = "50%"
        userIcon.style.boxShadow = "0 0 10px rgba(139, 92, 246, 0.6)"

        const marker = new mapboxgl.Marker({ element: userIcon, anchor: "center" })
          .setLngLat([userLocation.lng, userLocation.lat])
          .addTo(map)

        marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setText("You are here"))
        markerRef.current = marker

        map.on("click", (e: any) => {
          if (isPlacingMarker && selectedAlertType) {
            addAlertAtLocation(e.lngLat.lat, e.lngLat.lng)
          }
        })

        // Watch position updates
        if (navigator.geolocation) {
          const watchId = navigator.geolocation.watchPosition(
            (position) => {
              if (isMountedRef.current && markerRef.current) {
                const newLat = position.coords.latitude
                const newLng = position.coords.longitude
                markerRef.current.setLngLat([newLng, newLat])
                setUserLocation({ lat: newLat, lng: newLng })
              }
            },
            (error) => {
              console.log("[v0] Position watch error:", error.message)
            },
            { enableHighAccuracy: true, maximumAge: 10000 },
          )
          watchIdRef.current = watchId
        }

        setIsMapReady(true)
        console.log("[v0] Map initialized successfully")

        const piBusinesses = BusinessMapManager.getAllBusinesses()
        console.log("[v0] Businesses loaded:", piBusinesses.length)

        piBusinesses.forEach((business) => {
          if (business.coordinates.lat === 0 && business.coordinates.lng === 0) {
            // Geocode the address to get real coordinates
            fetch(
              `/api/geocode?address=${encodeURIComponent(business.address + ", " + business.city + ", " + business.state)}`,
            )
              .then((res) => res.json())
              .then((data) => {
                if (data.coordinates) {
                  BusinessMapManager.updateCoordinates(business.id, data.coordinates.lat, data.coordinates.lng)
                  addBusinessMarkerToMap(
                    business.id,
                    business.businessName,
                    business.category,
                    data.coordinates.lat,
                    data.coordinates.lng,
                  )
                } else {
                  // Use user's current location as fallback with random offset
                  const lat = userLocation.lat + (Math.random() - 0.5) * 0.02
                  const lng = userLocation.lng + (Math.random() - 0.5) * 0.02
                  BusinessMapManager.updateCoordinates(business.id, lat, lng)
                  addBusinessMarkerToMap(business.id, business.businessName, business.category, lat, lng)
                }
              })
              .catch(() => {
                // Fallback to random position near user
                const lat = userLocation.lat + (Math.random() - 0.5) * 0.02
                const lng = userLocation.lng + (Math.random() - 0.5) * 0.02
                BusinessMapManager.updateCoordinates(business.id, lat, lng)
                addBusinessMarkerToMap(business.id, business.businessName, business.category, lat, lng)
              })
          } else {
            // Business already has coordinates
            addBusinessMarkerToMap(
              business.id,
              business.businessName,
              business.category,
              business.coordinates.lat,
              business.coordinates.lng,
            )
          }
        })

        function addBusinessMarkerToMap(id: string, name: string, category: string, lat: number, lng: number) {
          const marker = new mapboxgl.Marker({ color: "#FFD700" }) // Gold color for Pi businesses
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup().setHTML(`
                <div class="p-2">
                  <h3 class="font-bold text-sm">${name}</h3>
                  <p class="text-xs text-gray-600">${category}</p>
                  <p class="text-xs text-amber-600 font-semibold mt-1">π Accepts Pi Payment</p>
                </div>
              `),
            )
            .addTo(map)
          piBusinessMarkersRef.current.push(marker) // Store marker for removal later
        }
      } catch (error) {
        console.error("[v0] Map initialization error:", error)
        isInitializingRef.current = false
        if (error instanceof Error) {
          if (error.message.includes("WebGL")) {
            setMapError(
              "Your browser doesn't support 3D maps. Please use a different browser or update to the latest version.",
            )
          } else {
            setMapError("Failed to load map. Please check your internet connection and try again.")
          }
        }
        console.log("[v0] Map failed to initialize - check MAPBOX_TOKEN environment variable or WebGL support")
      }
    }

    initMap()
  }, [userLocation, mapboxToken, mapError]) // Added mapError to dependencies

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }

      if (markerRef.current) {
        markerRef.current.remove()
        markerRef.current = null
      }

      if (mapRef.current) {
        mapRef.current.remove() // Use mapboxgl's remove method
        mapRef.current = null
      }

      alertMarkersRef.forEach((marker) => marker.remove())
      alertMarkersRef.current = []

      piBusinessMarkersRef.current.forEach((marker) => marker.remove()) // Use mapboxgl's remove method
      piBusinessMarkersRef.current = []

      hasInitializedMapRef.current = false
      isInitializingRef.current = false
      setIsMapReady(false)
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return

    const updateAlertMarkers = async () => {
      // Removed L import, as Mapbox is used directly
      alertMarkersRef.current.forEach((marker) => marker.remove())
      alertMarkersRef.current = []

      roadAlerts.forEach((alert) => {
        const alertIcon = getAlertIcon(alert.type)
        const marker = new mapboxgl.Marker({ element: alertIcon })
          .setLngLat([alert.lng, alert.lat])
          .addTo(mapRef.current)

        const timeAgo = getTimeAgo(alert.timestamp)

        const popupContent = `
          <div style="min-width: 200px;">
            <strong>${getAlertTitle(alert.type)}</strong><br/>
            <small style="color: #666;">by ${alert.userName} - ${timeAgo}</small><br/>
            <small style="color: #666;">Confirmed by ${alert.confirmCount} users</small><br/>
            <button
              onclick="window.clearRoadAlert('${alert.id}')"
              style="margin-top: 8px; padding: 4px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
            >
              Clear - No Longer Here
            </button>
          </div>
        `
        marker.setPopup(new mapboxgl.Popup().setHTML(popupContent))

        alertMarkersRef.current.push(marker)
      })
    }

    updateAlertMarkers()
  }, [roadAlerts, isMapReady])

  useEffect(() => {
    if (!mapRef.current || !isMapReady) return

    const updatePiBusinessMarkers = async () => {
      // Removed L import, as Mapbox is used directly
      piBusinessMarkersRef.current.forEach((marker) => marker.remove())
      piBusinessMarkersRef.current = []

      piBusinesses.forEach((business) => {
        const piIcon = document.createElement("div")
        piIcon.className = "pi-business-marker"
        piIcon.style.width = "40px"
        piIcon.style.height = "40px"
        piIcon.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        piIcon.style.border = "3px solid white"
        piIcon.style.borderRadius = "50%"
        piIcon.style.display = "flex"
        piIcon.style.alignItems = "center"
        piIcon.style.justifyContent = "center"
        piIcon.style.fontSize = "20px"
        piIcon.style.fontWeight = "bold"
        piIcon.style.color = "white"
        piIcon.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.3)"
        piIcon.style.animation = "pulse-pi 2s ease-in-out infinite"
        piIcon.style.cursor = "pointer"
        piIcon.innerHTML = "π"

        const styleSheet = document.createElement("style")
        styleSheet.type = "text/css"
        styleSheet.innerText = `
          @keyframes pulse-pi {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5), 0 0 20px rgba(245, 158, 11, 0.3); }
            50% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(245, 158, 11, 0.7), 0 0 30px rgba(245, 158, 11, 0.5); }
          }
        `
        document.head.appendChild(styleSheet)

        const marker = new mapboxgl.Marker({ element: piIcon })
          .setLngLat([business.lng, business.lat])
          .addTo(mapRef.current)

        const popupContent = `
          <div style="min-width: 250px; padding: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; color: white; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);">π</div>
              <strong style="font-size: 16px; color: #1e293b;">${business.name}</strong>
            </div>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;">
              <strong>Category:</strong> ${business.category}
            </p>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;">
              <strong>Address:</strong> ${business.address}
            </p>
            <p style="margin: 8px 0; color: #475569; font-size: 13px;">${business.description}</p>
            ${
              business.verified
                ? '<div style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #dcfce7; border-radius: 12px; font-size: 11px; color: #16a34a; margin-top: 8px;"><span style="font-size: 14px;">✓</span> Verified Pi Merchant</div>'
                : ""
            }
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #8b5cf6; font-weight: 600; text-align: center; margin-bottom: 8px;">💰 Accepts Pi Cryptocurrency</p>
              <a href="/shop/${business.id}" style="display: block; width: 100%; padding: 8px 16px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-align: center; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🛍️ Visit Shop
              </a>
            </div>
          </div>
        `
        marker.setPopup(new mapboxgl.Popup().setHTML(popupContent))

        piBusinessMarkersRef.current.push(marker)
      })
    }

    updatePiBusinessMarkers()
  }, [piBusinesses, isMapReady])

  useEffect(() => {
    ;(window as any).clearRoadAlert = (alertId: string) => {
      setRoadAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
      toast({
        title: "Alert Cleared",
        description: "Thank you for keeping the map updated!",
      })
    }

    return () => {
      delete (window as any).clearRoadAlert
    }
  }, [toast])

  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    let processedText = text

    // Handle "Highway 641" as "Highway six forty-one" not "Highway six hundred forty-one"
    processedText = processedText.replace(/\b(Highway|Hwy)\s+(\d)(\d{2})\b/gi, (match, prefix, hundreds, tens) => {
      return `Highway ${hundreds} ${tens}`
    })

    // Handle interstate numbers properly (e.g., "I-24" or "Interstate 24")
    processedText = processedText.replace(/\b(I-|Interstate\s+)(\d+)\b/gi, (match, prefix, num) => {
      return `Interstate ${num}`
    })

    // Handle exit numbers - keep them natural
    processedText = processedText.replace(/\bexit\s+(\d+)\b/gi, (match, num) => {
      return `exit ${num}`
    })

    const utterance = new SpeechSynthesisUtterance(processedText)

    utterance.rate = 0.85 // Slightly slower for authority
    utterance.pitch = 0.7 // Much lower pitch for deep voice
    utterance.volume = 1.0
    utterance.lang = "en-US"

    // Try to use a male voice if available
    const voices = window.speechSynthesis.getVoices()
    const maleVoice = voices.find(
      (voice) =>
        voice.name.includes("Male") ||
        voice.name.includes("male") ||
        voice.name.includes("Daniel") ||
        voice.name.includes("Alex"),
    )
    if (maleVoice) {
      utterance.voice = maleVoice
    }

    speechSynthesisRef.current = utterance

    // Override silence restrictions by resuming audio context
    if (isBackgroundMode && typeof window !== "undefined") {
      try {
        // Create audio context if needed to ensure audio plays in background
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume()
        }
      } catch (e) {
        console.error("[v0] Audio context error:", e)
      }
    }

    window.speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    if (routeOptions.length > 0 && !hasAnnouncedRouteRef.current) {
      hasAnnouncedRouteRef.current = true
      // Don't announce routes here anymore
    }
  }, [routeOptions, voiceEnabled])

  useEffect(() => {
    if (navigationMode === "navigating" && currentInstruction) {
      // speak(`${currentInstruction.instruction} in ${currentInstruction.distance}`)
    }
  }, [currentInstruction, navigationMode, voiceEnabled])

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen")
        console.log("[v0] Wake lock acquired - screen will stay on during navigation")
      }
    } catch (err) {
      console.error("[v0] Wake lock error:", err)
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
        console.log("[v0] Wake lock released")
      } catch (err) {
        console.error("[v0] Wake lock release error:", err)
      }
    }
  }

  const saveHomeAddress = (address: string) => {
    setHomeAddress(address)
    localStorage.setItem("homeAddress", address)
    toast({
      title: "Home Address Saved",
      description: "You can now use 'Return Home' anytime",
    })
    setShowHomeAddressDialog(false)
  }

  const returnHome = () => {
    if (homeAddress) {
      setDestination(homeAddress)
      setNavigationMode("planning")
      toast({
        title: "Navigating Home",
        description: homeAddress,
      })
    } else {
      setShowHomeAddressDialog(true)
    }
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBackgroundMode(true)
        console.log("[v0] App minimized - continuing navigation with voice announcements")
        if (voiceEnabled) {
          speak("Navigation continues in background")
        }
      } else {
        setIsBackgroundMode(false)
        console.log("[v0] App resumed - continuing navigation")

        // Re-center map when coming back
        if (mapRef.current && userLocation && navigationMode === "navigating") {
          mapRef.current.setCenter([userLocation.lng, userLocation.lat]) // Use mapboxgl setCenter
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Prevent page refresh when coming back from background
    const preventUnload = (e: BeforeUnloadEvent) => {
      if (navigationMode === "navigating") {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", preventUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", preventUnload)
    }
  }, [navigationMode, userLocation, voiceEnabled])

  useEffect(() => {
    if (navigationMode === "navigating") {
      // Request wake lock
      requestWakeLock()

      // Ensure geolocation continues in background
      if (navigator.geolocation && !watchIdRef.current) {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (isMountedRef.current) {
              const newLat = position.coords.latitude
              const newLng = position.coords.longitude

              if (markerRef.current) {
                markerRef.current.setLngLat([newLng, newLat]) // Use mapboxgl setLngLat
              }

              setUserLocation({ lat: newLat, lng: newLng })

              console.log("[v0] GPS update:", { lat: newLat, lng: newLng, background: isBackgroundMode })
            }
          },
          (error) => {
            console.error("[v0] Geolocation error:", error)
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          },
        )
        watchIdRef.current = watchId
      }
    } else {
      releaseWakeLock()
    }

    return () => {
      if (navigationMode !== "navigating") {
        releaseWakeLock()
      }
    }
  }, [navigationMode, isBackgroundMode])

  useEffect(() => {
    if (navigationMode === "navigating" && selectedRoute) {
      const routeState = {
        selectedRoute,
        currentStepIndex,
        startPoint: startPoint, // assuming startPoint is the pickup
        destination,
        timestamp: Date.now(),
      }
      localStorage.setItem("activeNavigation", JSON.stringify(routeState))
    } else {
      localStorage.removeItem("activeNavigation")
    }
  }, [navigationMode, selectedRoute, currentStepIndex, startPoint, destination])

  useEffect(() => {
    const savedRoute = localStorage.getItem("activeNavigation")
    if (savedRoute) {
      try {
        const routeState = JSON.parse(savedRoute)
        // Only restore if less than 30 minutes old
        if (Date.now() - routeState.timestamp < 30 * 60 * 1000) {
          setSelectedRoute(routeState.selectedRoute)
          setCurrentStepIndex(routeState.currentStepIndex)
          setStartPoint(routeState.startPoint) // assuming startPoint is the pickup
          setDestination(routeState.destination)
          setNavigationMode("navigating")
          toast({
            title: "Navigation Restored",
            description: "Continuing your previous route",
          })
        } else {
          localStorage.removeItem("activeNavigation")
        }
      } catch (e) {
        console.error("[v0] Failed to restore navigation:", e)
      }
    }
  }, [])

  const getAlertIcon = async (type: RoadAlert["type"]) => {
    // Removed L import, as Mapbox is used directly
    const iconConfig: Record<RoadAlert["type"], { color: string; icon: string }> = {
      wreck: { color: "#dc2626", icon: "🚗💥" },
      police: { color: "#3b82f6", icon: "👮" },
      "broke-down": { color: "#f59e0b", icon: "🔧" },
      hazard: { color: "#f97316", icon: "⚠️" },
      detour: { color: "#8b5cf6", icon: "↩️" },
    }

    const config = iconConfig[type]
    const iconElement = document.createElement("div")
    iconElement.className = "road-alert-marker"
    iconElement.style.width = "36px"
    iconElement.style.height = "36px"
    iconElement.style.background = config.color
    iconElement.style.border = "3px solid white"
    iconElement.style.borderRadius = "50%"
    iconElement.style.display = "flex"
    iconElement.style.alignItems = "center"
    iconElement.style.justifyContent = "center"
    iconElement.style.fontSize = "14px"
    iconElement.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"
    iconElement.innerHTML = config.icon

    return iconElement
  }

  const getAlertTitle = (type: RoadAlert["type"]) => {
    const titles = {
      wreck: "Wreck",
      police: "Police",
      "broke-down": "Car Broke Down",
      hazard: "Road Hazard",
      detour: "Detour",
    }
    return titles[type]
  }

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((new Date().getTime() - date.getTime()) / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const addAlertAtLocation = (lat: number, lng: number) => {
    if (!selectedAlertType) return

    const newAlert: RoadAlert = {
      id: Date.now().toString(),
      type: selectedAlertType,
      lat,
      lng,
      timestamp: new Date(),
      userName: "You",
      confirmCount: 1,
    }

    setRoadAlerts([...roadAlerts, newAlert])
    setIsPlacingMarker(false)
    setSelectedAlertType("")

    toast({
      title: "Alert Placed",
      description: `${getAlertTitle(selectedAlertType)} marked on the map`,
    })
  }

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.setCenter([userLocation.lng, userLocation.lat]) // Use mapboxgl setCenter
      mapRef.current.setZoom(15)
    }
  }

  const handleAlertTypeSelect = (value: string) => {
    setSelectedAlertType(value as RoadAlert["type"])
    setIsPlacingMarker(true)
    toast({
      title: "Tap on Map",
      description: "Click where you want to place the marker",
    })
  }

  const searchAddress = async (query: string, type: "start" | "destination") => {
    if (query.length < 3) {
      setAddressSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5&types=address,poi`,
      )
      const data = await response.json()

      setAddressSuggestions(data.features || [])
      if (type === "start") {
        setShowStartSuggestions(true)
      } else {
        setShowDestSuggestions(true)
      }
    } catch (error) {
      console.error("Geocoding error:", error)
    }
  }

  const selectAddress = (suggestion: any, type: "start" | "destination") => {
    if (type === "start") {
      setStartPoint(suggestion.place_name)
      setShowStartSuggestions(false)
    } else {
      setDestination(suggestion.place_name)
      setShowDestSuggestions(false)
    }
  }

  const calculateRoutes = async () => {
    hasAnnouncedRouteRef.current = false

    if (!startPoint || !destination) {
      toast({
        title: "Missing Information",
        description: "Please enter both starting point and destination",
      })
      return
    }

    if (navigationMode === "navigating") {
      toast({
        title: "Recalculating Route",
        description: "Finding new routes while you continue driving",
      })
    }

    try {
      console.log("[v0] Calculating routes from", startPoint, "to", destination)

      let startCoords
      if (startPoint === "Current Location" && userLocation) {
        startCoords = [userLocation.lng, userLocation.lat] // Mapbox expects lng, lat
        console.log("[v0] Using current location:", startCoords)
      } else {
        const startGeo = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(startPoint)}.json?access_token=${mapboxToken}&limit=1`,
        )
        const startData = await startGeo.json()
        if (!startData.features[0]) {
          toast({
            title: "Location Not Found",
            description: "Could not find starting address",
          })
          return
        }
        startCoords = startData.features[0].center
        console.log("[v0] Geocoded start location:", startCoords)
      }

      const destGeo = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json?access_token=${mapboxToken}&limit=1`,
      )
      const destData = await destGeo.json()

      if (!destData.features[0]) {
        toast({
          title: "Location Not Found",
          description: "Could not find destination address",
        })
        return
      }

      const destCoords = destData.features[0].center
      console.log("[v0] Geocoded destination:", destCoords)

      // Get 3 alternative routes
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords[0]},${startCoords[1]};${destCoords[0]},${destCoords[1]}?alternatives=true&steps=true&geometries=geojson&access_token=${mapboxToken}`,
      )
      const data = await response.json()

      if (!data.routes || data.routes.length === 0) {
        console.log("[v0] No routes found:", data)
        toast({
          title: "No Routes Found",
          description: "Could not find a route between these locations",
        })
        return
      }

      const routeNames = ["Fastest Route", "Shortest Route", "Alternate Route"]

      const mockRoutes: RouteOption[] = data.routes.slice(0, 3).map((route: any, index: number) => ({
        id: String(index + 1),
        name: routeNames[index] || `Route ${index + 1}`,
        distance: `${(route.distance / 1609.34).toFixed(1)} miles`,
        duration: `${Math.round(route.duration / 60)} min`,
        warnings: route.legs[0].incidents?.map((i: any) => i.description) || [],
        coordinates: route.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]), // Leaflet expects lat, lng
        steps: route.legs[0].steps,
      }))

      console.log("[v0] Routes calculated:", mockRoutes.length)
      setRouteOptions(mockRoutes)
      setNavigationMode("planning")

      if (mapRef.current) {
        drawAllRoutes(mockRoutes)
      }

      toast({
        title: "Routes Found",
        description: `${mockRoutes.length} route options available`,
      })
    } catch (error) {
      console.error("[v0] Route calculation error:", error)
      toast({
        title: "Error",
        description: "Failed to calculate routes. Please try again.",
      })
    }
  }

  const drawAllRoutes = async (routes: RouteOption[]) => {
    if (!mapRef.current) return

    // Removed L import, as Mapbox is used directly
    if (routeLineRef.current) {
      routeLineRef.current.forEach((line: any) => line.remove())
    }

    routeLineRef.current = routes.map((route, index) => {
      const color = index === 0 ? "#8b5cf6" : "#94a3b8"
      const weight = index === 0 ? 6 : 4

      return new mapboxgl.LineLayer({
        // Use mapboxgl.LineLayer
        id: `route-${index}`,
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route.coordinates,
            },
          },
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": color,
          "line-width": weight,
          "line-opacity": 0.7,
        },
      }).addTo(mapRef.current)
    })

    // Fit bounds to the first route
    const bounds = new mapboxgl.LngLatBounds()
    routes[0].coordinates.forEach((coord) => bounds.extend(coord.reverse())) // Mapbox expects LngLatBounds
    mapRef.current.fitBounds(bounds, { padding: 50 })
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const startNavigation = async () => {
    if (!selectedRoute) {
      toast({
        title: "No Route Selected",
        description: "Please select a route first",
      })
      return
    }

    speak(`Navigation started.`)

    setNavigationMode("navigating")

    routeStepsRef.current = (selectedRoute as any).steps

    setCurrentStepIndex(0)
    lastAnnouncedStepRef.current = -1
    setLastDistanceAnnouncement(-1)

    // Reset announcement flags
    hasAnnounced1000FtRef.current = false
    hasAnnounced50FtRef.current = false

    const firstStep = routeStepsRef.current[0]
    if (firstStep) {
      const firstInstruction = firstStep.maneuver.instruction
      const firstDistance = (firstStep.distance / 1609.34).toFixed(1)
      speak(`${firstInstruction} in ${firstDistance} miles`)

      const mockInstructions: TurnInstruction[] = routeStepsRef.current.map((step: any, index: number) => ({
        id: String(index + 1),
        instruction: step.maneuver.instruction,
        distance: `${(step.distance / 1609.34).toFixed(1)} mi`,
        roadName: step.name || "Unknown Road",
      }))

      setCurrentInstruction(mockInstructions[0])
      setUpcomingInstructions(mockInstructions.slice(1))
    }

    if (navigator.geolocation) {
      navigationWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserPosition(newPos)
          setUserLocation(newPos)

          // Update map center
          if (mapRef.current) {
            mapRef.current.setCenter([newPos.lng, newPos.lat]) // Use mapboxgl setCenter
            mapRef.current.setZoom(mapRef.current.getZoom()) // Keep current zoom level
          }
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        },
      )
    }

    // Existing POI and route drawing logic
    const mockPOIs: POI[] = [
      {
        id: "1",
        type: "gas",
        name: "Chevron",
        lat: userLocation!.lat + 0.01,
        lng: userLocation!.lng + 0.01,
        distance: "2.3 mi",
        price: convertToDisplayPrice(3.89),
      },
      {
        id: "2",
        type: "gas",
        name: "Shell",
        lat: userLocation!.lat + 0.02,
        lng: userLocation!.lng + 0.02,
        distance: "4.1 mi",
        price: convertToDisplayPrice(3.79),
      },
      {
        id: "3",
        type: "food",
        name: "McDonald's",
        lat: userLocation!.lat + 0.015,
        lng: userLocation!.lng + 0.015,
        distance: "3.5 mi",
      },
      {
        id: "4",
        type: "restroom",
        name: "Rest Area",
        lat: userLocation!.lat + 0.03,
        lng: userLocation!.lng + 0.03,
        distance: "6.2 mi",
      },
    ]

    setNearbyPOIs(mockPOIs)

    if (mapRef.current) {
      // Removed L import, as Mapbox is used directly

      if (routeLineRef.current) {
        routeLineRef.current.forEach((line: any) => line.remove())
      }

      routeLineRef.current = [
        new mapboxgl.LineLayer({
          // Use mapboxgl.LineLayer
          id: "selected-route",
          type: "line",
          source: {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: selectedRoute.coordinates,
              },
            },
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#8b5cf6",
            "line-width": 6,
            "line-opacity": 0.8,
          },
        }).addTo(mapRef.current),
      ]

      for (const poi of mockPOIs) {
        const icon = await getPOIIcon(poi.type)
        new mapboxgl.Marker({ element: icon }) // Use mapboxgl.Marker
          .setLngLat([poi.lng, poi.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="min-width: 150px;">
              <strong>${poi.name}</strong><br/>
              <small>${poi.distance} away</small>
              ${poi.price ? `<br/><strong style="color: #16a34a;">${poi.price}/gal</strong>` : ""}
            </div>
          `),
          )
          .addTo(mapRef.current)
      }
    }

    toast({
      title: "Navigation Started",
      description: "Follow the turn-by-turn directions",
    })
  }

  const announceNextTurn = useCallback(() => {
    if (navigationMode !== "navigating" || !userPosition || !selectedRoute) return

    const currentStep = routeStepsRef.current[currentStepIndex]
    if (!currentStep) {
      // Reached destination
      const destAddress = destination.split(",")[0]
      speak(`Your destination is on the right, ${destAddress}. You have arrived.`)
      stopNavigation()
      return
    }

    // Calculate distance to next turn
    const stepCoords = currentStep.maneuver.location
    const distanceMeters = calculateDistance(userPosition.lat, userLocation.lng, stepCoords[1], stepCoords[0])
    const distanceMiles = distanceMeters / 1609.34
    const distanceFeet = distanceMeters * 3.28084
    setDistanceToNextTurn(distanceMiles)

    if (distanceMiles > 1) {
      // Highway driving - announce at 20mi, 5mi, 1mi intervals
      if (distanceMiles <= 20 && distanceMiles > 19 && lastDistanceAnnouncement !== 20) {
        const instruction = currentStep.maneuver.instruction
        if (instruction.toLowerCase().includes("exit")) {
          const exitMatch = instruction.match(/exit\s+(\d+)/i)
          if (exitMatch) {
            speak(`20 miles until exit ${exitMatch[1]}`)
            setLastDistanceAnnouncement(20)
          }
        }
      } else if (distanceMiles <= 5 && distanceMiles > 4 && lastDistanceAnnouncement !== 5) {
        const instruction = currentStep.maneuver.instruction
        if (instruction.toLowerCase().includes("exit")) {
          const exitMatch = instruction.match(/exit\s+(\d+)/i)
          if (exitMatch) {
            speak(`5 miles until exit ${exitMatch[1]}`)
            setLastDistanceAnnouncement(5)
          }
        }
      } else if (distanceMiles <= 1 && distanceMiles > 0.9 && lastDistanceAnnouncement !== 1) {
        const instruction = currentStep.maneuver.instruction
        speak(`In 1 mile, ${instruction}`)
        setLastDistanceAnnouncement(1)
      }
    }

    if (distanceFeet <= 1000 && distanceFeet > 900 && !hasAnnounced1000FtRef.current) {
      const instruction = currentStep.maneuver.instruction
      speak(`In 1000 feet, ${instruction}`)
      hasAnnounced1000FtRef.current = true
    }

    if (distanceFeet <= 50 && distanceFeet > 40 && !hasAnnounced50FtRef.current) {
      // Check if there are nearby intersections that could confuse the driver
      // Look at the next 2 steps to see if there are turns within 200 feet
      let hasNearbyTurns = false
      if (currentStepIndex + 1 < routeStepsRef.current.length) {
        const nextStep = routeStepsRef.current[currentStepIndex + 1]
        const nextStepDistance = nextStep.distance * 3.28084 // Convert to feet

        // If the next turn is within 200 feet, there might be confusion
        if (nextStepDistance < 200) {
          hasNearbyTurns = true
        }
      }

      // Only announce at 50 ft if it's unambiguous
      if (!hasNearbyTurns) {
        const instruction = currentStep.maneuver.instruction
        let announcement = instruction

        if (instruction.toLowerCase().includes("left")) {
          announcement = `Turn left here`
        } else if (instruction.toLowerCase().includes("right")) {
          announcement = `Turn right here`
        } else if (instruction.toLowerCase().includes("exit")) {
          announcement = `Take the exit now`
        }

        speak(announcement)
      }
      hasAnnounced50FtRef.current = true
    }

    if (distanceMeters < 30 && currentStepIndex < routeStepsRef.current.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
      setLastDistanceAnnouncement(-1)
      lastAnnouncedStepRef.current = -1
      // Reset announcement flags for the new step
      hasAnnounced1000FtRef.current = false
      hasAnnounced50FtRef.current = false

      // Announce next turn
      const nextStep = routeStepsRef.current[currentStepIndex + 1]
      if (nextStep) {
        const nextInstruction = nextStep.maneuver.instruction
        const nextDistance = (nextStep.distance / 1609.34).toFixed(1)

        let announcement = nextInstruction

        // Highway on-ramp announcements
        if (nextInstruction.toLowerCase().includes("ramp")) {
          const hwMatch = nextStep.name?.match(/I-?(\d+)|Highway\s+(\d+)/i)
          if (hwMatch) {
            const hwNumber = hwMatch[1] || hwMatch[2]
            const hwType = nextStep.name.toLowerCase().includes("i-") ? "Interstate" : "Highway"
            // Calculate distance to the ramp for the ramp, considering potential next steps
            let distanceToRampExit = nextStep.distance
            if (routeStepsRef.current[currentStepIndex + 2]) {
              distanceToRampExit += routeStepsRef.current[currentStepIndex + 2].distance
            }
            const proceedDistance = (distanceToRampExit / 1609.34).toFixed(0)

            // Attempt to find the next exit number if available
            let nextExitNumber = ""
            if (routeStepsRef.current[currentStepIndex + 2]) {
              const exitInstructionMatch =
                routeStepsRef.current[currentStepIndex + 2].maneuver.instruction.match(/exit\s+(\d+)/i)
              if (exitInstructionMatch) {
                nextExitNumber = ` to exit ${exitInstructionMatch[1]}`
              }
            }
            announcement = `Take the on-ramp to ${hwType} ${hwNumber}${nextExitNumber}. Proceed for ${proceedDistance} miles.`
          }
        }

        // City driving multi-light instructions
        if (nextInstruction.toLowerCase().includes("continue") || nextInstruction.toLowerCase().includes("straight")) {
          let lightCount = 0
          const straightInstructionIndex = currentStepIndex + 1 // Start looking from the actual next step

          for (
            let i = straightInstructionIndex;
            i < Math.min(straightInstructionIndex + 10, routeStepsRef.current.length);
            i++
          ) {
            const instr = routeStepsRef.current[i].maneuver.instruction.toLowerCase()
            if (instr.includes("continue") || instr.includes("straight")) {
              lightCount++
            } else {
              const afterInstr = routeStepsRef.current[i].maneuver.instruction
              if (afterInstr.toLowerCase().includes("left")) {
                announcement = `Continue straight through the next ${lightCount + 1} lights, then merge into the left lane`
              } else if (afterInstr.toLowerCase().includes("right")) {
                announcement = `Continue straight through the next ${lightCount + 1} lights, then merge into the right lane`
              } else {
                // If the next instruction is not a turn but something else, just use the first instruction
                announcement = nextInstruction
              }
              break
            }
            // If we've reached the end of the route steps while continuing straight
            if (i === Math.min(straightInstructionIndex + 10, routeStepsRef.current.length) - 1) {
              announcement = `Continue straight for the next ${lightCount + 1} instructions`
            }
          }
        }

        // Standard instruction if no special logic applied
        if (
          !announcement.includes("continue") &&
          !announcement.includes("straight") &&
          !announcement.includes("ramp") &&
          !announcement.includes("exit")
        ) {
          announcement = nextInstruction
        }

        speak(`${announcement} in ${nextDistance} miles`)

        const mockInstructions: TurnInstruction[] = routeStepsRef.current.map((step: any, index: number) => ({
          id: String(index + 1),
          instruction: step.maneuver.instruction,
          distance: `${(step.distance / 1609.34).toFixed(1)} mi`,
          roadName: step.name || "Unknown Road",
        }))

        setCurrentInstruction(mockInstructions[currentStepIndex + 1])
        setUpcomingInstructions(mockInstructions.slice(currentStepIndex + 2, currentStepIndex + 7))
      }
    }
  }, [userPosition, navigationMode, currentStepIndex, selectedRoute, destination, isBackgroundMode])

  const getPOIIcon = async (type: POI["type"]) => {
    // Removed L import, as Mapbox is used directly
    const iconConfig = {
      gas: { color: "#16a34a", icon: "⛽" },
      food: { color: "#f59e0b", icon: "🍔" },
      restroom: { color: "#3b82f6", icon: "🚻" },
    }

    const config = iconConfig[type]
    const iconElement = document.createElement("div")
    iconElement.className = "poi-marker"
    iconElement.style.width = "32px"
    iconElement.style.height = "32px"
    iconElement.style.background = config.color
    iconElement.style.border = "2px solid white"
    iconElement.style.borderRadius = "50%"
    iconElement.style.display = "flex"
    iconElement.style.alignItems = "center"
    iconElement.style.justifyContent = "center"
    iconElement.style.fontSize = "16px"
    iconElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)"
    iconElement.innerHTML = config.icon
    return iconElement
  }

  const stopNavigation = () => {
    if (navigationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(navigationWatchIdRef.current)
      navigationWatchIdRef.current = null
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    releaseWakeLock()
    localStorage.removeItem("activeNavigation")

    setNavigationMode("idle")
    setCurrentInstruction(null)
    setUpcomingInstructions([])
    setNearbyPOIs([])
    setSelectedRoute(null)
    setRouteOptions([])
    setUserPosition(null)
    setDistanceToNextTurn(0)
    setLastDistanceAnnouncement(-1)
    routeStepsRef.current = []
    lastAnnouncedStepRef.current = -1

    // Reset announcement flags
    hasAnnounced1000FtRef.current = false
    hasAnnounced50FtRef.current = false

    if (routeLineRef.current) {
      routeLineRef.current.forEach((line: any) => line.remove())
      routeLineRef.current = null
    }

    if (mapRef.current && userLocation) {
      mapRef.current.setCenter([userLocation.lng, userLocation.lat]) // Use mapboxgl setCenter
      mapRef.current.setZoom(15)
    }

    toast({
      title: "Navigation Ended",
      description: "You have arrived at your destination",
    })
  }

  const handleAllowLocation = () => {
    setShowLocationDialog(false)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMountedRef.current) {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
            toast({
              title: "Location Enabled",
              description: "Your location has been detected successfully",
            })
          }
        },
        () => {
          if (isMountedRef.current) {
            setUserLocation({ lat: 37.7749, lng: -122.4194 })
            toast({
              title: "Location Access Denied",
              description: "Using default location. Enable location in browser settings for better experience.",
            })
          }
        },
      )
    }
  }

  const handleDenyLocation = () => {
    setShowLocationDialog(false)
    setUserLocation({ lat: 37.7749, lng: -122.4194 })
    toast({
      title: "Location Not Enabled",
      description: "Using default location. You can enable it later in settings.",
    })
  }

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled)

    if (!voiceEnabled) {
      speak("Voice guidance enabled")
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      toast({
        title: "Voice Muted",
        description: "Voice guidance has been turned off",
      })
    }
  }

  const handleStartPointFocus = () => {
    if (userLocation && !startPoint) {
      setStartPoint("Current Location")
      toast({
        title: "Current Location Set",
        description: "Using your current GPS location as starting point",
      })
    }
  }

  const handleRequestRide = async () => {
    if (!userPosition || !destination) {
      // Changed from pickupLocation to userPosition
      toast({
        title: "Missing Information",
        description: "Please set both pickup and destination locations",
      })
      return
    }

    // Check if drivers are available
    const driversResponse = await fetch(
      `/api/rideshare/drivers?city=${userPosition.city || ""}&lat=${userPosition.lat}&lng=${userPosition.lng}`, // Changed from pickupLocation
    )
    const driversData = await driversResponse.json()

    if (!driversData.success || driversData.drivers.length === 0) {
      setWaitlistCity(userPosition.city || "") // Changed from pickupLocation
      setShowWaitlistDialog(true)
      return
    }

    // Continue with normal ride request flow
    // ... existing ride request code ...
  }

  const getCurrentUserLocation = () => {
    console.log("[v0] Getting current location...")

    if (!navigator.geolocation) {
      console.log("[v0] Geolocation not supported")
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation",
      })
      // Use default location
      setUserLocation({ lat: 37.7749, lng: -122.4194 })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("[v0] Location obtained:", position.coords.latitude, position.coords.longitude)
        if (isMountedRef.current) {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          toast({
            title: "Location Enabled",
            description: "Your location has been detected successfully",
          })
        }
      },
      (error) => {
        console.error("[v0] Geolocation error:", error.message)
        if (isMountedRef.current) {
          // Use San Francisco as default fallback
          setUserLocation({ lat: 37.7749, lng: -122.4194 })
          toast({
            title: "Location Access Denied",
            description: "Using default location. Enable location in browser settings for better experience.",
          })
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  return (
    <div className="relative">
      <LocationPermissionDialog show={showLocationDialog} onAllow={handleAllowLocation} onDeny={handleDenyLocation} />

      {!tokenLoading &&
        !mapboxToken &&
        !mapError && ( // Added mapError check to hide this conditional only if token is missing or map error occurred
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <div className="max-w-md space-y-4 rounded-lg border border-border bg-card p-6 text-center shadow-lg">
              <div className="flex justify-center">
                <svg className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Map Configuration Required</h3>
                <p className="text-sm text-muted-foreground">
                  The interactive map requires a Mapbox API token to function.
                </p>
              </div>
              <div className="space-y-2 rounded border border-border bg-muted/50 p-4 text-left text-xs">
                <p className="font-semibold">To enable the map:</p>
                <ol className="ml-4 list-decimal text-muted-foreground">
                  <li>Get a free token at mapbox.com/account</li>
                  <li>Add MAPBOX_TOKEN to environment variables</li>
                  <li>Redeploy your application</li>
                </ol>
              </div>
            </div>
          </div>
        )}

      {tokenLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      <Card className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-amber-900">Pi-Accepting Businesses</h3>
          <p className="text-sm text-amber-800">
            Look for the golden Pi symbol (π) on the map to find businesses that accept Pi cryptocurrency! Support the
            Pi ecosystem by choosing Pi-friendly merchants.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-amber-500 text-white">{piBusinesses.length} businesses nearby</Badge>
          </div>
        </div>
      </Card>

      {/* Navigation Planning Panel */}
      {/* Enhanced location button to show in "Plan Your Route" section */}
      <Card className="bg-white/95 backdrop-blur-sm border-2 border-slate-300 p-4 mb-4">
        <h3 className="font-semibold text-lg mb-3">Plan Your Route</h3>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-900">
              {userLocation
                ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                : "Location not detected"}
            </span>
          </div>
          <Button onClick={getCurrentUserLocation} size="sm" variant="outline" className="gap-2 bg-transparent">
            <Locate className="w-4 h-4" />
            Get Location
          </Button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <label className="text-sm font-medium mb-1 block">Starting Point</label>
            <Input
              placeholder="Current location or enter address"
              value={startPoint}
              onFocus={handleStartPointFocus}
              onChange={(e) => {
                setStartPoint(e.target.value)
                searchAddress(e.target.value, "start")
              }}
              onBlur={() => setTimeout(() => setShowStartSuggestions(false), 200)}
              className="bg-white"
            />
            {showStartSuggestions && addressSuggestions.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border shadow-lg">
                {addressSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectAddress(suggestion, "start")}
                    className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                  >
                    <p className="text-sm font-medium">{suggestion.text}</p>
                    <p className="text-xs text-slate-600">{suggestion.place_name}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
          <div className="relative">
            <label className="text-sm font-medium mb-1 block">Destination</label>
            <Input
              placeholder="Enter destination address"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value)
                searchAddress(e.target.value, "destination")
              }}
              onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              className="bg-white"
            />
            {showDestSuggestions && addressSuggestions.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 max-h-48 overflow-y-auto bg-white border shadow-lg">
                {addressSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectAddress(suggestion, "destination")}
                    className="p-3 hover:bg-slate-100 cursor-pointer border-b last:border-b-0"
                  >
                    <p className="text-sm font-medium">{suggestion.text}</p>
                    <p className="text-xs text-slate-600">{suggestion.place_name}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
          <Button onClick={calculateRoutes} className="w-full bg-purple-600 hover:bg-purple-700">
            <Route className="w-4 h-4 mr-2" />
            Find Routes
          </Button>
        </div>
      </Card>

      {/* Map */}
      <Card className="overflow-hidden bg-card/95 backdrop-blur-md border-2 border-slate-300 mb-4 relative">
        {mapError && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/95 backdrop-blur-sm p-6">
            <div className="max-w-md text-center space-y-4">
              <div className="text-5xl">🗺️</div>
              <h3 className="text-lg font-semibold text-slate-900">Map Unavailable</h3>
              <p className="text-sm text-slate-600">{mapError}</p>
              <div className="text-xs text-slate-500 mt-2">
                <p>For the best experience with interactive maps:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Use Chrome, Firefox, or Safari</li>
                  <li>• Update your browser to the latest version</li>
                  <li>• Enable WebGL in browser settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <div
          ref={mapContainerRef}
          className="w-full h-[600px] md:h-[700px] bg-slate-100"
          style={{ minHeight: "600px" }}
        />

        {isMapReady &&
          !mapError && ( // Added !mapError condition to hide controls when map is unavailable
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <Button
                onClick={centerOnUser}
                size="icon"
                className="bg-white/95 backdrop-blur-sm shadow-lg hover:bg-white text-slate-900"
              >
                <Locate className="w-5 h-5" />
              </Button>

              <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-md overflow-hidden">
                <Select value={selectedAlertType} onValueChange={handleAlertTypeSelect}>
                  <SelectTrigger className="w-[200px] border-0 bg-transparent">
                    <SelectValue placeholder="Mark Road Spot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="police">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span>Police 👮</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="broke-down">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-amber-500" />
                        <span>Car Broke Down 🔧</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="wreck">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Wreck 🚗💥</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="hazard">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span>Road Hazard ⚠️</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="detour">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-purple-500" />
                        <span>Detour ↩️</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isPlacingMarker && (
                <Button
                  onClick={() => {
                    setIsPlacingMarker(false)
                    setSelectedAlertType("")
                    toast({
                      title: "Cancelled",
                      description: "Marker placement cancelled",
                    })
                  }}
                  size="sm"
                  variant="destructive"
                  className="shadow-lg"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          )}
      </Card>

      {/* Route Options */}
      {navigationMode === "planning" && routeOptions.length > 0 && (
        <Card className="mb-4 p-4 bg-white/95 backdrop-blur-md border-2 border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Choose Your Route</h3>
            <Button onClick={toggleVoice} size="sm" variant={voiceEnabled ? "default" : "outline"} className="gap-2">
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {voiceEnabled ? "Voice On" : "Voice Off"}
            </Button>
          </div>
          <div className="space-y-2 mb-4">
            {routeOptions.map((route, index) => (
              <div
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedRoute?.id === route.id
                    ? "border-purple-600 bg-purple-50"
                    : "border-slate-200 hover:border-purple-300 bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{route.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {route.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.duration}
                      </span>
                    </div>
                  </div>
                  {index === 0 && <Badge className="bg-green-100 text-green-800">Fastest</Badge>}
                </div>
                {route.warnings.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 mt-2">
                    <AlertTriangle className="w-3 h-3" />
                    {route.warnings.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button onClick={startNavigation} className="flex-1 bg-purple-600 hover:bg-purple-700">
            <Play className="w-4 h-4 mr-2" />
            Start Navigation
          </Button>
          <Button onClick={() => setNavigationMode("idle")} variant="outline" className="ml-2 flex-1">
            Cancel
          </Button>
        </Card>
      )}

      {/* Active Navigation Panel */}
      {navigationMode === "navigating" && (
        <>
          <Card className="mb-4 p-4 bg-purple-600 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-6 h-6" />
                <span className="text-sm font-medium">Navigation Active</span>
                {voiceEnabled && (
                  <Badge className="bg-white/20 text-white border-0">
                    <Volume2 className="w-3 h-3 mr-1" />
                    Voice On
                  </Badge>
                )}
                {isBackgroundMode && <Badge className="bg-green-500/80 text-white border-0">Background</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={toggleVoice} size="sm" variant="secondary" className="h-8 px-2">
                  {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button onClick={stopNavigation} size="sm" variant="secondary">
                  End
                </Button>
              </div>
            </div>
            {currentInstruction && (
              <div className="mt-3">
                <p className="text-2xl font-bold mb-1">{currentInstruction.instruction}</p>
                <p className="text-purple-100">in {currentInstruction.distance}</p>
              </div>
            )}
            {isBackgroundMode && (
              <div className="mt-3 p-2 bg-white/10 rounded text-sm">
                ℹ️ Navigation running in background. Audio directions will continue.
              </div>
            )}
          </Card>

          {/* Upcoming Turns */}
          <Card className="mb-4 p-4 bg-white/95 backdrop-blur-md border-2 border-slate-300">
            <h4 className="font-semibold text-sm mb-2">Upcoming Turns</h4>
            <div className="space-y-2">
              {upcomingInstructions.slice(0, 3).map((instruction, index) => (
                <div key={instruction.id} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-400 font-mono">{index + 2}.</span>
                  <div>
                    <p className="font-medium">{instruction.instruction}</p>
                    <p className="text-xs text-slate-500">{instruction.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Points of Interest */}
          <Card className="mb-4 p-4 bg-white/95 backdrop-blur-md border-2 border-slate-300">
            <h4 className="font-semibold text-sm mb-2">Along Your Route</h4>
            <div className="space-y-2">
              {nearbyPOIs.map((poi) => (
                <div key={poi.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {poi.type === "gas" && <Fuel className="w-4 h-4 text-green-600" />}
                    {poi.type === "food" && <Utensils className="w-4 h-4 text-amber-600" />}
                    {poi.type === "restroom" && <Coffee className="w-4 h-4 text-blue-600" />}
                    <div>
                      <p className="text-sm font-medium">{poi.name}</p>
                      <p className="text-xs text-slate-500">{poi.distance}</p>
                    </div>
                  </div>
                  {poi.price && <span className="text-sm font-bold text-green-600">{poi.price}/gal</span>}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {navigationMode === "idle" && (
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          <Button
            onClick={() => setShowHomeAddressDialog(true)}
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm gap-2"
          >
            <Home className="w-4 h-4" />
            {homeAddress ? "Change Home" : "Set Home"}
          </Button>
          {homeAddress && (
            <Button onClick={returnHome} size="sm" className="bg-purple-600 hover:bg-purple-700 gap-2">
              <Home className="w-4 h-4" />
              Return Home
            </Button>
          )}
        </div>
      )}

      <Dialog open={showHomeAddressDialog} onOpenChange={setShowHomeAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Home Address</DialogTitle>
            <DialogDescription>Enter your home address to quickly navigate home anytime</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter your home address"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={() => saveHomeAddress(homeAddress)} disabled={!homeAddress.trim()} className="flex-1">
                Save Home Address
              </Button>
              <Button onClick={() => setShowHomeAddressDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add waitlist dialog in JSX */}
      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Drivers Available</DialogTitle>
            <DialogDescription>
              There are currently no drivers available in {waitlistCity || "your area"}. Would you like to join the
              waitlist?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll send you a notification as soon as drivers become available in your area.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleJoinWaitlist} className="flex-1">
                Join Waitlist
              </Button>
              <Button onClick={() => setShowWaitlistDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="mt-4 p-4 bg-white/95 backdrop-blur-md border-2 border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">Active Alerts</h3>
          <Badge variant="secondary">{roadAlerts.length} reported</Badge>
        </div>
        {roadAlerts.length === 0 ? (
          <p className="text-sm text-slate-600">No alerts in your area. Select an alert type to report one.</p>
        ) : (
          <div className="space-y-2">
            {roadAlerts
              .slice(-5)
              .reverse()
              .map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                  <div className="mt-1">
                    {alert.type === "wreck" && <XCircle className="w-4 h-4 text-red-600" />}
                    {alert.type === "police" && <Shield className="w-4 h-4 text-blue-500" />}
                    {alert.type === "broke-down" && <Car className="w-4 h-4 text-amber-500" />}
                    {alert.type === "hazard" && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    {alert.type === "detour" && <Navigation className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getAlertTitle(alert.type)}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      by {alert.userName} • {getTimeAgo(alert.timestamp)} • {alert.confirmCount} confirmed
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRoadAlerts((prev) => prev.filter((a) => a.id !== alert.id))
                      toast({
                        title: "Alert Cleared",
                        description: "Thank you for keeping the map updated!",
                      })
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Clear
                  </Button>
                </div>
              ))}
          </div>
        )}
      </Card>
    </div>
  )
}
