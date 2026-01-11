"use client"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ShieldCheck, BusIcon, ArrowRightLeft, Plane } from "lucide-react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/contexts/currency-provider"

interface ShuttleService {
  id: string
  name: string
  pickupLocation: string
  dropoffLocation: string
  departureTime: string
  price: number
  seatsAvailable: number
}

interface InsuranceQuote {
  id: string
  provider: string
  plan: string
  coverage: string
  basePrice: number
  piRideFee: number
  totalPrice: number
  features: string[]
}

interface ParkingSpot {
  id: string
  name: string
  address: string
  distance: string
  pricePerHour: number
  pricePerDay: number
  availability: string
  features: string[]
  rating: number
}

const mockShuttles: ShuttleService[] = [
  {
    id: "s1",
    name: "Airport Express",
    pickupLocation: "Downtown Terminal",
    dropoffLocation: "International Airport",
    departureTime: "6:00 AM",
    price: 25,
    seatsAvailable: 8,
  },
  {
    id: "s2",
    name: "City Shuttle",
    pickupLocation: "Hotel District",
    dropoffLocation: "Airport Terminal 1",
    departureTime: "8:30 AM",
    price: 20,
    seatsAvailable: 12,
  },
  {
    id: "s3",
    name: "Premium Airport Transfer",
    pickupLocation: "City Center",
    dropoffLocation: "All Airport Terminals",
    departureTime: "10:00 AM",
    price: 35,
    seatsAvailable: 6,
  },
]

const mockInsuranceQuotes: InsuranceQuote[] = [
  {
    id: "i1",
    provider: "Allianz Travel",
    plan: "Basic Coverage",
    coverage: "Up to $50,000",
    basePrice: 45,
    piRideFee: 2.25,
    totalPrice: 47.25,
    features: ["Trip Cancellation", "Medical Emergency", "Lost Baggage"],
  },
  {
    id: "i2",
    provider: "AIG Travel Guard",
    plan: "Premium Protection",
    coverage: "Up to $100,000",
    basePrice: 85,
    piRideFee: 4.25,
    totalPrice: 89.25,
    features: ["Trip Cancellation", "Medical Emergency", "Lost Baggage", "Flight Delay", "24/7 Assistance"],
  },
  {
    id: "i3",
    provider: "Travel Insure",
    plan: "Comprehensive Plan",
    coverage: "Up to $250,000",
    basePrice: 125,
    piRideFee: 6.25,
    totalPrice: 131.25,
    features: [
      "Trip Cancellation",
      "Medical Emergency",
      "Lost Baggage",
      "Flight Delay",
      "Rental Car Coverage",
      "Adventure Sports",
    ],
  },
]

const mockParkingSpots: ParkingSpot[] = [
  {
    id: "p1",
    name: "Downtown Parking Garage",
    address: "123 Main St",
    distance: "0.3 mi",
    pricePerHour: 5,
    pricePerDay: 35,
    availability: "Available",
    features: ["Covered", "EV Charging", "24/7 Access"],
    rating: 4.5,
  },
  {
    id: "p2",
    name: "City Center Lot",
    address: "456 Oak Ave",
    distance: "0.5 mi",
    pricePerHour: 4,
    pricePerDay: 28,
    availability: "Available",
    features: ["Security Cameras", "Well-lit", "Handicap Access"],
    rating: 4.3,
  },
  {
    id: "p3",
    name: "Premium Underground Parking",
    address: "789 Elm St",
    distance: "0.7 mi",
    pricePerHour: 8,
    pricePerDay: 50,
    availability: "Available",
    features: ["Valet Service", "Covered", "Car Wash", "Reserved Spots"],
    rating: 4.8,
  },
]

export function TravelEssentialsTab() {
  const [serviceType, setServiceType] = useState<"shuttle" | "insurance" | "currency" | "parking">("shuttle")
  const [selectedShuttle, setSelectedShuttle] = useState<ShuttleService | null>(null)
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceQuote | null>(null)
  const [shuttleDate, setShuttleDate] = useState("")
  const [shuttlePassengers, setShuttlePassengers] = useState("1")
  const [tripDuration, setTripDuration] = useState("")
  const [destination, setDestination] = useState("")
  const [fromCurrency, setFromCurrency] = useState("USD")
  const [toCurrency, setToCurrency] = useState("EUR")
  const [amount, setAmount] = useState("100")
  const [exchangeRate, setExchangeRate] = useState(0.92)
  const [convertedAmount, setConvertedAmount] = useState(92)
  const [selectedParkingSpot, setSelectedParkingSpot] = useState<ParkingSpot | null>(null)
  const [parkingLocation, setParkingLocation] = useState("")
  const [parkingDate, setParkingDate] = useState("")
  const [parkingDuration, setParkingDuration] = useState("daily")
  const [parkingHours, setParkingHours] = useState("1")
  const { isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const { formatPriceWithUSD } = useCurrency()

  const handleShuttleBooking = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (selectedShuttle && shuttleDate) {
      const total = selectedShuttle.price * Number.parseInt(shuttlePassengers)
      toast({
        title: "Shuttle Booked!",
        description: `${selectedShuttle.name} on ${shuttleDate} - ${total} Pi`,
      })
      setSelectedShuttle(null)
      setShuttleDate("")
    }
  }

  const handleInsurancePurchase = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (selectedInsurance && destination && tripDuration) {
      toast({
        title: "Insurance Purchased!",
        description: `${selectedInsurance.provider} ${selectedInsurance.plan} - ${selectedInsurance.totalPrice} Pi (includes 5% Pi Ride fee)`,
      })
      setSelectedInsurance(null)
      setDestination("")
      setTripDuration("")
    }
  }

  const handleCurrencyExchange = () => {
    const converted = Number.parseFloat(amount) * exchangeRate
    setConvertedAmount(Number(converted.toFixed(2)))
    toast({
      title: "Currency Converted",
      description: `${amount} ${fromCurrency} = ${converted.toFixed(2)} ${toCurrency}`,
    })
  }

  const handleParkingReservation = async () => {
    if (!isConnected) {
      await connect()
      return
    }

    if (selectedParkingSpot && parkingLocation && parkingDate) {
      const price =
        parkingDuration === "hourly"
          ? selectedParkingSpot.pricePerHour * Number.parseInt(parkingHours)
          : selectedParkingSpot.pricePerDay

      toast({
        title: "Parking Reserved!",
        description: `${selectedParkingSpot.name} on ${parkingDate} - ${price} Pi`,
      })
      setSelectedParkingSpot(null)
      setParkingLocation("")
      setParkingDate("")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Travel Essentials
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Shuttle Service */}
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
            <BusIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Shuttle Service</h3>
            <p className="text-slate-600 mb-4">Airport shuttles, city transfers, and group transportation</p>
            <div className="inline-block px-4 py-2 bg-primary/20 text-primary font-semibold rounded-lg">
              Partnerships Coming Soon
            </div>
          </Card>

          {/* Travel Insurance */}
          <Card className="p-8 text-center bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-2 border-blue-500/20">
            <Plane className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Travel Insurance</h3>
            <p className="text-slate-600 mb-4">Trip protection, medical coverage, and cancellation insurance</p>
            <div className="inline-block px-4 py-2 bg-blue-500/20 text-blue-600 font-semibold rounded-lg">
              Partnerships Coming Soon
            </div>
          </Card>

          {/* Currency Exchange */}
          <Card className="p-8 text-center bg-gradient-to-br from-green-500/5 to-green-500/10 border-2 border-green-500/20">
            <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Currency Exchange</h3>
            <p className="text-slate-600 mb-4">Real-time rates and convenient exchange locations</p>
            <div className="inline-block px-4 py-2 bg-green-500/20 text-green-600 font-semibold rounded-lg">
              Partnerships Coming Soon
            </div>
          </Card>

          {/* Parking Reservations */}
          <Card className="p-8 text-center bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-2 border-purple-500/20">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Parking Reservations</h3>
            <p className="text-slate-600 mb-4">Pre-book parking spots at airports and city centers</p>
            <div className="inline-block px-4 py-2 bg-purple-500/20 text-purple-600 font-semibold rounded-lg">
              Partnerships Coming Soon
            </div>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-slate-100 rounded-lg border-2 border-slate-300">
          <p className="text-center text-slate-700">
            We're working on bringing you travel essentials you can book with Pi. Stay tuned for partnerships with
            leading travel service providers!
          </p>
        </div>
      </Card>
    </div>
  )
}
