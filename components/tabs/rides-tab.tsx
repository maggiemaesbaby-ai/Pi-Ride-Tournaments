"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, Star, History, Gift, Users, Shield, ExternalLink, Check, Bell } from "lucide-react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { RideTracking } from "@/components/ride-tracking"
import { getAvailableRewards, applyReferralReward } from "@/lib/referral-system"
import { piSDK } from "@/lib/pi-sdk"
import { LocationPermissionDialog } from "@/components/location-permission-dialog"
import { useCurrency } from "@/contexts/currency-provider"
import { SavedLocationsDialog } from "@/components/saved-locations-dialog"
import { RecentTrips } from "@/components/recent-trips"
import { saveTrip, type RecentTrip } from "@/lib/saved-locations"
import { savePaymentRecord, updatePaymentStatus } from "@/lib/payment-logger"
import { ServiceTypeBadge } from "@/components/service-type-badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { CardContent } from "@/components/ui/card"
import { rideMatchingDB } from "@/lib/ride-matching-db" // Declare the variable here
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Car } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCurrentRidePricing } from "@/lib/dynamic-ride-pricing"
import { PiVolatilityDisclaimer } from "@/components/pi-volatility-disclaimer"

const rideOptions = [
  {
    id: 100,
    name: "Demo Ride",
    price: 0.1, // $0.10 USD equivalent in Pi
    time: "20 sec simulation",
    rating: 4.9,
    icon: "🎮",
    service: "Pi Ride Demo",
    capacity: "Simulated Experience",
    description: "Experience Pi Ride with a simulated journey of your chosen route",
    isPioneer: true,
    vehicleType: "demo",
    isDemo: true,
    city: "Global", // Added city for consistency
  },
  // Pi Pioneer Driver Options - Priority drivers with 3% fee
  {
    id: 101,
    name: "Economy",
    price: 5.2,
    time: "4 min",
    rating: 4.9,
    icon: "🚗",
    service: "Pi Pioneer Drivers",
    capacity: "1-4 passengers",
    description: "Affordable rides with verified Pioneers",
    isPioneer: true,
    vehicleType: "sedan",
    city: "Global", // Added city for consistency
  },
  {
    id: 102,
    name: "Premium",
    price: 9.5,
    time: "5 min",
    rating: 5.0,
    icon: "🚘",
    service: "Pi Pioneer Drivers",
    capacity: "1-4 passengers",
    description: "Luxury vehicles, top-rated drivers",
    isPioneer: true,
    vehicleType: "luxury",
    city: "Global", // Added city for consistency
  },
  {
    id: 103,
    name: "XL",
    price: 12.8,
    time: "6 min",
    capacity: "1-6 passengers",
    rating: 4.8,
    icon: "🚙",
    service: "Pi Pioneer Drivers",
    description: "SUVs and vans for groups",
    isPioneer: true,
    vehicleType: "suv",
    city: "Global", // Added city for consistency
  },
  // Example Lagos Driver Options
  {
    id: 104,
    name: "Lagos Economy",
    price: 15.0, // Example price in Pi
    time: "5 min",
    rating: 4.7,
    icon: "🚕",
    service: "Lagos Drivers",
    capacity: "1-4 passengers",
    description: "Efficient rides within Lagos",
    isPioneer: false, // Example: not a pioneer
    vehicleType: "sedan",
    city: "Lagos, Nigeria",
    driverId: "lagos-driver-123", // Example driver ID
    distance: 10, // Example distance in km
    duration: 15, // Example duration in minutes
  },
  {
    id: 105,
    name: "Lagos Premium",
    price: 25.0, // Example price in Pi
    time: "6 min",
    rating: 4.9,
    icon: "🛥️", // Changed icon for illustration
    service: "Lagos Premium Drivers",
    capacity: "1-4 passengers",
    description: "Comfortable and fast rides in Lagos",
    isPioneer: true, // Example: pioneer driver
    vehicleType: "suv",
    city: "Lagos, Nigeria",
    driverId: "lagos-driver-456", // Example driver ID
    distance: 12, // Example distance in km
    duration: 18, // Example duration in minutes
  },
]

const rideshareServices = ["Pioneer Drivers Only"]

export function RidesTab() {
  const { user, isConnected, connect, isConnecting } = usePiWallet()
  const { toast } = useToast()
  const [pickup, setPickup] = useState("")
  const [destination, setDestination] = useState("")
  const [selectedRide, setSelectedRide] = useState<number | null>(null)
  const [ridesSearched, setRidesSearched] = useState(false)
  const [selectedService, setSelectedService] = useState("Pioneer Drivers Only")
  const [showTracking, setShowTracking] = useState(false)
  const [pickupHistory, setPickupHistory] = useState<string[]>([])
  const [destinationHistory, setDestinationHistory] = useState<string[]>([])
  const [availableRewards, setAvailableRewards] = useState(0)
  const [useReferralReward, setUseReferralReward] = useState(false)
  const [realDriversAvailable, setRealDriversAvailable] = useState(false)
  const [isSearchingDrivers, setIsSearchingDrivers] = useState(false)
  const [showWaitlistDialog, setShowWaitlistDialog] = useState(false)
  const [userOnWaitlist, setUserOnWaitlist] = useState(false)
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false)

  // ADDED STATES FOR HISTORY
  const [showPickupHistory, setShowPickupHistory] = useState(false)
  const [showDestinationHistory, setShowDestinationHistory] = useState(false)

  const bookingFormRef = useRef<HTMLDivElement>(null)
  const [showLocationDialog, setShowLocationDialog] = useState(false)
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false)
  const { formatPriceWithUSD, toDisplayPrice } = useCurrency()
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null)
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [actualPickupCoords, setActualPickupCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showResults, setShowResults] = useState(false) // Added state for showing results

  // Added states for demo ride
  const [showDemoConfirmation, setShowDemoConfirmation] = useState(false)
  const [showDemoSimulation, setShowDemoSimulation] = useState(false) // This state is now unused and will be removed.
  const [demoRideData, setDemoRideData] = useState<any>(null) // This state is now unused and will be removed.
  const [showRating, setShowRating] = useState(false)
  const [demoRating, setDemoRating] = useState(0)
  const [isBooking, setIsBooking] = useState(false) // To disable buttons during booking
  // const sdk = typeof window !== "undefined" ? (window as any).Pi : null // Access Pi SDK

  const isCreatingPayment = useRef(false)
  const currentPaymentId = useRef<string | null>(null)
  const currentPayment = useRef<string | null>(null) // FIX: Declare currentPayment

  const [activeRide, setActiveRide] = useState<any>(null)
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [rewardAmount, setRewardAmount] = useState(0)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isLivePriceDisabled, setIsLivePriceDisabled] = useState(false)

  const [trackingRide, setTrackingRide] = useState<any>(null) // State for tracking info
  const [trackingPickup, setTrackingPickup] = useState("") // State for tracking info
  const [trackingDestination, setTrackingDestination] = useState("") // State for tracking info

  // FIX: Redeclared priceBreakdown and setPriceBreakdown removed
  const [priceBreakdown, setPriceBreakdown] = useState<{
    base: number
    platformFee: number
    total: number
    breakdown?: {
      // Added for Lagos fee breakdown
      vat: number
      ops: number
      incentives: number
      platform: number
    } | null
  } | null>(null)
  const [showSavedLocationsDialog, setShowSavedLocationsDialog] = useState<"pickup" | "destination" | null>(null)
  const [isLoadingSavedLocations, setIsLoadingSavedLocations] = useState(false)

  // Add state for dynamic pricing
  const [dynamicPricing, setDynamicPricing] = useState<{
    economy: number
    premium: number
    xl: number
    surge: string
  } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPickupHistory = localStorage.getItem("pickupHistory")
      const savedDestinationHistory = localStorage.getItem("destinationHistory")

      if (savedPickupHistory) {
        try {
          setPickupHistory(JSON.parse(savedPickupHistory))
        } catch (error) {
          console.error("[v0] Failed to load pickup history:", error)
        }
      }

      if (savedDestinationHistory) {
        try {
          setDestinationHistory(JSON.parse(savedDestinationHistory))
        } catch (error) {
          console.error("[v0] Failed to load destination history:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!user?.wallet || !pickup) return

    const checkWaitlistNotification = async () => {
      try {
        const response = await fetch(`/api/rides/waitlist/check-notifications?piUserId=${user.wallet}`)
        const data = await response.json()

        if (data.success && data.hasNotifications && data.entries && data.entries.length > 0) {
          const entry = data.entries[0]

          // Extract city from pickup to check if it matches
          const addressParts = pickup.split(",").map((p) => p.trim())
          const pickupCity = addressParts.length > 1 ? addressParts[addressParts.length - 2]?.split(" ")[0] || "" : ""

          if (pickupCity.toLowerCase() === entry.city.toLowerCase()) {
            // Show celebration and remove from waitlist
            toast({
              title: "Drivers Available! 🎉",
              description: "Great news! Drivers are now available in your area. You can now book your ride!",
              duration: 5000,
            })

            // Acknowledge notification (removes from waitlist)
            await fetch("/api/rides/waitlist/acknowledge", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ piUserId: user.wallet, entryId: entry.id }),
            })
          }
        }
      } catch (error) {
        console.error("[v0] Failed to check waitlist notification:", error)
      }
    }

    checkWaitlistNotification()
  }, [user?.wallet, pickup, toast])

  useEffect(() => {
    if (user?.uid) {
      const rewards = getAvailableRewards(user.uid)
      setAvailableRewards(rewards.length)
    }
  }, [user])

  useEffect(() => {
    if (isConnected && selectedRide !== null) {
      console.log("[v0] Wallet connected, auto-scrolling to booking form")
      setTimeout(() => {
        bookingFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 300)
    }
  }, [isConnected, selectedRide])

  useEffect(() => {
    if (pickup && destination && selectedRide !== null) {
      const ride = rideOptions.find((r) => r.id === selectedRide)
      if (ride) {
        const isLagosDriver = ride.city === "Lagos, Nigeria"
        const driverPaidUpfront = ride.isPioneer // Reuse isPioneer flag for signup fee status

        let platformFeeRate = 0.03 // Default 3% for other cities

        if (isLagosDriver) {
          platformFeeRate = driverPaidUpfront ? 0.18 : 0.2 // 18% with upfront, 20% without
        }

        const platformFee = ride.price * platformFeeRate
        const total = ride.price + platformFee

        const feeBreakdown = isLagosDriver
          ? {
              vat: platformFee * 0.375, // 7.5% of total fee
              ops: platformFee * 0.15, // 3% of total fee
              incentives: platformFee * 0.1, // 2% of total fee
              platform: platformFee * (driverPaidUpfront ? 0.375 : 0.475), // Remaining 7.5% or 9.5%
            }
          : null

        setEstimatedPrice(total)
        setPriceBreakdown({
          base: ride.price,
          platformFee,
          total,
          breakdown: feeBreakdown,
        })
      }
    } else {
      setEstimatedPrice(null)
      setPriceBreakdown(null)
    }
  }, [pickup, destination, selectedRide, rideOptions])

  const filteredRides = useMemo(() => {
    if (!realDriversAvailable && ridesSearched) {
      // Show "waiting for drivers" message and Demo option only
      return rideOptions.filter((ride) => ride.isDemo && ride.id === 100)
    }

    // If real drivers exist, show them first, then Demo last
    const realDrivers = rideOptions.filter((ride) => !ride.isDemo && ride.id !== 100)
    const demoRide = rideOptions.find((ride) => ride.isDemo && ride.id === 100)

    return demoRide ? [...realDrivers, demoRide] : realDrivers
  }, [realDriversAvailable, ridesSearched])

  const checkWaitlistStatus = async (city: string, walletAddress: string) => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const { data, error } = await supabase
        .from("driver_waitlist")
        .select("id")
        .eq("pi_user_id", walletAddress)
        .eq("city", city)
        .maybeSingle() // Use maybeSingle to handle cases where no row is found

      if (!error && data) {
        setUserOnWaitlist(true)
        return true
      }
      return false
    } catch (error) {
      console.error("[v0] Error checking waitlist status:", error)
      return false
    }
  }

  const handleWaitlistResponse = async (joinWaitlist: boolean) => {
    if (!joinWaitlist) {
      setShowWaitlistDialog(false)
      toast({
        title: "Understood",
        description: "You can search again when drivers become available",
      })
      return
    }

    await handleJoinWaitlist()
  }

  const handleJoinWaitlist = async () => {
    console.log("[v0] ===== WAITLIST JOIN STARTED =====")
    console.log("[v0] User:", user)
    console.log("[v0] User username:", user?.username)
    console.log("[v0] User uid:", user?.uid)
    console.log("[v0] Pickup:", pickup)
    console.log("[v0] Destination:", destination)

    if (!user?.uid && !user?.username) {
      console.log("[v0] ❌ No user authenticated")
      toast({
        title: "Not authenticated",
        description: "Please connect your Pi wallet to join the waitlist",
        variant: "destructive",
      })
      return
    }

    if (!pickup || !destination) {
      console.log("[v0] ❌ Missing pickup or destination")
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and destination addresses",
        variant: "destructive",
      })
      return
    }

    setIsJoiningWaitlist(true)

    try {
      const addressParts = pickup.split(",").map((p) => p.trim())
      const pickupCity =
        addressParts.length > 1 ? addressParts[addressParts.length - 2]?.split(" ")[0] || "Unknown" : "Unknown"

      console.log("[v0] Extracted city from pickup:", pickupCity)
      console.log("[v0] Address parts:", addressParts)

      let currentPickupCoords = pickupCoords
      let currentDestCoords = destCoords

      if (!currentPickupCoords) {
        console.log("[v0] Geocoding pickup address:", pickup)
        currentPickupCoords = await geocodeAddress(pickup)
        console.log("[v0] Geocoded pickup coords:", currentPickupCoords)
        if (!currentPickupCoords) {
          console.log("[v0] ❌ Failed to geocode pickup")
          toast({
            title: "Location Error",
            description: "Could not determine pickup location. Please try again.",
            variant: "destructive",
          })
          setIsJoiningWaitlist(false)
          return
        }
        setPickupCoords(currentPickupCoords)
      }

      if (!currentDestCoords) {
        console.log("[v0] Geocoding destination address:", destination)
        currentDestCoords = await geocodeAddress(destination)
        console.log("[v0] Geocoded destination coords:", currentDestCoords)
        if (!currentDestCoords) {
          console.log("[v0] ❌ Failed to geocode destination")
          toast({
            title: "Location Error",
            description: "Could not determine destination location. Please try again.",
            variant: "destructive",
          })
          setIsJoiningWaitlist(false)
          return
        }
        setDestCoords(currentDestCoords)
      }

      const piUserId = user.uid || user.username
      const requestBody = {
        piUserId,
        email: `${piUserId}@pi.network`,
        city: pickupCity,
        location: currentPickupCoords, // API expects 'location' not 'pickupLocation'
      }

      console.log("[v0] Calling /api/rides/waitlist/join with body:", requestBody)

      const response = await fetch("/api/rides/waitlist/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] API response status:", response.status)

      const result = await response.json()
      console.log("[v0] API response body:", result)

      if (!response.ok) {
        console.log("[v0] ❌ API returned error status")
        if (result.alreadyOnWaitlist) {
          console.log("[v0] User already on waitlist")
          setUserOnWaitlist(true)
          setShowWaitlistDialog(false)
          toast({
            title: "Already on waitlist",
            description: "You're already registered for notifications in this area",
          })
        } else {
          console.log("[v0] ❌ Throwing error:", result.error)
          throw new Error(result.error || "Failed to join waitlist")
        }
        setIsJoiningWaitlist(false)
        return
      }

      console.log("[v0] ✅ Successfully joined waitlist")

      setUserOnWaitlist(true)
      setShowWaitlistDialog(false)

      toast({
        title: "Added to waitlist!",
        description: "We'll notify you when drivers become available in your area",
      })
    } catch (error) {
      console.error("[v0] ❌ Waitlist error caught:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
      toast({
        title: "Unable to join waitlist",
        description: error instanceof Error ? error.message : "There was an error. Please try again.",
        variant: "destructive",
      })
    } finally {
      console.log("[v0] ===== WAITLIST JOIN ENDED =====")
      setIsJoiningWaitlist(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d * 0.621371 // Distance in miles
  }

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180)
  }

  const handleSearchRides = async () => {
    if (!pickup || !destination) {
      toast({
        title: "Missing Information",
        description: "Please enter both pickup and destination addresses.",
        variant: "destructive",
      })
      return
    }

    saveToHistory(pickup, "pickup")
    saveToHistory(destination, "destination")

    setIsSearchingDrivers(true)
    setRidesSearched(false)
    setShowResults(false)

    toast({
      title: "Searching for drivers",
      description: `Looking for available drivers in your area...`,
    })

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const addressParts = pickup.split(",").map((p) => p.trim())
      const pickupCity =
        addressParts.length > 1 ? addressParts[addressParts.length - 2]?.split(" ")[0] || "Unknown" : "Unknown"

      const isTestMode = pickup.toUpperCase().includes("TEST") && destination.toUpperCase().includes("TEST")

      if (isTestMode) {
        toast({
          title: "🧪 Test Mode Activated",
          description: "Test ride will use your actual location to find nearby drivers. Charge: 0.001 Pi",
          duration: 5000,
        })
        console.log("[v0] TEST MODE: Using location services for driver matching")
      }

      const { data: drivers, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("is_on_duty", true)
        .eq("approved", true)
        .contains("service_cities", [pickupCity])

      if (error) {
        console.error("[v0] Error searching for drivers:", error)
        setRealDriversAvailable(false)
        setRidesSearched(true)
        setShowResults(true)
        setShowWaitlistDialog(true)
      } else {
        const driversFound = drivers?.length || 0
        setRealDriversAvailable(driversFound > 0)
        setRidesSearched(true)
        setShowResults(true)

        if (driversFound > 0) {
          toast({
            title: `${driversFound} driver${driversFound === 1 ? "" : "s"} available`,
            description: "Select a ride option below to continue",
          })

          // Geocode addresses
          const pickupCoords = await geocodeAddress(pickup)
          const destCoords = await geocodeAddress(destination)

          if (!pickupCoords || !destCoords) {
            toast({
              title: "Address Error",
              description: "Could not determine route. Please try again.",
              variant: "destructive",
            })
            setIsSearchingDrivers(false)
            return
          }

          // Calculate distance (mock - would use real routing API)
          const distance = calculateDistance(pickupCoords.lat, pickupCoords.lng, destCoords.lat, destCoords.lng)

          // Get available drivers count
          const availableDrivers = driversFound // Use the count from the query

          // Calculate dynamic pricing
          // For now, we'll use a placeholder for piPrice as it's not available here.
          // In a real app, you'd fetch the current Pi price from an API.
          const piPrice = 0.3 // Placeholder: assumed Pi price in USD
          const pricing = getCurrentRidePricing(
            distance,
            Math.ceil(distance * 2), // Estimate 2 min per mile
            availableDrivers,
            0, // Queue length - would track actual queue
            piPrice,
          )

          setDynamicPricing(pricing)

          // Update ride options with dynamic prices
          const updatedOptions = rideOptions.map((option) => {
            if (option.isDemo) return option

            let newPrice = option.price
            switch (option.vehicleType) {
              case "sedan":
                newPrice = pricing.economy
                break
              case "luxury":
                newPrice = pricing.premium
                break
              case "suv":
                newPrice = pricing.xl
                break
            }

            return { ...option, price: newPrice }
          })

          // Note: This doesn't actually update the rideOptions state, just used for calculation here.
          // If rideOptions were a state, it would need to be updated. For now, this is just for info.

          setPickupCoords(pickupCoords)
          setDestCoords(destCoords)
        } else {
          toast({
            title: "No drivers currently available",
            description: "Would you like to join the waitlist?",
          })
          setShowWaitlistDialog(true)
        }
      }
    } catch (error) {
      console.error("[v0] Error during driver search:", error)
      setRealDriversAvailable(false)
      setRidesSearched(true)
      setShowResults(true)

      toast({
        title: "Search completed",
        description: "No drivers currently available in your area",
      })

      setShowWaitlistDialog(true)
    } finally {
      setIsSearchingDrivers(false)
    }
  }

  const handleBookRide = async () => {
    console.log("[v0] handleBookRide called")

    if (isCreatingPayment.current) {
      toast({
        title: "Payment in Progress",
        description: "Please wait for the current payment to complete.",
        variant: "destructive",
      })
      return
    }

    if (!isConnected) {
      console.log("[v0] Not connected, showing toast")
      toast({
        title: "Connect Your Wallet",
        description: "Please connect your Pi wallet to book a ride. Click 'Connect Pi Wallet' below to continue.",
        variant: "destructive",
      })
      return
    }

    if (userOnWaitlist && user?.wallet) {
      // If user is on waitlist, show notification that drivers are now available
      toast({
        title: "Drivers Available! 🎉",
        description: "Great news! Drivers are now accepting rides in your area. You've been removed from the waitlist.",
      })

      // Remove user from waitlist since they're now booking
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()

        const addressParts = pickup.split(",").map((p) => p.trim())
        const pickupCity =
          addressParts.length > 1 ? addressParts[addressParts.length - 2]?.split(" ")[0] || "Unknown" : "Unknown"

        await supabase.from("driver_waitlist").delete().eq("pi_user_id", user.wallet).eq("city", pickupCity)

        setUserOnWaitlist(false)
        console.log("[v0] User removed from waitlist after booking")
      } catch (error) {
        console.error("[v0] Error removing from waitlist:", error)
      }
    }

    console.log("[v0] Checking booking details:", { pickup, destination, selectedRide })

    if (!pickup || !destination || selectedRide === null) {
      console.log("[v0] Missing booking details")
      toast({
        title: "Missing information",
        description: "Please complete all booking details.",
        variant: "destructive",
      })
      return
    }

    const ride = rideOptions.find((r) => r.id === selectedRide)
    if (!ride) {
      console.log("[v0] Ride not found")
      return
    }

    console.log("[v0] Selected ride:", ride)

    const isLagosDriver = ride.city === "Lagos, Nigeria"
    const driverPaidUpfront = ride.isPioneer

    let feeRate = 0.03
    if (isLagosDriver) {
      feeRate = driverPaidUpfront ? 0.18 : 0.2
    }

    const platformFee = ride.price * feeRate
    const finalPlatformFee = useReferralReward && availableRewards > 0 ? 0 : platformFee
    const totalAmount = ride.price + finalPlatformFee

    console.log("[v0] Pricing:", {
      ridePrice: ride.price,
      platformFee: finalPlatformFee,
      totalAmount,
      isLagos: isLagosDriver,
    })

    if (useReferralReward && availableRewards > 0 && user?.uid) {
      const bookingId = `booking-${Date.now()}`
      const reward = applyReferralReward(user.uid, bookingId)
      if (reward) {
        setAvailableRewards((prev) => prev - 1)
      }
    }

    // Save to recent trips
    if (user?.uid) {
      saveTrip(user.uid, {
        pickup,
        destination,
        service: ride.service,
        price: ride.price,
        rideType: ride.name,
      })
    }

    let currentPickupCoords = pickupCoords
    if (!currentPickupCoords) {
      console.log("[v0] Geocoding pickup address:", pickup)
      // Geocode the pickup address
      currentPickupCoords = await geocodeAddress(pickup)
      if (!currentPickupCoords) {
        console.error("[v0] Failed to geocode pickup address")
        toast({
          title: "Location Error",
          description: "Could not determine pickup location. Please try again.",
          variant: "destructive",
        })
        return
      }
      console.log("[v0] Pickup coordinates:", currentPickupCoords)
    }
    setActualPickupCoords(currentPickupCoords) // Set the geocoded coordinates

    console.log("[v0] Geocoding destination address:", destination)
    const currentDestCoords = await geocodeAddress(destination)
    if (!currentDestCoords) {
      console.error("[v0] Failed to geocode destination address")
      toast({
        title: "Location Error",
        description: "Could not determine destination location. Please try again.",
        variant: "destructive",
      })
      return
    }
    setDestCoords(currentDestCoords) // Set the geocoded coordinates
    console.log("[v0] Destination coordinates:", currentDestCoords)

    const paymentData = {
      amount: totalAmount,
      memo: `${ride.name} ride: ${pickup} → ${destination}`,
      metadata: {
        service: "ride",
        rideType: ride.name,
        rideService: ride.service,
        pickup,
        destination,
        pickupLat: currentPickupCoords.lat,
        pickupLng: currentPickupCoords.lng,
        destinationLat: currentDestCoords.lat,
        destinationLng: currentDestCoords.lng,
        vehicleType: ride.vehicleType || "sedan",
        userId: user?.uid,
        userEmail: user?.username, // Pi username often includes email
        timestamp: Date.now(),
      },
    }

    let currentPaymentIdForCallbacks: string | undefined
    let rideId: string | undefined

    const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        if (currentPaymentIdForCallbacks === paymentId) {
          console.log("[v0] Approval already processed for this payment, skipping")
          return
        }
        currentPaymentIdForCallbacks = paymentId
        currentPayment.current = paymentId

        console.log("[v0] ===== PAYMENT APPROVAL STARTING =====")
        console.log("[v0] Payment ID:", paymentId)
        console.log("[v0] User ID:", user?.uid)

        if (user?.uid) {
          savePaymentRecord({
            userId: user.uid,
            amount: totalAmount,
            type: "ride",
            service: ride.service,
            serviceType: "ride",
            metadata: {
              pickup,
              destination,
              provider: "Pi Ride",
            },
            piPaymentId: paymentId,
            status: "pending",
          })
          console.log("[v0] Payment record saved")
        }

        try {
          const approvalRes = await fetch("/api/rides/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_id: paymentId,
              rider_pi_user_id: user.uid,
              driver_id: ride.driverId,
              pickup_location: {
                name: pickup,
                lat: actualPickupCoords?.lat || 0,
                lng: actualPickupCoords?.lng || 0,
              },
              dropoff_location: {
                name: destination,
                lat: currentDestCoords?.lat || 0,
                lng: currentDestCoords?.lng || 0,
              },
              ride_type: ride.name,
              price_pi: totalAmount,
              distance_km: ride.distance, // Assuming distance and duration are available on ride object
              duration_minutes: ride.duration,
              platform_fee: finalPlatformFee,
              is_lagos: isLagosDriver,
              fee_breakdown: isLagosDriver
                ? {
                    vat: platformFee * 0.375,
                    ops: platformFee * 0.15,
                    incentives: platformFee * 0.1,
                    platform: platformFee * (driverPaidUpfront ? 0.375 : 0.475),
                  }
                : null,
            }),
          })

          const approvalData = await approvalRes.json()
          console.log("[v0] API create ride response:", approvalData)

          if (!approvalRes.ok) {
            console.error("[v0] API create ride failed:", approvalData)
            if (user?.uid) {
              updatePaymentStatus(user.uid, paymentId, "failed")
            }
            console.error("[v0] API create ride error (non-blocking):", approvalData.error || "API create ride failed")
            return
          }

          rideId = approvalData.ride.id // Assuming the API returns the created ride ID
          console.log("[v0] Ride created successfully via API:", rideId)

          console.log("[v0] Calling server approval endpoint...")
          const response = await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          })

          const data = await response.json()
          console.log("[v0] Server approval response:", { ok: response.ok, status: response.status, data })

          if (!response.ok) {
            console.error("[v0] Server approval failed:", data)
            if (user?.uid) {
              updatePaymentStatus(user.uid, paymentId, "failed")
            }
            console.error("[v0] Approval error (non-blocking):", data.error || "Approval failed")
            return
          }

          console.log("[v0] ===== PAYMENT APPROVED SUCCESSFULLY =====")

          setTimeout(async () => {
            try {
              console.log("[v0] Creating ride in database (async)...")
              // This section might be redundant if the API call above already created the ride.
              // Keep it if the API call is for initial booking/driver assignment and DB entry is separate.
              // For now, assuming API call handles DB creation.
            } catch (error) {
              console.error("[v0] Error creating ride (non-blocking):", error)
            }
          }, 0)
        } catch (error: any) {
          console.error("[v0] ===== PAYMENT APPROVAL ERROR (non-blocking) =====")
          console.error("[v0] Error:", error)
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("[v0] ===== PAYMENT COMPLETION STARTING =====")
        console.log("[v0] Payment ID:", paymentId)
        console.log("[v0] Transaction ID:", txid)

        try {
          console.log("[v0] Calling server completion endpoint...")
          const response = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          })

          const data = await response.json()
          console.log("[v0] Server completion response:", { ok: response.ok, status: response.status, data })

          if (!response.ok) {
            console.error("[v0] Server completion failed:", data)
            if (user?.uid) {
              updatePaymentStatus(user.uid, paymentId, "failed", txid)
            }
            console.error("[v0] Completion error (non-blocking):", data.error || "Completion failed")
            return
          }

          console.log("[v0] ===== PAYMENT COMPLETED SUCCESSFULLY =====")

          if (user?.uid) {
            updatePaymentStatus(user.uid, paymentId, "completed", txid)
            console.log("[v0] Payment status updated to completed")
          }

          console.log("[v0] Starting 20-second route simulation")

          toast({
            title: "Ride Booked!",
            description: "Starting your ride simulation...",
          })

          // Automatically show tracking after payment
          if (rideId && actualPickupCoords && destCoords) {
            setTrackingRide({
              name: ride.name,
              service: ride.service,
              price: totalAmount,
              time: ride.time,
              rating: ride.rating,
              isDemo: ride.isDemo, // Pass isDemo flag
            })
            setTrackingPickup(pickup)
            setTrackingDestination(destination)
            setShowResults(false)
            setShowTracking(true)
          }

          // Reset form after short delay
          setTimeout(() => {
            setPickup("")
            setDestination("")
            setSelectedRide(null)
            setRidesSearched(false)
            setEstimatedPrice(null)
            setPriceBreakdown(null)
            setUseReferralReward(false)
            setIsScheduled(false)
            setScheduleDate("")
            setScheduleTime("")
            setPickupCoords(null)
            setDestCoords(null)
            setActualPickupCoords(null)
          }, 1000)

          console.log("[v0] ===== BOOKING FLOW COMPLETE =====")
        } catch (error: any) {
          console.error("[v0] ===== PAYMENT COMPLETION ERROR (non-blocking) =====")
          console.error("[v0] Error:", error)
        }
        isCreatingPayment.current = false
        currentPaymentId.current = null
      },

      onCancel: (paymentId: string) => {
        console.log("[v0] Payment cancelled:", paymentId)
        if (user?.uid) {
          updatePaymentStatus(user.uid, paymentId, "cancelled")
        }
        toast({
          title: "Ride Booking Cancelled",
          description: "Your ride booking was cancelled.",
          variant: "destructive",
        })
        isCreatingPayment.current = false
        currentPaymentId.current = null
      },

      onError: (error: Error, payment?: any) => {
        console.error("[v0] ===== PAYMENT ERROR =====")
        console.error("[v0] Error:", error)
        console.error("[v0] Payment:", payment)

        if (payment?.identifier && user?.uid) {
          updatePaymentStatus(user.uid, payment.identifier, "failed")
        }
        toast({
          title: "Booking Failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        })
        isCreatingPayment.current = false
        currentPaymentId.current = null
      },
    }

    console.log("[v0] Creating Pi payment:", paymentData)
    try {
      isCreatingPayment.current = true

      currentPaymentIdForCallbacks = null
      currentPaymentId.current = null
      currentPayment.current = null

      // Using window.Pi for createPayment directly as piSDK might not be fully initialized here
      if (typeof window !== "undefined" && (window as any).Pi) {
        await (window as any).Pi.createPayment(paymentData, paymentCallbacks)
        console.log("[v0] Payment creation initiated via Pi SDK")
      } else {
        throw new Error("Pi SDK not available or not initialized")
      }
    } catch (error) {
      console.error("[v0] Payment creation failed:", error)

      isCreatingPayment.current = false
      currentPaymentId.current = null

      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBookScheduledRide = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Pi wallet to book a scheduled ride.",
        variant: "destructive",
      })
      return
    }

    if (!pickup || !destination || selectedRide === null || !scheduleDate || !scheduleTime) {
      toast({
        title: "Missing information",
        description: "Please complete all booking details including date and time.",
        variant: "destructive",
      })
      return
    }

    const ride = rideOptions.find((r) => r.id === selectedRide)
    if (!ride) return

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).getTime()

    // Validate scheduled time is in the future
    if (scheduledDateTime <= Date.now()) {
      toast({
        title: "Invalid Schedule Time",
        description: "Please select a future date and time.",
        variant: "destructive",
      })
      return
    }

    const feeRate = 0.03
    const platformFee = ride.price * feeRate
    const totalAmount = ride.price + platformFee

    // These should be geocoded properly before this point for scheduled rides too
    // For now, using dummy coordinates as placeholders
    const currentPickupCoords = actualPickupCoords || {
      lat: 37.7749 + Math.random() * 0.1,
      lng: -122.4194 + Math.random() * 0.1,
    }
    const currentDestCoords = destCoords || { lat: 37.7749 + Math.random() * 0.1, lng: -122.4194 + Math.random() * 0.1 }

    const paymentData = {
      amount: totalAmount,
      memo: `Scheduled ${ride.name} ride for ${new Date(scheduledDateTime).toLocaleString()}: ${pickup} → ${destination}`,
      metadata: {
        service: "ride",
        rideType: ride.name,
        rideService: ride.service,
        isScheduled: true,
        scheduledFor: scheduledDateTime,
        isPioneerDriver: true,
        pickup,
        destination,
        pickupLat: currentPickupCoords.lat,
        pickupLng: currentPickupCoords.lng,
        destinationLat: currentDestCoords.lat,
        destinationLng: currentDestCoords.lng,
        vehicleType: ride.vehicleType || "sedan",
        userId: user?.uid,
        timestamp: Date.now(),
      },
    }

    const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("[v0] Scheduled ride payment ready for approval:", paymentId)

        try {
          const response = await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          })

          const data = await response.json()

          if (!response.ok) {
            console.error("[v0] Scheduled approval failed (non-blocking):", data)
            return
          }

          console.log("[v0] Server approval successful:", data)
        } catch (error) {
          console.error("[v0] Server approval error (non-blocking):", error)
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("[v0] Scheduled ride payment completed:", paymentId, txid)

        try {
          const response = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          })

          const data = await response.json()

          if (!response.ok) {
            console.error("[v0] Scheduled completion failed (non-blocking):", data)
            return
          }

          console.log("[v0] Server completion successful:", data)

          setTimeout(() => {
            try {
              const scheduledRide = rideMatchingDB.createScheduledRide({
                userId: user?.uid || "",
                username: user?.username || "Rider",
                pickupLat: currentPickupCoords.lat,
                pickupLng: currentPickupCoords.lng,
                pickupAddress: pickup,
                destinationLat: currentDestCoords.lat,
                destinationLng: currentDestCoords.lng,
                destinationAddress: destination,
                vehicleType: ride.vehicleType || "sedan",
                estimatedPrice: ride.price,
                scheduledFor: scheduledDateTime,
                prepaidAmount: totalAmount,
                prepaidTxid: txid,
              })

              toast({
                title: "Scheduled Ride Booked! 🎉",
                description: `Your ride is confirmed for ${new Date(scheduledDateTime).toLocaleString()}. Payment of ${totalAmount.toFixed(2)}π has been processed.`,
                duration: 10000,
              })

              // Reset form
              setIsScheduled(false)
              setScheduleDate("")
              setScheduleTime("")
              setPickup("")
              setDestination("")
              setSelectedRide(null)
              setRidesSearched(false)
              setShowResults(false)
              setEstimatedPrice(null)
              setPriceBreakdown(null)
              setUseReferralReward(false)
              setPickupCoords(null)
              setDestCoords(null)
              setActualPickupCoords(null)
            } catch (error) {
              console.error("[v0] Scheduled ride creation error (non-blocking):", error)
            }
          }, 0)
        } catch (error) {
          console.error("[v0] Server completion error (non-blocking):", error)
        }
      },

      onCancel: (paymentId: string) => {
        console.log("[v0] Scheduled ride payment cancelled:", paymentId)
        toast({ title: "Payment cancelled" })
      },

      onError: (error: Error, payment?: any) => {
        console.error("[v0] Scheduled ride payment error:", error, payment)
        toast({ title: "Payment failed", description: error.message, variant: "destructive" })
      },
    }

    console.log("[v0] Creating Pi payment for scheduled ride:", paymentData)

    try {
      if (typeof window !== "undefined" && (window as any).Pi) {
        const Pi = (window as any).Pi
        await Pi.createPayment(paymentData, paymentCallbacks)
      } else {
        throw new Error("Pi SDK not available")
      }
    } catch (error) {
      console.error("[v0] Payment creation failed:", error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      })
    }
  }

  const handleConnectOrBook = async () => {
    console.log("[v0] handleConnectOrBook called", { user, isConnecting })

    // Prevent concurrent connect attempts
    if (isConnecting) {
      console.log("[v0] Already connecting, skipping duplicate call")
      return
    }

    try {
      if (!user) {
        await connect()
        return
      }

      if (selectedRide && rideOptions.find((r) => r.id === selectedRide)?.isDemo) {
        setShowDemoConfirmation(true)
        return
      }

      if (!isConnected) {
        console.log("[v0] Wallet not connected, calling connect()...")
        await connect()
        console.log("[v0] Wallet connected successfully, user can now book")
        return
      }

      console.log("[v0] Wallet already connected, proceeding with booking...")
      if (isScheduled) {
        await handleBookScheduledRide()
      } else {
        await handleBookRide()
      }
    } catch (error) {
      console.error("[v0] Error in handleConnectOrBook:", error)
      // Error is already handled and toasted by the connect() function
      // Don't show another error message
    }
  }

  const handleRideSelect = (rideId: number) => {
    const ride = rideOptions.find((r) => r.id === rideId)
    console.log("[v0] Ride selected:", ride?.name)

    setSelectedRide(rideId)

    toast({
      title: "Ride selected",
      description: `${ride?.name} (${ride?.service}) - ${ride?.price} π`,
    })

    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  const saveToHistory = (address: string, type: "pickup" | "destination") => {
    console.log("[v0] saveToHistory called:", { address, type })
    if (!address.trim() || typeof window === "undefined") return

    const storageKey = type === "pickup" ? "pickupHistory" : "destinationHistory"
    const setHistory = type === "pickup" ? setPickupHistory : setDestinationHistory
    const currentHistory = type === "pickup" ? pickupHistory : destinationHistory

    console.log("[v0] Current history before save:", currentHistory)

    const updatedHistory = [address, ...currentHistory.filter((addr) => addr !== address)].slice(0, 5)

    console.log("[v0] Updated history:", updatedHistory)
    console.log("[v0] Saving to localStorage with key:", storageKey)

    setHistory(updatedHistory)
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))

    console.log("[v0] Saved to localStorage successfully")
  }

  const handlePickupFocus = () => {
    setShowPickupHistory(true)

    if (!pickup && !locationPermissionAsked && navigator.geolocation) {
      setShowLocationDialog(true)
      setLocationPermissionAsked(true)
    }
  }

  const handleAllowLocation = () => {
    setShowLocationDialog(false)
    setIsLoadingLocation(true)

    if (navigator.geolocation) {
      console.log("[v0] Requesting geolocation...")

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log("[v0] Geolocation success:", position.coords)
          const { latitude, longitude } = position.coords

          setPickupCoords({ lat: latitude, lng: longitude })

          let address = await reverseGeocode(latitude, longitude)

          // Retry once if reverse geocoding fails
          if (!address) {
            console.log("[v0] Reverse geocoding failed, retrying...")
            await new Promise((resolve) => setTimeout(resolve, 1000))
            address = await reverseGeocode(latitude, longitude)
          }

          if (address) {
            console.log("[v0] Address resolved:", address)
            setPickup(address)
            setActualPickupCoords({ lat: latitude, lng: longitude })
            toast({
              title: "Location Enabled",
              description: "Your current location has been set as pickup",
            })
          } else {
            // Use a more user-friendly fallback instead of raw coordinates
            console.log("[v0] Reverse geocoding failed after retry")
            setPickup("Current Location (Tap to enter address)")
            setActualPickupCoords({ lat: latitude, lng: longitude })
            toast({
              title: "Location Set",
              description: "Please verify or update your pickup address",
              variant: "default",
            })
          }

          setIsLoadingLocation(false)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          setIsLoadingLocation(false)

          let errorMessage = "Please enter your pickup address manually"
          let errorTitle = "Location Access Failed"

          if (error.code === error.PERMISSION_DENIED) {
            errorTitle = "Location Services Disabled"
            errorMessage =
              "Please enable location services in your device settings, then refresh this page and try again."
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMessage =
              "Your location is currently unavailable. Make sure location services are enabled in your device settings."
          } else if (error.code === error.TIMEOUT) {
            errorMessage = "Location request timed out. Please check your location settings and try again."
          }

          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive",
            duration: 6000,
          })
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
      )
    } else {
      setIsLoadingLocation(false)
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      })
    }
  }

  const handleDenyLocation = () => {
    setShowLocationDialog(false)
    toast({
      title: "Location Not Enabled",
      description: "Please enter your pickup address manually",
    })
  }

  const handleRebook = (trip: RecentTrip) => {
    setPickup(trip.pickup)
    setDestination(trip.destination)
    setSelectedService(trip.service)
    setRidesSearched(true)
    setShowResults(true) // Show results when rebooking

    toast({
      title: "Trip loaded",
      description: "Your previous trip details have been filled in",
    })

    // Auto-scroll to booking form
    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      console.log("[v0] Calling reverse geocode API for:", lat, lng)
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)

      if (!response.ok) {
        console.error("[v0] Reverse geocode API failed:", response.status)
        return null
      }

      const data = await response.json()
      console.log("[v0] API response:", data)

      if (data.address) {
        console.log("[v0] Address found:", data.address)
        return data.address
      }

      console.log("[v0] No address in API response")
      return null
    } catch (error) {
      console.error("[v0] Reverse geocoding error:", error)
      return null
    }
  }

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log("[v0] Calling geocode API for:", address)
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      const data = await response.json()

      console.log("[v0] Geocode API response:", data)

      if (data.success && data.coordinates) {
        return data.coordinates
      }

      console.error("[v0] Geocode failed:", data)
      return null
    } catch (error) {
      console.error("[v0] Geocode error:", error)
      return null
    }
  }

  const handleUseCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          console.log("[v0] Reverse geocoding current location:", { lat, lng })

          let address: string | null = null

          try {
            const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
            const data = await response.json()

            if (data.address) {
              address = data.address
            } else {
              // Retry once if first attempt fails
              console.log("[v0] Reverse geocoding failed, retrying...")
              await new Promise((resolve) => setTimeout(resolve, 1000))
              const retryResponse = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
              const retryData = await retryResponse.json()
              if (retryData.address) {
                address = retryData.address
              }
            }

            if (address) {
              console.log("[v0] Address resolved:", address)
              setPickup(address)
              setPickupCoords({ lat, lng })
              toast({
                title: "Location set",
                description: address,
              })
            } else {
              throw new Error("Address not found after retry")
            }
          } catch (error) {
            console.error("[v0] Reverse geocoding failed:", error)
            // Use user-friendly fallback instead of coordinates
            setPickup("Current Location (Tap to enter address)")
            setPickupCoords({ lat, lng })
            toast({
              title: "Location Set",
              description: "Please verify or update your pickup address",
            })
          }
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
          toast({
            title: "Location access denied",
            description: "Please enable location services or enter your address manually.",
            variant: "destructive",
          })
        },
      )
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      })
    }
  }

  const startDemoSimulation = async (ride: (typeof rideOptions)[0]) => {
    try {
      console.log("[v0] Starting demo simulation with interactive map")

      const pickupCoords = await geocodeAddress(pickup)
      const destCoords = await geocodeAddress(destination)

      if (!pickupCoords || !destCoords) {
        toast({
          title: "Location Error",
          description: "Could not determine route for demo",
          variant: "destructive",
        })
        setIsBooking(false)
        return
      }

      const demoRideData = {
        name: ride.name,
        service: ride.service,
        price: ride.price,
        time: "20 sec simulation",
        rating: 4.9,
      }

      setTrackingRide(demoRideData)
      setTrackingPickup(pickup)
      setTrackingDestination(destination)
      setActualPickupCoords(pickupCoords)
      setDestCoords(destCoords)
      setShowTracking(true)
      setIsBooking(false)

      console.log("[v0] Demo simulation started with real route following")

      // Simulate 20-second ride with rating prompt
      setTimeout(async () => {
        console.log("[v0] Demo simulation completed")
        setShowTracking(false)
        setShowRating(true)
      }, 22000) // 22 seconds to account for completion animation
    } catch (error) {
      console.error("[v0] Demo simulation error:", error)
      toast({ title: "Demo Error", description: "Could not complete demo", variant: "destructive" })
      setIsBooking(false)
      setShowTracking(false)
    }
  }

  // Define showBookingForm and showConfirmation states
  const [showBookingForm, setShowBookingForm] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleStartDemo = async () => {
    try {
      console.log("[v0] handleStartDemo - Entry point")

      setShowDemoConfirmation(false)
      setIsBooking(true)

      console.log("[v0] handleStartDemo - State updated, user check:", { user, selectedRide })

      if (!user) {
        console.error("[v0] No user found")
        toast({
          title: "Authentication Required",
          description: "Please connect your wallet first",
          variant: "destructive",
        })
        setIsBooking(false)
        return
      }

      if (selectedRide === null) {
        console.error("[v0] No ride selected")
        toast({
          title: "No Ride Selected",
          description: "Please select a ride before starting the demo",
          variant: "destructive",
        })
        setIsBooking(false)
        return
      }

      const ride = rideOptions.find((r) => r.id === selectedRide)
      if (!ride) {
        console.error("[v0] Ride not found for ID:", selectedRide)
        toast({
          title: "Ride Not Found",
          description: "The selected ride could not be found",
          variant: "destructive",
        })
        setIsBooking(false)
        return
      }

      console.log("[v0] handleStartDemo - Creating payment for ride:", ride)

      // Check if piSDK is initialized
      if (!piSDK.isInitialized()) {
        console.error("[v0] Pi SDK not initialized")
        toast({
          title: "SDK Not Ready",
          description: "Pi SDK is not initialized. Please refresh the page.",
          variant: "destructive",
        })
        setIsBooking(false)
        return
      }

      console.log("[v0] handleStartDemo - Pi SDK is initialized, creating payment...")

      // Create payment with Pi SDK
      const payment = await piSDK.createPayment(
        {
          amount: ride.price,
          memo: `Demo Ride - ${ride.name}`,
          metadata: {
            rideType: "demo",
            rideName: ride.name,
            userId: user.uid,
          },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("[v0] Demo payment ready for approval:", paymentId)

            try {
              const response = await fetch("/api/pi/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                console.error("[v0] Demo approval failed (non-blocking):", errorData)
                return
              }

              console.log("[v0] Demo payment approved successfully")
            } catch (error) {
              console.error("[v0] Demo payment approval error (non-blocking):", error)
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("[v0] Demo payment ready for completion:", { paymentId, txid })

            try {
              const response = await fetch("/api/pi/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              })

              if (!response.ok) {
                const errorData = await response.json()
                console.error("[v0] Demo completion failed (non-blocking):", errorData)
                return
              }

              console.log("[v0] Demo payment completed successfully")

              setShowBookingForm(false)
              setShowConfirmation(false)

              await startDemoSimulation(ride)
            } catch (error) {
              console.error("[v0] Demo payment completion error (non-blocking):", error)
            }
          },
          onCancel: () => {
            console.log("[v0] Demo payment cancelled")
            setIsBooking(false)
            toast({
              title: "Payment Cancelled",
              description: "Demo ride payment was cancelled",
              variant: "destructive",
            })
          },
          onError: (error: Error) => {
            console.error("[v0] Demo payment error:", error)
            setIsBooking(false)
            toast({
              title: "Payment Error",
              description: error.message || "Failed to process demo payment",
              variant: "destructive",
            })
          },
        },
      )

      console.log("[v0] Demo payment created:", payment)
    } catch (error) {
      console.error("[v0] handleStartDemo - Caught error:", error)
      setIsBooking(false)
      toast({
        title: "Demo Error",
        description: error instanceof Error ? error.message : "Failed to start demo ride",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      <LocationPermissionDialog show={showLocationDialog} onAllow={handleAllowLocation} onDeny={handleDenyLocation} />

      {user?.uid && (
        <div className="mb-6">
          <RecentTrips userId={user.uid} onRebook={handleRebook} />
        </div>
      )}

      {/* Ride Tracking Component */}
      {showTracking && trackingRide && (
        <div className="mb-6">
          <RideTracking
            ride={trackingRide}
            pickup={trackingPickup}
            destination={trackingDestination}
            onClose={() => {
              setShowTracking(false)
              setTrackingRide(null) // Clear tracking ride data on close
            }}
            rideRequestId={activeRide?.request_id}
            isDemo={trackingRide.time === "20 sec simulation"} // Pass isDemo flag
            pickupCoords={actualPickupCoords} // Pass pickup coords
            destCoords={destCoords} // Pass destination coords
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Booking Form */}
        <div className="space-y-4" ref={bookingFormRef}>
          <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-2xl text-slate-900">
            <h2 className="text-xl font-bold mb-4">Book a Ride</h2>

            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Pickup Location
                  </label>
                  {user?.uid && (
                    <SavedLocationsDialog
                      userId={user.uid}
                      onSelectLocation={(address) => {
                        setPickup(address)
                        setShowPickupHistory(false) // Close history on select
                      }}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          Saved
                        </Button>
                      }
                    />
                  )}
                </div>
                <input
                  type="text"
                  placeholder={isLoadingLocation ? "Getting your location..." : "Enter pickup address"}
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  onFocus={handlePickupFocus}
                  onBlur={() => setTimeout(() => setShowPickupHistory(false), 200)}
                  disabled={isLoadingLocation}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50 backdrop-blur-sm border-slate-300 text-slate-900 disabled:opacity-50 disabled:cursor-wait"
                />
                {showPickupHistory && pickupHistory.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 p-2 bg-white border-2 border-slate-300 shadow-lg">
                    <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Recent Addresses
                    </div>
                    {pickupHistory.map((address, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setPickup(address)
                          setShowPickupHistory(false)
                        }}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer rounded text-sm text-slate-800"
                      >
                        {address}
                      </div>
                    ))}
                  </Card>
                )}
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-secondary" />
                    Destination
                  </label>
                  {user?.uid && (
                    <SavedLocationsDialog
                      userId={user.uid}
                      onSelectLocation={(address) => {
                        setDestination(address)
                        setShowDestinationHistory(false) // Close history on select
                      }}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          Saved
                        </Button>
                      }
                    />
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Enter destination address"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onFocus={() => setShowDestinationHistory(true)}
                  onBlur={() => setTimeout(() => setShowDestinationHistory(false), 200)}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white border-slate-300 text-slate-900"
                />
                {showDestinationHistory && destinationHistory.length > 0 && (
                  <Card className="absolute z-10 w-full mt-1 p-2 bg-white border-2 border-slate-300 shadow-lg">
                    <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Recent Addresses
                    </div>
                    {destinationHistory.map((address, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setDestination(address)
                          setShowDestinationHistory(false)
                        }}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer rounded text-sm text-slate-800"
                      >
                        {address}
                      </div>
                    ))}
                  </Card>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Service Type</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Services">All Pi Ride Services</SelectItem>
                    <SelectItem value="Pioneer Drivers Only">Pioneer Drivers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!ridesSearched && (
                <Button onClick={handleSearchRides} className="w-full" size="lg" disabled={isSearchingDrivers}>
                  {isSearchingDrivers ? (
                    "Searching..."
                  ) : (
                    <>
                      <Car className="w-5 h-5 mr-2" /> Search Rides
                    </>
                  )}
                </Button>
              )}

              {ridesSearched && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Schedule for later</span>
                  </div>
                  <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
                </div>
              )}

              {isScheduled && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <Label htmlFor="schedule-date">Pickup Date</Label>
                      <input
                        id="schedule-date"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white border-slate-300 text-slate-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="schedule-time">Pickup Time</Label>
                      <input
                        id="schedule-time"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white border-slate-300 text-slate-900"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Scheduled rides require prepayment. You'll receive driver assignment and
                      reminders 30 minutes before pickup.
                    </div>
                  </CardContent>
                </Card>
              )}

              {estimatedPrice !== null && priceBreakdown && (
                <div className="mt-4 space-y-2 p-4 bg-slate-50 border-2 border-slate-300 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Fare</span>
                    <span className="font-medium">{formatPriceWithUSD(priceBreakdown.base).pi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Platform Fee (
                      {rideOptions.find((r) => r.id === selectedRide)?.city === "Lagos, Nigeria"
                        ? rideOptions.find((r) => r.id === selectedRide)?.isPioneer
                          ? "18%"
                          : "20%"
                        : "3%"}
                      )
                    </span>
                    <span className="font-medium">{formatPriceWithUSD(priceBreakdown.platformFee).pi}</span>
                  </div>

                  {priceBreakdown.breakdown && (
                    <div className="ml-4 space-y-1 text-xs text-slate-600 border-l-2 border-slate-300 pl-3">
                      <div className="flex justify-between">
                        <span>• VAT (7.5%)</span>
                        <span>{priceBreakdown.breakdown.vat.toFixed(4)}π</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Ops/Processing (3%)</span>
                        <span>{priceBreakdown.breakdown.ops.toFixed(4)}π</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Driver Incentives (2%)</span>
                        <span>{priceBreakdown.breakdown.incentives.toFixed(4)}π</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Platform Fee</span>
                        <span>{priceBreakdown.breakdown.platform.toFixed(4)}π</span>
                      </div>
                    </div>
                  )}

                  {useReferralReward && availableRewards > 0 && (
                    <div className="flex justify-between text-secondary">
                      <span>Referral Reward</span>
                      <span className="font-medium">- {formatPriceWithUSD(priceBreakdown.platformFee).pi}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {
                          formatPriceWithUSD(
                            useReferralReward && availableRewards > 0 ? priceBreakdown.base : priceBreakdown.total,
                          ).pi
                        }
                      </div>
                      <div className="text-xs text-slate-600">
                        {
                          formatPriceWithUSD(
                            useReferralReward && availableRewards > 0 ? priceBreakdown.base : priceBreakdown.total,
                          ).usd
                        }
                      </div>
                    </div>
                  </div>

                  <PiVolatilityDisclaimer variant="inline" className="mt-2" />
                  {/* </CHANGE> */}
                </div>
              )}

              {ridesSearched && (
                <Button
                  onClick={handleConnectOrBook}
                  className="w-full"
                  size="lg"
                  disabled={
                    isConnecting ||
                    !pickup ||
                    !destination ||
                    selectedRide === null ||
                    (isScheduled && (!scheduleDate || !scheduleTime)) ||
                    isBooking // Disable button while booking
                  }
                >
                  {isConnecting
                    ? "Connecting..."
                    : !isConnected
                      ? "Connect Pi Wallet"
                      : isScheduled
                        ? `Prepay ${selectedRide ? (rideOptions.find((r) => r.id === selectedRide)?.price || 0) + ((rideOptions.find((r) => r.id === selectedRide)?.price || 0) * 0.03) : 0}π & Schedule Ride`
                        : `Confirm Booking${selectedRide ? ` • ${(rideOptions.find((r) => r.id === selectedRide)?.price || 0) + (rideOptions.find((r) => r.id === selectedRide)?.price || 0) * 0.03}π` : ""}`}
                </Button>
              )}

              {selectedRide !== null && (
                <Card className="p-4 bg-primary/10 border-2 border-primary">
                  <p className="text-sm font-medium mb-2">Selected Ride:</p>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{rideOptions.find((r) => r.id === selectedRide)?.name}</span>
                        {rideOptions.find((r) => r.id === selectedRide)?.isPioneer && (
                          <Badge className="bg-primary text-white text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Pioneer
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {rideOptions.find((r) => r.id === selectedRide)?.service}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-primary font-bold">
                        {formatPriceWithUSD(rideOptions.find((r) => r.id === selectedRide)?.price || 0).pi}
                      </div>
                      <div className="text-xs text-slate-600">
                        {formatPriceWithUSD(rideOptions.find((r) => r.id === selectedRide)?.price || 0).usd}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        + {rideOptions.find((r) => r.id === selectedRide)?.isPioneer ? "3" : "2"}% platform fee
                      </p>
                    </div>
                  </div>
                  {availableRewards > 0 && (
                    <div className="mt-3 p-3 bg-secondary/10 border border-secondary rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useReferralReward}
                          onChange={(e) => setUseReferralReward(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Gift className="w-4 h-4 text-secondary" />
                        <span className="text-sm font-medium">
                          Use referral reward (FREE platform fee) - {availableRewards} available
                        </span>
                      </label>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </Card>
        </div>

        {/* Ride Options */}
        <div className="space-y-4">
          {/* Results */}
          <div className="space-y-4">
            {/* Display surge pricing info */}
            {dynamicPricing && dynamicPricing.surge && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-orange-600 dark:text-orange-400 font-semibold">⚡ {dynamicPricing.surge}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Prices adjusted based on time, demand, and driver availability
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Available Rides</h3>
              {realDriversAvailable ? (
                <Badge className="bg-green-500">Drivers Available</Badge>
              ) : ridesSearched ? (
                <Badge variant="outline">Waiting for Drivers</Badge>
              ) : null}
            </div>

            {ridesSearched && !realDriversAvailable && (
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="text-center space-y-3">
                  <div className="text-5xl">🚗💨</div>
                  <h3 className="font-bold text-lg">Looking for Available Drivers...</h3>
                  <p className="text-sm text-muted-foreground">
                    Your driver will appear here when they become available in your area. Please check back shortly!
                  </p>
                  {/* Add waitlist badge if user is on waitlist */}
                  {userOnWaitlist && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <Check className="w-3 h-3" />
                      You're on the waitlist
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={handleSearchRides} disabled={isSearchingDrivers}>
                    {isSearchingDrivers ? "Checking..." : "Check Again"}
                  </Button>
                </div>
              </Card>
            )}

            {ridesSearched && !realDriversAvailable && (
              <Card
                className="p-4 cursor-pointer transition-all hover:shadow-md bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg text-slate-900"
                onClick={() => handleRideSelect(100)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl">🎮</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">Demo Ride</h4>
                        <ServiceTypeBadge type="pi_payment" />
                      </div>
                      <p className="text-xs text-primary font-medium mb-1">Pi Ride Demo Experience</p>
                      <p className="text-xs text-slate-600 mb-2">
                        Experience Pi Ride with a simulated journey. All Pi App fee proceeds support continued platform
                        development.
                      </p>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          20 sec simulation
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-secondary text-secondary" />
                          4.9
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{formatPriceWithUSD(0.1).pi}</div>
                    <div className="text-xs text-slate-600">{formatPriceWithUSD(0.1).usd}</div>
                    <p className="text-xs text-slate-600 mt-1">+ 3% Pi fee</p>
                  </div>
                </div>
              </Card>
            )}

            {ridesSearched &&
              realDriversAvailable &&
              filteredRides.map((ride) => (
                <Card
                  key={ride.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md bg-white/95 backdrop-blur-md border-2 shadow-lg text-slate-900 ${
                    selectedRide === ride.id ? "ring-4 ring-primary border-primary bg-primary/5" : "border-slate-300"
                  } ${ride.isPioneer ? "border-l-4 border-l-primary" : ""}`}
                  onClick={() => handleRideSelect(ride.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-4xl">{ride.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{ride.name}</h4>
                          {ride.isPioneer ? (
                            <ServiceTypeBadge type="pi_payment" />
                          ) : (
                            <ServiceTypeBadge type="affiliate" />
                          )}
                        </div>
                        <p className="text-xs text-primary font-medium mb-1">{ride.service}</p>
                        {ride.description && <p className="text-xs text-slate-600 mb-2">{ride.description}</p>}
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ride.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-secondary text-secondary" />
                            {ride.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {ride.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {ride.isPioneer ? (
                        <>
                          <div className="text-2xl font-bold text-primary">{formatPriceWithUSD(ride.price).pi}</div>
                          <div className="text-xs text-slate-600">{formatPriceWithUSD(ride.price).usd}</div>
                          <p className="text-xs text-slate-600 mt-1">+ 3% Pi fee</p>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-slate-700">${ride.price.toFixed(2)}</div>
                          <div className="text-xs text-secondary flex items-center justify-end gap-1 mt-1">
                            <ExternalLink className="w-3 h-3" />
                            Pay on site
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>

      {showDemoConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold">Demo Ride Experience</h2>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-purple-900">💰 Pi App Fee Notice</p>
              <p className="text-xs text-purple-800">
                This demo will charge your wallet $0.10 USD (≈{" "}
                {selectedRide !== null ? rideOptions.find((r) => r.id === selectedRide)?.price.toFixed(2) : "0.00"}π +
                network fees).{" "}
                <span className="font-semibold">All proceeds go to support Pi Ride development and operations.</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              You'll experience an animated ride along your chosen route with:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• Visual Pi car picking you up at your location</li>
              <li>• Turn-by-turn route following on interactive map</li>
              <li>• Road names visible as you travel</li>
              <li>• Real-time distance and ETA updates</li>
              <li>• Arrival celebration and driver rating</li>
            </ul>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowDemoConfirmation(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleStartDemo}
                disabled={isBooking}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isBooking
                  ? "Processing..."
                  : `Start Demo ($${selectedRide !== null ? rideOptions.find((r) => r.id === selectedRide)?.price.toFixed(2) : "0.00"})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 text-center relative overflow-hidden">
            {/* Celebration confetti effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 text-4xl animate-ping">🎉</div>
              <div className="absolute top-0 right-1/4 text-4xl animate-ping delay-300">🎊</div>
              <div className="absolute bottom-0 left-1/3 text-4xl animate-ping delay-500">✨</div>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="text-6xl animate-bounce">🎯</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                You Have Arrived!
              </h2>
              <p className="text-muted-foreground">
                Thank you for choosing Pi Ride! It has been our pleasure to serve you.
              </p>
              <p className="text-sm font-semibold text-purple-600">Please Rate Your Driver</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setDemoRating(star)}
                    className="text-4xl hover:scale-110 transition-transform"
                  >
                    {star <= demoRating ? "⭐" : "☆"}
                  </button>
                ))}
              </div>
              <Button
                onClick={() => {
                  setShowRating(false)
                  setPickup("")
                  setDestination("")
                  setSelectedRide(null)
                  setDemoRating(0)
                  setShowResults(false)
                  setRidesSearched(false)
                  toast({ title: "Thank You!", description: "Your demo ride is complete" })
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      <Dialog open={showWaitlistDialog} onOpenChange={setShowWaitlistDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Join Driver Waitlist?
            </DialogTitle>
            <DialogDescription>
              Would you like to be notified when drivers become available in your area? We'll send you a notification as
              soon as a driver signs up in your city.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl">📬</div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-purple-900 mb-1">Get notified instantly</p>
                <p className="text-purple-700 text-xs">
                  We'll alert you the moment a driver starts accepting rides in your area. You won't see this message
                  again after joining.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => handleWaitlistResponse(false)} disabled={isJoiningWaitlist}>
              Not Now
            </Button>
            <Button onClick={() => handleWaitlistResponse(true)} disabled={isJoiningWaitlist} className="flex-1">
              {isJoiningWaitlist ? "Joining..." : "Yes, Notify Me"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
