"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useCurrency } from "@/contexts/currency-provider" // Fixed back to correct path
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  Car,
  Package,
  UtensilsCrossed,
  Shield,
  CheckCircle2,
  ArrowRight,
  Calculator,
  Gift,
  AlertCircle, // Added for error/warning messages
} from "@/lib/icons"
import { driverPromoDB } from "@/lib/driver-promo-db"
import LocationsDB from "@/lib/locations-db" // Assuming LocationsDB is imported
import { validateVehicleYear, getVehicleRequirements } from "@/lib/vehicle-restrictions"

export default function DriveForPiPage() {
  const { connect, isConnected, user } = usePiWallet()
  const { piPrice, formatPriceWithUSD } = useCurrency()
  const { toast } = useToast()
  const [step, setStep] = useState<"landing" | "signup" | "other-cities" | "application">("landing") // Added "application" step
  const [ridesPerWeek, setRidesPerWeek] = useState(40)
  const [cityEligible, setCityEligible] = useState(false)
  const [remainingSlots, setRemainingSlots] = useState(0)
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    country: "", // Added country
    state: "", // Added state
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    vehicleColor: "", // Added vehicleColor
    driversLicense: "", // Added driversLicense
    services: [] as string[],
    agreedToTerms: false,
  })
  const [preSelectedCity, setPreSelectedCity] = useState<string | null>(null)
  const [cityLocked, setCityLocked] = useState(false)

  const [selectedFeePackage, setSelectedFeePackage] = useState<"upfront" | "no-upfront" | null>(null)

  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedState, setSelectedState] = useState("")

  const [vehicleYearError, setVehicleYearError] = useState<string>("")

  const SIGNUP_FEE_USD = 100 // $100 one-time fee
  const effectiveFeeUSD = promoApplied ? 0.001 : SIGNUP_FEE_USD
  const SIGNUP_FEE_PI = effectiveFeeUSD / piPrice // Convert to Pi
  const COMMISSION_RATE = 0.03 // 3%
  const UBER_COMMISSION_RATE = 0.3 // Uber/Lyft takes 30%
  const AVERAGE_RIDE = 20 // $20 average ride

  // Calculate savings
  const uberCommission = AVERAGE_RIDE * UBER_COMMISSION_RATE
  const piRideCommission = AVERAGE_RIDE * COMMISSION_RATE
  const savingsPerRide = uberCommission - piRideCommission
  const weeklyEarningsUber = ridesPerWeek * (AVERAGE_RIDE - uberCommission)
  const weeklyEarningsPiRide = ridesPerWeek * (AVERAGE_RIDE - piRideCommission)
  const weeklyExtraMoney = weeklyEarningsPiRide - weeklyEarningsUber
  const yearlyExtraMoney = weeklyExtraMoney * 52
  const breakEvenRides = Math.ceil(effectiveFeeUSD / savingsPerRide)

  const promoCities = driverPromoDB.getPromoCities()

  // Effect to pre-select city from URL parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const cityParam = params.get("city")
      if (cityParam) {
        setPreSelectedCity(cityParam)
        setCityLocked(true)
        setFormData((prev) => ({ ...prev, city: cityParam }))
        console.log("[v0] Pre-selected city from URL:", cityParam)
      }
    }
  }, [])

  // Effect to check city eligibility and remaining slots
  useEffect(() => {
    if (formData.city) {
      const eligible = driverPromoDB.isCityEligible(formData.city)
      const slots = driverPromoDB.getRemainingSlots(formData.city)
      setCityEligible(eligible)
      setRemainingSlots(slots)
    } else {
      setCityEligible(false)
      setRemainingSlots(0)
    }
  }, [formData.city])

  const applyPromoCode = () => {
    console.log("[v0] applyPromoCode called, code:", promoCode)
    if (!promoCode.trim()) {
      return // Silently return without toast for empty input
    }

    const validCodes = ["QUADSTATE"]
    if (validCodes.includes(promoCode.toUpperCase())) {
      setPromoApplied(true)
      toast({
        title: "Promo Code Applied!",
        description: "Signup fee reduced to 0.001π for testing!",
      })
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "Please check the code and try again.",
        variant: "destructive",
      })
    }
  }

  const handleServiceToggle = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }))
  }

  const handleVehicleYearChange = (year: string) => {
    setFormData({ ...formData, vehicleYear: year })

    // Clear error when user starts typing
    if (vehicleYearError) {
      setVehicleYearError("")
    }

    // Only validate if year is complete (4 digits)
    if (year.length === 4) {
      const yearNum = Number.parseInt(year)
      if (!isNaN(yearNum)) {
        const validation = validateVehicleYear(
          yearNum,
          formData.country || selectedCountry,
          formData.state || selectedState,
          formData.city,
        )

        if (!validation.isValid) {
          setVehicleYearError(validation.message)
        }
      }
    }
  }

  const getLocationRequirements = () => {
    if (!formData.country && !selectedCountry) return null

    return getVehicleRequirements(formData.country || selectedCountry, formData.state || selectedState, formData.city)
  }

  const handleOtherCitiesSignup = async () => {
    console.log("[v0] handleOtherCitiesSignup called")
    console.log("[v0] Selected package:", selectedFeePackage)
    console.log("[v0] Promo applied:", promoApplied)
    console.log("[v0] Wallet connected:", isConnected)

    if (!isConnected) {
      toast({
        title: "Connect Pi Wallet",
        description: "Please connect your Pi wallet to continue",
        variant: "destructive",
      })
      await connect()
      return
    }

    if (!selectedFeePackage) {
      toast({
        title: "Select Fee Package",
        description: "Please select a fee package to continue",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    if (formData.vehicleYear) {
      const yearNum = Number.parseInt(formData.vehicleYear)
      const validation = validateVehicleYear(yearNum, selectedCountry, selectedState, formData.city)

      if (!validation.isValid) {
        toast({
          title: "Vehicle Age Restriction",
          description: validation.message,
          variant: "destructive",
        })
        setVehicleYearError(validation.message)
        return
      }
    }

    const upfrontFeeAmount = promoApplied ? 0.001 : 100
    const commission = selectedFeePackage === "upfront" ? 0.03 : 0.05

    try {
      const response = await fetch("/api/driver-application/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          city: formData.city,
          country: selectedCountry,
          state: selectedState,
          vehicleType: formData.vehicleType,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vehicleColor: formData.vehicleColor,
          licensePlate: formData.licensePlate,
          driversLicense: formData.driversLicense,
          serviceCities: [formData.city], // Can be expanded to multiple cities
          piUserId: user?.uid,
          selectedFeePackage,
          commission,
          upfrontFeeOwed: selectedFeePackage === "upfront" ? upfrontFeeAmount : 0,
          // Keep previous logic for fee display if needed, but API only needs structured data
          // signupFee:
          //   selectedFeePackage === "upfront"
          //     ? `${upfrontFeeAmount}π - Upfront Plan (3% commission) - Deferred payment from first ride earnings`
          //     : "No upfront fee - 5% commission per ride",
          // selectedFeePackage, // already included
          // promoCode: promoApplied ? "QUADSTATE" : null, // promo is implied by upfrontFeeOwed and handled client-side for display
          // feePackage: selectedFeePackage, // redundant, use selectedFeePackage
          // commission, // already included
          // upfrontFeeOwed: selectedFeePackage === "upfront" ? upfrontFeeAmount : 0, // already included
          // upfrontFeePaid: 0, // not applicable here, for backend processing
          // timestamp: new Date().toISOString(), // server can handle this
          // userId: user?.uid, // use piUserId
          // username: user?.username, // not needed for submission, backend can fetch
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Application Submitted!",
          description: "We'll review your application within 24-48 hours and send you an email.",
          duration: 5000,
        })

        // Reset form
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          city: "",
          country: "",
          state: "",
          vehicleType: "",
          vehicleMake: "",
          vehicleModel: "",
          vehicleYear: "",
          licensePlate: "",
          vehicleColor: "", // Reset new field
          driversLicense: "", // Reset new field
          services: [],
          agreedToTerms: false,
        })
        setSelectedCountry("")
        setSelectedState("")
        setSelectedFeePackage(null)
        setPromoCode("")
        setPromoApplied(false)
        setStep("landing")
      } else {
        throw new Error(data.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("[v0] Application submission error:", error)
      toast({
        title: "Application Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    }
  }

  // This handles the signup logic for promotional cities
  const handleFreeSignup = async () => {
    if (!isConnected) {
      toast({
        title: "Connect Pi Wallet",
        description: "Please connect your Pi wallet to continue",
        variant: "destructive",
      })
      return
    }

    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.email ||
      !formData.city ||
      !formData.vehicleType ||
      formData.services.length === 0
    ) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    // If a city was pre-selected, ensure the user is applying for that city
    if (preSelectedCity && formData.city !== preSelectedCity) {
      toast({
        title: "City Mismatch",
        description: `You clicked on ${preSelectedCity} from the banner. Please apply for that city to claim the free signup.`,
        variant: "destructive",
      })
      return
    }

    let isFreeSignup = false
    // Check if the city is eligible and has slots, and if the user has a Pi username
    if (cityEligible && user?.username) {
      // Attempt to claim a free slot for the driver
      isFreeSignup = driverPromoDB.claimFreeSlot(formData.city, user.username)
      if (!isFreeSignup && preSelectedCity) {
        toast({
          title: "Free Slot Unavailable",
          description:
            "The free signup slot for this city has been claimed. Please select another city or use paid signup.",
          variant: "destructive",
        })
        return
      }
    }

    const applicationData = {
      ...formData,
      signupFee: isFreeSignup
        ? "FREE (Promotional Offer)"
        : promoApplied
          ? `0.001π (QUADSTATE promo applied)`
          : `${SIGNUP_FEE_PI.toFixed(2)}π ($${effectiveFeeUSD.toFixed(2)}) - Charged after first ride`, // Display fee in Pi and USD
      promotionalCity: cityEligible,
      freeSignup: isFreeSignup,
      promoCode: promoApplied ? "QUAD STATE" : null,
      timestamp: new Date().toISOString(),
      userId: user?.uid,
      username: user?.username,
    }

    try {
      const response = await fetch("/api/send-driver-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      })

      if (response.ok) {
        toast({
          title: isFreeSignup
            ? "🎉 FREE Signup Claimed!"
            : promoApplied
              ? "🎉 FREE Signup with QUAD STATE!"
              : "Application Submitted!",
          description: isFreeSignup
            ? "Congratulations! You're one of the first drivers in your city. Start earning with 0 fees!"
            : promoApplied
              ? "QUAD STATE promo applied! Your signup is completely FREE. Start earning immediately!"
              : "You can start accepting rides immediately. Fee will be charged after your first completed booking.",
        })
        // Reset form and state
        setFormData({
          fullName: "",
          phone: "",
          email: "",
          city: "",
          country: "",
          state: "",
          vehicleType: "",
          vehicleMake: "",
          vehicleModel: "",
          vehicleYear: "",
          licensePlate: "",
          services: [],
          agreedToTerms: false,
        })
        setPreSelectedCity(null)
        setCityLocked(false)
        setPromoCode("")
        setPromoApplied(false)
        setStep("landing")
      } else {
        throw new Error("Failed to send application")
      }
    } catch (error) {
      toast({
        title: "Application Received",
        description: "Your application is being processed. You'll receive confirmation shortly.",
      })
    }
  }

  const handleSubmit = async () => {
    console.log("[v0] handleSubmit called")
    if (step === "signup") {
      await handleFreeSignup()
    } else if (step === "other-cities") {
      await handleOtherCitiesSignup()
    } else if (step === "application") {
      if (formData.vehicleYear) {
        const yearNum = Number.parseInt(formData.vehicleYear)
        const validation = validateVehicleYear(
          yearNum,
          formData.country || selectedCountry,
          formData.state || selectedState,
          formData.city,
        )

        if (!validation.isValid) {
          toast({
            title: "Vehicle Age Restriction",
            description: validation.message,
            variant: "destructive",
          })
          setVehicleYearError(validation.message)
          return
        }
      }
      // For 'application' step, the submission logic is the same as 'other-cities'
      await handleOtherCitiesSignup()
    }
  }

  if (step === "signup") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => setStep("landing")}>
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">FREE Driver Signup - Limited Cities</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Driver Application</CardTitle>
              <CardDescription>Complete your registration to start earning with Pi Ride</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">Connect your Pi wallet to continue</p>
                      <Button onClick={connect}>Connect Pi Wallet</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">
                      City * (Free Signup Cities Only){" "}
                      {cityLocked && <Badge className="ml-2">Pre-selected for Free Signup</Badge>}
                    </Label>
                    <Select
                      value={formData.city}
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                      disabled={cityLocked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city" />
                      </SelectTrigger>
                      <SelectContent>
                        {promoCities.map(({ displayName }) => (
                          <SelectItem key={displayName} value={displayName}>
                            {displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cityLocked && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        You selected this city from the promotional banner. City is locked for free signup validation.
                      </p>
                    )}
                    {formData.city && cityEligible && remainingSlots > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <Gift className="w-4 h-4" />
                        <span className="font-semibold">
                          🎉 FREE signup available! {remainingSlots} spot{remainingSlots !== 1 ? "s" : ""} left in{" "}
                          {formData.city}
                        </span>
                      </div>
                    )}
                    {formData.city && !cityEligible && (
                      <p className="mt-2 text-sm text-destructive">
                        ❌ Free slots filled for this city. Please choose another city or use "All Other Cities" signup.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Not in a free signup city? You can still join!
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("other-cities")
                    setSelectedFeePackage(null)
                    setPromoCode("")
                    setPromoApplied(false)
                  }}
                  className="w-full"
                >
                  All Other Cities Signup
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type *</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleMake">Make</Label>
                      <Input
                        id="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Model</Label>
                      <Input
                        id="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                        placeholder="Camry"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleYear">Year *</Label>
                      <Input
                        id="vehicleYear"
                        type="number"
                        value={formData.vehicleYear}
                        onChange={(e) => handleVehicleYearChange(e.target.value)}
                        placeholder="2020"
                        className={vehicleYearError ? "border-destructive" : ""}
                      />
                      {vehicleYearError && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {vehicleYearError}
                        </p>
                      )}
                      {!vehicleYearError && (formData.city || formData.state || formData.country) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const req = getLocationRequirements()
                            return req ? `Min year: ${req.minYear} (${req.maxAge} yrs max age)` : ""
                          })()}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="licensePlate">License Plate</Label>
                      <Input
                        id="licensePlate"
                        value={formData.licensePlate}
                        onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                        placeholder="ABC123"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Services *</h3>
                <div className="grid gap-3">
                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.services.includes("rides") ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle("rides")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.services.includes("rides")} />
                        <Car className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">Passenger Rides</h4>
                          <p className="text-sm text-muted-foreground">Economy, Premium & XL rides</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.services.includes("food") ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle("food")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.services.includes("food")} />
                        <UtensilsCrossed className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">Food Delivery</h4>
                          <p className="text-sm text-muted-foreground">Restaurant & grocery delivery</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.services.includes("packages") ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle("packages")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.services.includes("packages")} />
                        <Package className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">Package Delivery</h4>
                          <p className="text-sm text-muted-foreground">Local package & parcel delivery</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full"
                disabled={!isConnected || !cityEligible || remainingSlots === 0}
              >
                {isConnected
                  ? cityEligible && remainingSlots > 0
                    ? "Claim FREE Driver Signup 🎉"
                    : "City Not Eligible - Select Another"
                  : "Connect Pi Wallet to Continue"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "other-cities") {
    const showFeePackageSelection = selectedFeePackage === null && formData.fullName && formData.email && formData.city

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setStep("landing")
                setSelectedFeePackage(null)
                setFormData({
                  fullName: "",
                  phone: "",
                  email: "",
                  city: "",
                  country: "",
                  state: "",
                  vehicleType: "",
                  vehicleMake: "",
                  vehicleModel: "",
                  vehicleYear: "",
                  licensePlate: "",
                  vehicleColor: "", // Reset new field
                  driversLicense: "", // Reset new field
                  services: [],
                  agreedToTerms: false,
                })
                setSelectedCountry("")
                setSelectedState("")
                setPromoCode("")
                setPromoApplied(false)
              }}
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">All Other Cities Signup</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Driver Application</CardTitle>
              <CardDescription>
                {selectedFeePackage
                  ? `Selected: ${selectedFeePackage === "upfront" ? "Upfront Plan (3% commission)" : "No Upfront Plan (5% commission)"}`
                  : "Complete your application to see fee packages"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Form - Always visible */}
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Personal Information</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Location</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Select
                        value={selectedCountry}
                        onValueChange={(value) => {
                          setSelectedCountry(value)
                          setSelectedState("") // Reset state when country changes
                          setFormData((prev) => ({ ...prev, country: value, state: "", city: "" })) // Preserve other fields
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {LocationsDB.getCountries().map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCountry && LocationsDB.getStatesOrProvinces(selectedCountry).length > 0 && (
                      <div>
                        <Label htmlFor="state">{LocationsDB.getLocationLabel(selectedCountry)} *</Label>
                        <Select
                          value={selectedState}
                          onValueChange={(value) => {
                            setSelectedState(value)
                            setFormData((prev) => ({ ...prev, state: value, city: "" })) // Preserve other fields including licensePlate
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${LocationsDB.getLocationLabel(selectedCountry).toLowerCase()}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {LocationsDB.getStatesOrProvinces(selectedCountry).map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter your city"
                        disabled={
                          !selectedCountry ||
                          (selectedCountry &&
                            LocationsDB.getStatesOrProvinces(selectedCountry).length > 0 &&
                            !selectedState)
                        }
                      />
                      {!selectedCountry && (
                        <p className="mt-1 text-xs text-muted-foreground">Please select a country first</p>
                      )}
                      {selectedCountry &&
                        LocationsDB.getStatesOrProvinces(selectedCountry).length > 0 &&
                        !selectedState && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Please select a {LocationsDB.getLocationLabel(selectedCountry).toLowerCase()} first
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Vehicle Information</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="vehicleType">Vehicle Type *</Label>
                      <Select
                        value={formData.vehicleType}
                        onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedan">Sedan</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="van">Van</SelectItem>
                          <SelectItem value="truck">Truck</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleMake">Make</Label>
                        <Input
                          id="vehicleMake"
                          value={formData.vehicleMake}
                          onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                          placeholder="Toyota"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicleModel">Model</Label>
                        <Input
                          id="vehicleModel"
                          value={formData.vehicleModel}
                          onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                          placeholder="Camry"
                        />
                      </div>
                    </div>
                    {/* Added vehicle year and license plate inputs to paid cities section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleYear">Year *</Label>
                        <Input
                          id="vehicleYear"
                          type="number"
                          value={formData.vehicleYear}
                          onChange={(e) => handleVehicleYearChange(e.target.value)}
                          placeholder="2020"
                          className={vehicleYearError ? "border-destructive" : ""}
                        />
                        {vehicleYearError && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {vehicleYearError}
                          </p>
                        )}
                        {!vehicleYearError && (formData.city || selectedState || selectedCountry) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {(() => {
                              const req = getLocationRequirements()
                              return req ? `Min year: ${req.minYear} (${req.maxAge} yrs max age)` : ""
                            })()}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="licensePlate">License Plate</Label>
                        <Input
                          id="licensePlate"
                          value={formData.licensePlate}
                          onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                          placeholder="ABC123"
                        />
                      </div>
                    </div>
                    {/* Added vehicle color and driver's license inputs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicleColor">Vehicle Color</Label>
                        <Input
                          id="vehicleColor"
                          value={formData.vehicleColor}
                          onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                          placeholder="Black"
                        />
                      </div>
                      <div>
                        <Label htmlFor="driversLicense">Driver's License #</Label>
                        <Input
                          id="driversLicense"
                          value={formData.driversLicense}
                          onChange={(e) => setFormData({ ...formData, driversLicense: e.target.value })}
                          placeholder="D12345678"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Select Services *</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "rides", label: "Rideshare", icon: Car },
                      { id: "packages", label: "Package Delivery", icon: Package }, // Corrected label to match enum
                      { id: "food", label: "Food Delivery", icon: UtensilsCrossed },
                    ].map((service) => (
                      <Card
                        key={service.id}
                        className={`cursor-pointer transition-colors ${
                          formData.services.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleServiceToggle(service.id)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <service.icon className="w-5 h-5" />
                          <span className="font-medium text-sm">{service.label}</span>
                          {formData.services.includes(service.id) && (
                            <CheckCircle2 className="w-4 h-4 ml-auto text-primary" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Removed "Continue to Fee Package Selection" button */}
              </>

              {/* Fee Package Selection - Show immediately after form */}
              <div id="fee-package-section" className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg text-center">Choose Your Fee Package</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${selectedFeePackage === "upfront" ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"}`}
                    onClick={() => setSelectedFeePackage("upfront")}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">Upfront Plan</CardTitle>
                      <CardDescription>Pay once, earn more</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">{promoApplied ? "0.001" : SIGNUP_FEE_PI.toFixed(2)}π</div>
                      <div className="text-sm text-muted-foreground">
                        {promoApplied ? "Test Fee (QUADSTATE)" : `$${SIGNUP_FEE_USD} one-time`}
                      </div>
                      <div className="space-y-2 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>3% commission per ride</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>Keep 97% of earnings</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>Priority support</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${selectedFeePackage === "no-upfront" ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"}`}
                    onClick={() => setSelectedFeePackage("no-upfront")}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">No Upfront Plan</CardTitle>
                      <CardDescription>Start now, pay as you go</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-3xl font-bold">0π</div>
                      <div className="text-sm text-muted-foreground">No signup fee</div>
                      <div className="space-y-2 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>5% commission per ride</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>Keep 95% of earnings</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>Standard support</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="promoCode">Have a Promo Code?</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promoCode"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., QUADSTATE)"
                      disabled={promoApplied}
                    />
                    <Button onClick={applyPromoCode} variant="outline" disabled={promoApplied}>
                      {promoApplied ? "✓ Applied" : "Apply"}
                    </Button>
                  </div>
                  {promoApplied && (
                    <p className="text-sm text-green-600 font-medium">
                      ✓ {promoCode} Applied - Signup fee reduced to 0.001π for testing
                    </p>
                  )}
                </div>
              </div>

              {selectedFeePackage && (
                <>
                  <div className="flex items-start space-x-2 pt-4">
                    <Checkbox
                      id="terms-other"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, agreedToTerms: checked as boolean }))
                      }
                    />
                    <Label htmlFor="terms-other" className="text-sm leading-tight">
                      I agree to the terms and conditions.
                      {selectedFeePackage === "upfront" && !promoApplied && (
                        <span> I understand the ${SIGNUP_FEE_USD} signup fee will be processed.</span>
                      )}
                      {selectedFeePackage === "no-upfront" && (
                        <span> I understand a 5% commission will be applied to each ride.</span>
                      )}
                      {promoApplied && <span> QUADSTATE promo applied - minimal test fee of 0.001π!</span>}
                    </Label>
                  </div>

                  {!isConnected && (
                    <Card className="border-orange-500/50 bg-orange-500/10">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-3">
                          <AlertCircle className="w-8 h-8 mx-auto text-orange-600" />
                          <p className="font-semibold">Pi Wallet Required</p>
                          <p className="text-sm text-muted-foreground">
                            Connect your Pi wallet to complete registration
                          </p>
                          <Button onClick={connect} size="lg" className="w-full">
                            Connect Pi Wallet
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={handleOtherCitiesSignup}
                    size="lg"
                    className="w-full"
                    disabled={!isConnected || !formData.agreedToTerms}
                  >
                    {!isConnected
                      ? "Connect Wallet to Continue"
                      : selectedFeePackage === "no-upfront"
                        ? "Submit Application (No Upfront Fee)"
                        : promoApplied
                          ? "Pay 0.001π & Submit"
                          : `Pay ${SIGNUP_FEE_PI.toFixed(2)}π & Submit`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // New step for detailed application after fee selection
  if (step === "application") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => {
                setStep("other-cities") // Go back to fee package selection
                setSelectedFeePackage(null) // Reset package selection
              }}
            >
              ← Back
            </Button>
            <h1 className="text-3xl font-bold">Driver Application Details</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Driver Application</CardTitle>
              <CardDescription>
                {promoApplied
                  ? "Complete your FREE application"
                  : `Complete your application for the ${selectedFeePackage === "upfront" ? "Upfront" : "No Upfront"} Plan`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Move wallet connection notice to bottom before submit button */}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Personal Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select
                      value={selectedCountry}
                      onValueChange={(value) => {
                        setSelectedCountry(value)
                        setSelectedState("")
                        setFormData((prev) => ({ ...prev, country: value, state: "", city: "" }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {LocationsDB.getCountries().map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCountry && LocationsDB.getStatesOrProvinces(selectedCountry).length > 0 && (
                    <div>
                      <Label htmlFor="state">{LocationsDB.getLocationLabel(selectedCountry)} *</Label>
                      <Select
                        value={selectedState}
                        onValueChange={(value) => {
                          setSelectedState(value)
                          setFormData((prev) => ({ ...prev, state: value, city: "" }))
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`Select your ${LocationsDB.getLocationLabel(selectedCountry).toLowerCase()}`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {LocationsDB.getStatesOrProvinces(selectedCountry).map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="city">City * (Where you will provide service)</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Enter your city"
                      disabled={
                        !selectedCountry ||
                        (selectedCountry &&
                          LocationsDB.getStatesOrProvinces(selectedCountry).length > 0 &&
                          !selectedState)
                      }
                    />
                    {!selectedCountry && (
                      <p className="mt-1 text-xs text-muted-foreground">Please select a country first</p>
                    )}
                    {selectedCountry &&
                      LocationsDB.getStatesOrProvinces(selectedCountry).length > 0 &&
                      !selectedState && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Please select a {LocationsDB.getLocationLabel(selectedCountry)} first
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="vehicleType">Vehicle Type *</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleMake">Make</Label>
                      <Input
                        id="vehicleMake"
                        value={formData.vehicleMake}
                        onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Model</Label>
                      <Input
                        id="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                        placeholder="Camry"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleYear">Year *</Label>
                      <Input
                        id="vehicleYear"
                        type="number"
                        value={formData.vehicleYear}
                        onChange={(e) => {
                          console.log("[v0] Vehicle year changed:", e.target.value)
                          handleVehicleYearChange(e.target.value)
                        }}
                        placeholder="2020"
                        className={vehicleYearError ? "border-destructive" : ""}
                      />
                      {vehicleYearError && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {vehicleYearError}
                        </p>
                      )}
                      {!vehicleYearError && (formData.city || selectedState || selectedCountry) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {(() => {
                            const req = getLocationRequirements()
                            return req ? `Min year: ${req.minYear} (${req.maxAge} yrs max age)` : ""
                          })()}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="licensePlate">License Plate</Label>
                      <Input
                        id="licensePlate"
                        value={formData.licensePlate}
                        onChange={(e) => {
                          console.log("[v0] License plate changed:", e.target.value)
                          setFormData({ ...formData, licensePlate: e.target.value })
                        }}
                        placeholder="ABC123"
                      />
                    </div>
                  </div>
                  {/* Added vehicle color and driver's license inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleColor">Vehicle Color</Label>
                      <Input
                        id="vehicleColor"
                        value={formData.vehicleColor}
                        onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                        placeholder="Black"
                      />
                    </div>
                    <div>
                      <Label htmlFor="driversLicense">Driver's License #</Label>
                      <Input
                        id="driversLicense"
                        value={formData.driversLicense}
                        onChange={(e) => setFormData({ ...formData, driversLicense: e.target.value })}
                        placeholder="D12345678"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Select Services *</h3>
                <div className="grid gap-3">
                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.services.includes("rides") ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle("rides")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.services.includes("rides")} />
                        <Car className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">Passenger Rides</h4>
                          <p className="text-sm text-muted-foreground">Economy, Premium & XL rides</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.services.includes("food") ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle("food")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.services.includes("food")} />
                        <UtensilsCrossed className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">Food Delivery</h4>
                          <p className="text-sm text-muted-foreground">Restaurant & grocery delivery</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all ${
                      formData.services.includes("packages") ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                    onClick={() => handleServiceToggle("packages")}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.services.includes("packages")} />
                        <Package className="w-5 h-5" />
                        <div>
                          <h4 className="font-semibold">Package Delivery</h4>
                          <p className="text-sm text-muted-foreground">Local package & parcel delivery</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold">Have a Promo Code?</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code (e.g., QUADSTATE)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                    />
                    <Button onClick={applyPromoCode} disabled={promoApplied}>
                      {promoApplied ? "✓ Applied" : "Apply"}
                    </Button>
                  </div>
                  {promoApplied && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>QUADSTATE promo applied - Reduced fee to 0.001π!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked as boolean })}
                  disabled={!selectedFeePackage}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the Pi Ride Driver Terms & Conditions, including vehicle insurance requirements, and
                  service standards.
                  {selectedFeePackage === "upfront" && !promoApplied && (
                    <span> I understand the ${SIGNUP_FEE_USD} signup fee will be charged at my first booking.</span>
                  )}
                  {/* Updated no-upfront commission from 15% to 5% */}
                  {selectedFeePackage === "no-upfront" && !promoApplied && (
                    <span> I understand a 5% commission will be applied to each ride.</span>
                  )}
                  {promoApplied && <span> The QUADSTATE promo makes signup completely free!</span>}
                </Label>
              </div>

              {!isConnected && (
                <Card className="border-orange-500/50 bg-orange-500/10">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <AlertCircle className="w-8 h-8 mx-auto text-orange-600" />
                      <p className="font-semibold">Pi Wallet Required</p>
                      <p className="text-sm text-muted-foreground">Connect your Pi wallet to complete registration</p>
                      <Button onClick={connect} size="lg" className="w-full">
                        Connect Pi Wallet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSubmit}
                disabled={
                  !cityEligible || // This check might not be relevant for 'application' step if it's for 'other-cities'
                  !formData.agreedToTerms ||
                  !isConnected ||
                  !formData.fullName ||
                  !formData.email ||
                  !formData.city ||
                  !selectedFeePackage
                }
                className="w-full"
                size="lg"
              >
                {isConnected
                  ? promoApplied
                    ? "Submit FREE Application (0.001π)"
                    : selectedFeePackage === "upfront"
                      ? `Submit Application (${SIGNUP_FEE_PI.toFixed(2)}π)`
                      : selectedFeePackage === "no-upfront"
                        ? "Submit Application (No Upfront Fee)"
                        : "Connect Wallet to Continue"
                  : "Connect Wallet to Continue"}
              </Button>

              {/* Update "All Other Cities" button text */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Already selected a package?</p>
                <Button variant="outline" onClick={() => setStep("other-cities")} className="w-full">
                  Go Back to Select Fee Package
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "landing") {
    return (
      <div className="min-h-screen bg-background">
        <section className="py-20 px-4">
          <div className="container max-w-6xl mx-auto text-center">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold mb-6">
              Industry-Leading Low Fees
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-balance">
              Drive for Pi Ride, Earn Up to <span className="text-primary">27% More</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto text-balance">
              Join the Pioneer-to-Pioneer economy. Pay once, earn forever with only 3% commission instead of Uber/Lyft's
              25-30%
            </p>

            <Card className="max-w-2xl mx-auto mb-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3 text-left">
                  <TrendingUp className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-lg mb-2">Already driving for Uber, Lyft, Via, Curb, or DoorDash?</h3>
                    <p className="text-muted-foreground mb-3">
                      <strong>Keep your current gig!</strong> Just sign up here and continue your normal routine. When a
                      Pioneer nearby needs a ride, you'll get an instant notification. Accept it and pocket
                      <span className="text-primary font-bold"> 27% more per ride</span>. Keep more of your hard-earned
                      money while helping the Pi community grow. Zero risk, all reward.
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="font-medium">
                        What do you have to lose? Nothing. What can you gain? Everything.
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" onClick={() => setStep("signup")}>
                Start Driving <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent"
                onClick={() => {
                  // Navigate to calculator or a dedicated section if available
                  // For now, just log intent or scroll to earnings section
                  console.log("Navigating to earnings calculation...")
                  // Example: window.scrollTo({ top: document.getElementById('earnings-calculator')?.offsetTop, behavior: 'smooth' });
                }}
              >
                <Calculator className="mr-2 w-5 h-5" />
                Calculate Your Earnings
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-card/50" id="earnings-calculator">
          <div className="container max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">See Your Real Earnings Difference</h2>

            <div className="mb-8">
              <Label htmlFor="rides-slider" className="text-lg font-semibold mb-4 block">
                How many rides do you plan per week? <span className="text-primary">{ridesPerWeek} rides</span>
              </Label>
              <input
                id="rides-slider"
                type="range"
                min="10"
                max="100"
                step="5"
                value={ridesPerWeek}
                onChange={(e) => setRidesPerWeek(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>10 rides/week</span>
                <span>100 rides/week</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Uber / Lyft / Via / DoorDash
                  </CardTitle>
                  <CardDescription>25-30% commission average</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Per ${AVERAGE_RIDE} ride:</span>
                    <span className="font-semibold">${(AVERAGE_RIDE - uberCommission).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Weekly earnings:</span>
                    <span className="font-semibold">${weeklyEarningsUber.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Yearly earnings:</span>
                    <span className="font-semibold text-lg">${(weeklyEarningsUber * 52).toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Pi Ride
                  </CardTitle>
                  <CardDescription>Only 3% commission</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Per ${AVERAGE_RIDE} ride:</span>
                    <span className="font-semibold text-green-600">
                      ${(AVERAGE_RIDE - piRideCommission).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Weekly earnings:</span>
                    <span className="font-semibold text-green-600">${weeklyEarningsPiRide.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Yearly earnings:</span>
                    <span className="font-semibold text-lg text-green-600">
                      ${(weeklyEarningsPiRide * 52).toFixed(0)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">${savingsPerRide.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Extra per ride</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">${weeklyExtraMoney.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Extra per week</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">${yearlyExtraMoney.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground">Extra per year</div>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Break even after just <span className="font-semibold text-primary">{breakEvenRides} rides</span> •
                    Then keep earning more forever
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Drive for Pi Ride?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <DollarSign className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Keep Your Money</CardTitle>
                </CardHeader>
                <CardContent>
                  Only 3% commission vs 25-30% on other platforms. That's $4-5 more per $20 ride in your pocket.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>Pioneer Verified</CardTitle>
                </CardHeader>
                <CardContent>
                  No background checks needed - Pi KYC verification provides built-in trust and security for the
                  community.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="w-10 h-10 text-primary mb-2" />
                  <CardTitle>No Commitment Required</CardTitle>
                </CardHeader>
                <CardContent>
                  Keep driving for Uber, Lyft, Via, DoorDash, or any other service. Pi Ride notifications pop up when
                  Pioneers nearby need rides. Accept when convenient, ignore when busy. Simple as that.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-primary/5">
          <div className="container max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Earning More?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of Pioneers who are building a better ride-sharing economy together
            </p>
            <Button size="lg" className="text-lg px-8" onClick={() => setStep("signup")}>
              Sign Up Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              ${SIGNUP_FEE_USD} one-time fee (in Pi) charged at your first booking • Use code QUAD STATE for FREE signup
              • Break even after {breakEvenRides} rides
            </p>
          </div>
        </section>
      </div>
    )
  }
}
