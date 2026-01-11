"use client"
import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Hotel, Star, Wifi, CarIcon, Coffee } from "lucide-react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { LocationPermissionDialog } from "@/components/location-permission-dialog"

interface Accommodation {
  id: string
  name: string
  type: "hotel" | "rental" | "hostel" | "rv-park"
  rating: number
  pricePerNight: number
  location: string
  amenities: string[]
  image: string
  available: boolean
}

const accommodationTypes = [
  { value: "all", label: "All Types" },
  { value: "hotel", label: "Hotels" },
  { value: "rental", label: "Vacation Rentals" },
  { value: "hostel", label: "Hostels" },
  { value: "rv-park", label: "RV Parks" },
]

const mockAccommodations: Accommodation[] = [
  {
    id: "1",
    name: "Downtown Grand Hotel",
    type: "hotel",
    rating: 4.7,
    pricePerNight: 89,
    location: "Downtown District",
    amenities: ["Wifi", "Parking", "Breakfast"],
    image: "/luxury-hotel-exterior.png",
    available: true,
  },
  {
    id: "2",
    name: "Cozy Beach House",
    type: "rental",
    rating: 4.9,
    pricePerNight: 145,
    location: "Beachfront",
    amenities: ["Wifi", "Kitchen", "Ocean View"],
    image: "/beach-house-rental.jpg",
    available: true,
  },
  {
    id: "3",
    name: "Budget Travelers Hostel",
    type: "hostel",
    rating: 4.3,
    pricePerNight: 25,
    location: "City Center",
    amenities: ["Wifi", "Common Area", "Lockers"],
    image: "/modern-hostel.jpg",
    available: true,
  },
  {
    id: "4",
    name: "Sunrise RV Resort",
    type: "rv-park",
    rating: 4.6,
    pricePerNight: 45,
    location: "Mountain View",
    amenities: ["Electric Hookup", "Water", "Dump Station"],
    image: "/rv-park-campground.jpg",
    available: true,
  },
  {
    id: "5",
    name: "Mountain View Lodge",
    type: "hotel",
    rating: 4.8,
    pricePerNight: 125,
    location: "Mountain District",
    amenities: ["Wifi", "Spa", "Restaurant"],
    image: "/mountain-lodge-hotel.png",
    available: true,
  },
]

const amenityIcons: Record<string, any> = {
  Wifi: Wifi,
  Parking: CarIcon,
  Breakfast: Coffee,
  Kitchen: Coffee,
  Spa: Star,
  Restaurant: Coffee,
}

export function AccommodationTab() {
  const [location, setLocation] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("2")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null)
  const { isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const bookingFormRef = useRef<HTMLDivElement>(null)
  const [showLocationDialog, setShowLocationDialog] = useState(false)

  const handleSearch = () => {
    if (!location || !checkIn || !checkOut) {
      toast({
        title: "Missing Information",
        description: "Please enter location and dates",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Searching Accommodations",
      description: `Finding available stays in ${location}...`,
    })
  }

  const handleSelect = (accommodation: Accommodation) => {
    setSelectedAccommodation(accommodation)
    toast({
      title: "Accommodation Selected",
      description: `Selected ${accommodation.name}`,
    })

    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 100)
  }

  const handleBooking = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (selectedAccommodation && checkIn && checkOut) {
      const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
      const baseTotal = selectedAccommodation.pricePerNight * nights
      const appFee = baseTotal * 0.05
      const total = baseTotal + appFee

      toast({
        title: "Booking Confirmed!",
        description: `${selectedAccommodation.name} booked for ${nights} nights - ${total.toFixed(2)} Pi (includes ${appFee.toFixed(2)} Pi app fee)`,
      })

      setSelectedAccommodation(null)
      setLocation("")
      setCheckIn("")
      setCheckOut("")
    }
  }

  const handleLocationFocus = () => {
    if (!location && navigator.geolocation) {
      setShowLocationDialog(true)
    }
  }

  const handleAllowLocation = () => {
    setShowLocationDialog(false)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation("Current Location")
          toast({
            title: "Location Enabled",
            description: "Searching for accommodations near you",
          })
        },
        () => {
          toast({
            title: "Location Access Denied",
            description: "Please enter your destination manually",
            variant: "destructive",
          })
        },
      )
    }
  }

  const handleDenyLocation = () => {
    setShowLocationDialog(false)
    toast({
      title: "Location Not Enabled",
      description: "Please enter your destination manually",
    })
  }

  const filteredAccommodations =
    selectedType === "all" ? mockAccommodations : mockAccommodations.filter((acc) => acc.type === selectedType)

  const sortedAccommodations = [...filteredAccommodations].sort((a, b) => a.pricePerNight - b.pricePerNight)

  return (
    <div className="space-y-6">
      <LocationPermissionDialog show={showLocationDialog} onAllow={handleAllowLocation} onDeny={handleDenyLocation} />

      <Card className="p-12 text-center bg-gradient-to-r from-purple-50 via-blue-50 to-pink-50 border-2 border-purple-200">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-600 to-pink-500 rounded-full flex items-center justify-center">
            <Hotel className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Accommodation Partnerships Coming Soon
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              We're working with hotels, vacation rentals, hostels, and RV parks to bring you exclusive Pi-powered
              booking options with zero platform fees.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold mb-2">🏨 Hotels & Resorts</h3>
              <p className="text-sm text-muted-foreground">Premium accommodations worldwide</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold mb-2">🏠 Vacation Rentals</h3>
              <p className="text-sm text-muted-foreground">Unique homes and apartments</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold mb-2">🛏️ Hostels & Budget Stays</h3>
              <p className="text-sm text-muted-foreground">Affordable travel options</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold mb-2">🚐 RV Parks & Camping</h3>
              <p className="text-sm text-muted-foreground">Outdoor adventure spots</p>
            </div>
          </div>
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg px-6 py-2">
            Stay Tuned for Updates!
          </Badge>
        </div>
      </Card>
    </div>
  )
}
