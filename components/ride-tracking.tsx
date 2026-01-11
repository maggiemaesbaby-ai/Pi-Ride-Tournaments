"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MessageSquare, X, MapPin, Navigation, Star, User, Share2, AlertTriangle, Car } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RatingDialog } from "@/components/rating-dialog"
import { submitRating } from "@/lib/rating-system"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { TripShareDialog } from "@/components/trip-share-dialog"
import { EmergencySOS } from "@/components/emergency-sos"
import { driverDB } from "@/lib/driver-db"

interface RideTrackingProps {
  ride: {
    name: string
    service: string
    price: number
    time: string
    rating: number
  }
  pickup: string
  destination: string
  onClose: () => void
  rideRequestId?: string
  isDemo?: boolean // Added isDemo prop
  pickupCoords?: { lat: number; lng: number } // Added pickup coordinates
  destCoords?: { lat: number; lng: number } // Added destination coordinates
}

export function RideTracking({
  ride,
  pickup,
  destination,
  onClose,
  rideRequestId,
  isDemo = false,
  pickupCoords,
  destCoords,
}: RideTrackingProps) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [tripStatus, setTripStatus] = useState("finding_driver")
  const [tripPhase, setTripPhase] = useState<"pickup" | "dropoff">("pickup")
  const [eta, setEta] = useState(5)
  const [distance, setDistance] = useState(0)
  const [currentStreet, setCurrentStreet] = useState("")
  const [nextTurn, setNextTurn] = useState("")
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [tripCompleted, setTripCompleted] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showSOSDialog, setShowSOSDialog] = useState(false)
  const [driverInfo, setDriverInfo] = useState<any>(null)
  const [showVideoOverlay, setShowVideoOverlay] = useState(false)
  const [videoPhase, setVideoPhase] = useState<"pickup" | "dropoff" | null>(null)
  const [showArrivalMessage, setShowArrivalMessage] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const routeLayerRef = useRef<any>(null)
  const { toast } = useToast()
  const { user } = usePiWallet()

  useEffect(() => {
    if (!rideRequestId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rides/status?requestId=${rideRequestId}`)
        const data = await response.json()

        if (data.success && data.request) {
          if (data.request.status === "accepted" && data.driver) {
            setTripStatus("driver_assigned")
            setDriverInfo(data.driver)

            if (data.driver.currentLat && data.driver.currentLng) {
              setDriverLocation({
                lat: data.driver.currentLat,
                lng: data.driver.currentLng,
              })
            }

            toast({
              title: "Driver Found!",
              description: `${data.driver.name} is on the way`,
            })
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch ride status:", error)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [rideRequestId])

  const calculateStartPosition = (pickup: { lat: number; lng: number }) => {
    // 0.5 miles = 0.00724 degrees approximately
    const offset = 0.00724
    // Start southwest of pickup
    return {
      lat: pickup.lat - offset * 0.7,
      lng: pickup.lng - offset * 0.7,
    }
  }

  useEffect(() => {
    if (isDemo && pickupCoords && destCoords) {
      const startPos = calculateStartPosition(pickupCoords)

      setUserLocation(pickupCoords)
      setDriverLocation(startPos)

      console.log("[v0] Demo mode: Fetching real route from start → pickup → destination")

      // Fetch actual road route
      fetch("/api/route-directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          waypoints: [startPos, pickupCoords, destCoords],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.route) {
            console.log("[v0] Demo route received:", data.route.length, "waypoints")
            animateDemoRide(data.route, data.instructions || [], pickupCoords)
          } else {
            console.error("[v0] Failed to fetch route, falling back to simple animation")
            // Fallback to simple animation
          }
        })
        .catch((error) => {
          console.error("[v0] Route fetch error:", error)
        })

      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(coords)
        setDriverLocation({
          lat: coords.lat + 0.01,
          lng: coords.lng + 0.01,
        })
      },
      (error) => {
        console.error("Error getting location:", error)
        const fallbackLocation = { lat: 40.7128, lng: -74.006 }
        setUserLocation(fallbackLocation)
        setDriverLocation({
          lat: fallbackLocation.lat + 0.01,
          lng: fallbackLocation.lng + 0.01,
        })
      },
    )
  }, [isDemo, pickupCoords, destCoords])

  const animateDemoRide = (
    routePoints: { lat: number; lng: number }[],
    instructions: any[],
    pickupLocation: { lat: number; lng: number },
  ) => {
    const simulationDuration = 20000 // 20 seconds total (not including video overlays)
    const updateInterval = 100
    const totalSteps = simulationDuration / updateInterval

    let currentStepIndex = 0
    const pointsPerStep = Math.max(1, Math.floor(routePoints.length / totalSteps))

    const allLats = routePoints.map((p) => p.lat)
    const allLngs = routePoints.map((p) => p.lng)
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...allLats), Math.min(...allLngs)],
      [Math.max(...allLats), Math.max(...allLngs)],
    ]

    setTripStatus("driver_assigned")
    setCurrentStreet("Demo Ride Starting - Driver En Route to Pickup")
    setNextTurn("🚗 Watch the Pi Car navigate to your location!")

    toast({
      title: "🎮 Demo Ride Started!",
      description: "Watch the Pi car follow GPS directions to pick you up, then to your destination!",
      duration: 5000,
    })

    if (mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [80, 80], // More padding to see full route
        animate: true,
        duration: 1.5,
      })
    }

    let isPaused = false
    let pauseUntilStep = 0

    const animationInterval = setInterval(() => {
      if (isPaused && currentStepIndex < pauseUntilStep) {
        currentStepIndex++
        return
      }
      isPaused = false

      currentStepIndex++

      if (currentStepIndex >= totalSteps || currentStepIndex * pointsPerStep >= routePoints.length) {
        clearInterval(animationInterval)
        setTimeout(() => {
          setShowArrivalMessage(true)
          setTimeout(() => setShowArrivalMessage(false), 3000)
        }, 500)

        setTimeout(() => {
          setShowVideoOverlay(true)
          setVideoPhase("dropoff")
          setTimeout(() => {
            setShowVideoOverlay(false)
            setVideoPhase(null)
            setTripStatus("completed")
            setShowRatingDialog(true)
            setTripCompleted(true)
          }, 8000) // 8-second closing video
        }, 3500)
        return
      }

      const currentPointIndex = Math.min(currentStepIndex * pointsPerStep, routePoints.length - 1)
      const currentPoint = routePoints[currentPointIndex]
      const remainingPoints = routePoints.slice(currentPointIndex)

      setDriverLocation(currentPoint)

      const totalDistance = routePoints.length * 0.001
      const remainingDist = remainingPoints.length * 0.001
      const progress = 1 - remainingDist / totalDistance

      setDistance(remainingDist)
      setEta((remainingDist / 30) * 60)

      const isArrivingAtPickup = progress >= 0.43 && progress <= 0.47 && !isPaused

      if (isArrivingAtPickup) {
        isPaused = true
        pauseUntilStep = currentStepIndex + 80 // Pause for 8 seconds (80 steps)

        setTripStatus("driver_arrived")
        setCurrentStreet("📍 Driver Arrived at Pickup Location")
        setNextTurn("Your driver is here!")

        setShowVideoOverlay(true)
        setVideoPhase("pickup")

        toast({
          title: "🚗 Driver Arrived!",
          description: "Your driver has arrived and is opening the door!",
          duration: 4000,
        })

        setTimeout(() => {
          setShowVideoOverlay(false)
          setVideoPhase(null)
          setTripPhase("dropoff")
          setTripStatus("in_transit")
          setCurrentStreet("📍 On the Way to Destination")
          setNextTurn("Enjoy your ride!")

          toast({
            title: "🎵 Trip in Progress!",
            description: "Sit back and enjoy the ride to your destination",
            duration: 3000,
          })
        }, 8000) // 8-second opening video
      }

      if (tripPhase === "pickup") {
        if (progress < 0.2) {
          setCurrentStreet("Starting route to pickup")
          setNextTurn(`Driver ${remainingDist.toFixed(1)} mi away`)
        } else if (progress < 0.4) {
          setCurrentStreet("Following GPS directions")
          setNextTurn(`Arriving in ${Math.ceil(eta)} minutes`)
        } else {
          setCurrentStreet("Approaching pickup location")
          setNextTurn(`Almost there - ${remainingDist.toFixed(1)} mi`)
        }
      } else {
        if (progress < 0.7) {
          setCurrentStreet("En route to destination")
          setNextTurn(`${remainingDist.toFixed(1)} miles remaining`)
        } else {
          setCurrentStreet("Approaching destination")
          setNextTurn(`Arriving soon - ${remainingDist.toFixed(1)} mi`)
        }
      }

      if (routeLayerRef.current && userLocation) {
        routeLayerRef.current.setLatLngs(remainingPoints)
      }
    }, updateInterval)
  }

  useEffect(() => {
    if (!mapRef.current || !userLocation || mapInstanceRef.current) return

    import("leaflet").then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: true,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map)

      const userIcon = L.divIcon({
        className: "user-marker",
        html: `
          <div style="
            width: 30px; 
            height: 30px; 
            background: #10b981; 
            border: 4px solid white; 
            border-radius: 50%; 
            position: relative;
          ">
            <div style="
              position: absolute;
              top: -35px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 4px 8px;
              border-radius: 4px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              white-space: nowrap;
              font-size: 12px;
              font-weight: bold;
              color: #10b981;
            ">Pickup</div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map)
      userMarkerRef.current = userMarker

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [userLocation]) // Only re-initialize if userLocation changes

  useEffect(() => {
    if (!driverLocation || !userLocation || !mapInstanceRef.current) return

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current
      if (!map) return

      if (!driverMarkerRef.current) {
        const driverIcon = L.divIcon({
          className: "driver-marker",
          html: `
            <div style="
              width: 40px; 
              height: 40px; 
              background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); 
              border: 4px solid white; 
              border-radius: 50%; 
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="font-size: 20px;">🚗</span>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })

        const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(map)
        driverMarkerRef.current = driverMarker

        const routeLine = L.polyline(
          [
            [driverLocation.lat, driverLocation.lng],
            [userLocation.lat, userLocation.lng],
          ],
          {
            color: "#8b5cf6",
            weight: 4,
            opacity: 0.7,
            dashArray: "10, 10",
          },
        ).addTo(map)
        routeLayerRef.current = routeLine

        map.fitBounds(
          [
            [driverLocation.lat, driverLocation.lng],
            [userLocation.lat, userLocation.lng],
          ],
          { padding: [50, 50] },
        )
      } else {
        driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])

        if (routeLayerRef.current) {
          routeLayerRef.current.setLatLngs([
            [driverLocation.lat, driverLocation.lng],
            [userLocation.lat, userLocation.lng],
          ])
        }
      }
    })
  }, [driverLocation, userLocation])

  useEffect(() => {
    if (isDemo) return

    if (!driverLocation || !userLocation) return

    const simulationDuration = 20000 // 20 seconds
    const updateInterval = 500
    const steps = simulationDuration / updateInterval

    const findDriverTimer = setTimeout(() => {
      if (tripStatus === "finding_driver" && !driverInfo) {
        setTripStatus("driver_assigned")
        setCurrentStreet("Main Street")
        setNextTurn(`Turn left on Oak Avenue in 0.3 miles`)
        toast({
          title: "Driver assigned!",
          description: "Your driver is on the way. Watch your 20-second simulation!",
        })
      }
    }, 1000)

    let currentStep = 0

    const locationInterval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setDriverLocation((prevDriver) => {
        if (!prevDriver || !userLocation) return prevDriver

        const latDiff = userLocation.lat - prevDriver.lat
        const lngDiff = userLocation.lng - prevDriver.lng

        const stepSize = 1 / steps
        const newLat = prevDriver.lat + latDiff * stepSize
        const newLng = prevDriver.lng + lngDiff * stepSize

        const distanceRemaining = Math.sqrt(
          Math.pow((userLocation.lat - newLat) * 69, 2) + Math.pow((userLocation.lng - newLng) * 69, 2),
        )

        setDistance(distanceRemaining)

        if (progress < 0.3) {
          setCurrentStreet("Main Street")
          setNextTurn(`Turn left on Oak Avenue in ${distanceRemaining.toFixed(1)} miles`)
        } else if (progress < 0.6) {
          setCurrentStreet("Oak Avenue")
          setNextTurn(`Turn right on Pine Street in ${distanceRemaining.toFixed(1)} miles`)
        } else if (progress < 0.9) {
          setCurrentStreet("Pine Street")
          setNextTurn(`Arriving at destination in ${distanceRemaining.toFixed(1)} miles`)
        } else {
          setCurrentStreet("At pickup location")
          setNextTurn("Driver arriving now!")
        }

        const newEta = Math.max(0.5, (simulationDuration - currentStep * updateInterval) / 60000)
        setEta(newEta)

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([newLat, newLng])
        }

        if (routeLayerRef.current) {
          routeLayerRef.current.setLatLngs([
            [newLat, newLng],
            [userLocation.lat, userLocation.lng],
          ])
        }

        if (mapInstanceRef.current) {
          if (progress > 0.8) {
            mapInstanceRef.current.setView([newLat, newLng], 18, { animate: true, duration: 0.5 })
          } else if (progress > 0.5) {
            mapInstanceRef.current.setView([newLat, newLng], 16, { animate: true, duration: 0.5 })
          }
        }

        return { lat: newLat, lng: newLng }
      })
    }, updateInterval)

    const completionTimer = setTimeout(() => {
      setTripStatus("driver_arrived")
      setEta(0)
      setDistance(0)
      setCurrentStreet("At pickup location")
      setNextTurn("Your driver is here!")

      if (mapInstanceRef.current && userLocation) {
        mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 18, { animate: true })
      }

      toast({
        title: "Simulation Complete!",
        description: "This was a demo of what you can expect when tracking your real ride.",
        duration: 5000,
      })
    }, simulationDuration)

    return () => {
      clearTimeout(findDriverTimer)
      clearTimeout(completionTimer)
      clearInterval(locationInterval)
    }
  }, [userLocation, toast, tripStatus, driverInfo])

  const statusMessages = {
    finding_driver: "Finding your driver...",
    driver_assigned: "Driver is on the way",
    driver_arrived: "Driver has arrived!",
    en_route: "En route to destination",
    completed: "Trip completed successfully!",
  }

  const continueToDropoff = () => {
    setTripPhase("dropoff")
    setTripStatus("en_route")
    setCurrentStreet("En route to destination")
    setNextTurn("Follow the route to your destination")
    toast({
      title: "Trip Started",
      description: "Tracking your ride to the destination",
    })
  }

  const handleRatingSubmit = (rating: number, review: string) => {
    if (user?.uid && driverInfo) {
      const bookingId = `booking-${Date.now()}`

      submitRating(user.uid, driverInfo.id || "unknown", bookingId, "ride", rating, review)

      if (rideRequestId) {
        driverDB.completeRide(rideRequestId, rating)
      }

      toast({
        title: "Thank you!",
        description: "Your rating helps improve our service",
      })
    }

    setShowRatingDialog(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl bg-white/98 backdrop-blur-md border-2 border-slate-300 shadow-2xl max-h-[95vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Track Your Ride</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setShowShareDialog(true)} title="Share Trip">
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => setShowSOSDialog(true)} title="Emergency SOS">
                  <AlertTriangle className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <Card className="p-4 bg-primary/10 border-2 border-primary mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-900">
                    {statusMessages[tripStatus as keyof typeof statusMessages]}
                  </p>
                  {tripStatus !== "finding_driver" && !tripCompleted && (
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">ETA:</span> {Math.ceil(eta)} min
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">Distance:</span> {distance.toFixed(2)} mi
                      </p>
                    </div>
                  )}
                  {tripCompleted && (
                    <p className="text-sm text-green-600 font-semibold mt-2">Trip completed successfully!</p>
                  )}
                </div>
                {tripStatus === "finding_driver" && (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
                )}
              </div>
            </Card>

            {tripStatus !== "finding_driver" && currentStreet && !tripCompleted && (
              <Card className="p-4 bg-blue-50 border-2 border-blue-200 mb-6">
                <div className="flex items-start gap-3">
                  <Navigation className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">Current: {currentStreet}</p>
                    <p className="text-sm text-slate-600 mt-1">{nextTurn}</p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="h-[400px] mb-6 relative overflow-hidden border-2 border-slate-300">
              <div ref={mapRef} className="w-full h-full" />
              {tripStatus === "finding_driver" && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
                    <p className="text-lg font-semibold text-slate-900">Finding your driver...</p>
                  </div>
                </div>
              )}
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {tripStatus !== "finding_driver" && (
                <Card className="p-4 border-2 border-slate-300">
                  <h3 className="font-semibold mb-3 text-slate-900">Driver Details</h3>
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-600 mb-2 font-medium">Driver</p>
                      <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                        {driverInfo?.photoUrl ? (
                          <img
                            src={driverInfo.photoUrl || "/placeholder.svg"}
                            alt={driverInfo.name || "Driver"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <User className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-600 mb-2 font-medium">Vehicle</p>
                      <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-purple-200">
                        {driverInfo?.vehiclePhotoUrl ? (
                          <img
                            src={driverInfo.vehiclePhotoUrl || "/placeholder.svg"}
                            alt="Vehicle"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                            <Car className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="font-bold text-slate-900">{driverInfo?.name || "John Smith"}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Star className="w-4 h-4 fill-secondary text-secondary" />
                      <span>{driverInfo?.rating || ride.rating} rating</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {driverInfo?.vehicleMake || "Toyota"} {driverInfo?.vehicleModel || "Camry"} •{" "}
                      {driverInfo?.licensePlate || "ABC 1234"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-transparent" variant="outline">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button className="flex-1 bg-transparent" variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  </div>
                </Card>
              )}

              <Card className="p-4 border-2 border-slate-300">
                <h3 className="font-semibold mb-3 text-slate-900">Ride Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600">Pickup</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600">Destination</p>
                      <p className="text-sm font-medium text-slate-900 truncate">{destination}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Ride Type</span>
                      <span className="font-medium text-slate-900">{ride.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Service</span>
                      <span className="font-medium text-primary">{ride.service}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Total Paid</span>
                      <span className="font-bold text-primary text-lg">{(ride.price * 1.03).toFixed(2)} π</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {tripCompleted ? (
              <Button className="w-full" onClick={() => setShowRatingDialog(true)}>
                Rate Your Driver
              </Button>
            ) : tripStatus === "driver_arrived" && tripPhase === "pickup" ? (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
                  Close Tracking
                </Button>
                <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={continueToDropoff}>
                  Track Ride to Dropoff
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
                  Close Tracking
                </Button>
                <Button variant="destructive" className="flex-1">
                  Cancel Ride
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {showVideoOverlay && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="w-full h-full relative">
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-purple-600 to-pink-600 py-4 px-6 text-center">
              <h2 className="text-2xl font-bold text-white">
                {videoPhase === "pickup" ? "Thank You For Choosing Pi Ride" : "Thank You For Riding With Pi Ride"}
              </h2>
            </div>

            <div className="w-full h-full bg-gradient-to-b from-sky-400 to-sky-200 flex items-center justify-center">
              <div className="text-center space-y-6 animate-fade-in">
                {videoPhase === "pickup" ? (
                  <>
                    <div className="text-8xl animate-bounce-slow">🚗</div>
                    <div className="text-6xl">👨👩👧</div>
                    <p className="text-2xl font-semibold text-slate-800">Your Pi driver opens the door...</p>
                    <p className="text-xl text-slate-700">The family happily gets into the car!</p>
                    <div className="text-4xl animate-pulse">😊 🎉 😄</div>
                  </>
                ) : (
                  <>
                    <div className="text-8xl">🚗</div>
                    <div className="text-6xl animate-bounce-slow">👨👩👧</div>
                    <p className="text-2xl font-semibold text-slate-800">Your Pi driver helps you exit...</p>
                    <p className="text-xl text-slate-700">Thank you for choosing Pi Ride!</p>
                    <div className="text-4xl animate-pulse">🌟 ✨ 🎊</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showArrivalMessage && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-2xl text-3xl font-bold animate-bounce">
            🎯 You Have Arrived!
          </div>
        </div>
      )}

      <TripShareDialog
        pickup={pickup}
        destination={destination}
        driverName={driverInfo?.name || "John Smith"}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />

      <EmergencySOS
        isOpen={showSOSDialog}
        onClose={() => setShowSOSDialog(false)}
        currentLocation={userLocation || undefined}
        tripDetails={{
          pickup,
          destination,
          driver: driverInfo?.name || "John Smith",
        }}
      />

      <RatingDialog
        open={showRatingDialog}
        onClose={() => {
          setShowRatingDialog(false)
          onClose()
        }}
        driverName={driverInfo?.name || "John Smith"}
        serviceType="ride"
        onSubmit={handleRatingSubmit}
      />
    </div>
  )
}
