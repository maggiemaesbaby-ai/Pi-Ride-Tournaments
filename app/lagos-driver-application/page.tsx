"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useCurrency } from "@/contexts/currency-provider"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { PiVolatilityDisclaimer } from "@/components/pi-volatility-disclaimer"
import {
  DollarSign,
  Star,
  TrendingUp,
  Shield,
  CheckCircle2,
  ArrowRight,
  Gift,
  Percent,
  Users,
  FileText,
  Calendar,
} from "lucide-react"

export default function LagosDriverApplicationPage() {
  const { connect, isConnected, user } = usePiWallet()
  const { piPrice } = useCurrency()
  const { toast } = useToast()

  const [step, setStep] = useState<"benefits" | "application">("benefits")
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    vehicleYear: "",
    vehicleMake: "",
    vehicleModel: "",
    locationLagosAdjacent: false,
    hasHackneyPermit: false,
    hasLasdriCert: false,
    hasInsurancePolicy: false,
    hasVisCertificate: false,
    passBackgroundCheck: false,
    agreedToTerms: false,
  })

  const SIGNUP_FEE_USD = 150
  const YEARLY_FEE_USD = 30
  const signupFeePi = (SIGNUP_FEE_USD / piPrice).toFixed(2)
  const yearlyFeePi = (YEARLY_FEE_USD / piPrice).toFixed(2)

  const handleSubmit = async () => {
    console.log("[v0] Lagos application submit clicked")
    console.log("[v0] isConnected:", isConnected)
    console.log("[v0] user:", user)
    console.log("[v0] formData:", formData)

    if (!isConnected || !user) {
      console.log("[v0] Triggering Pi wallet connect")
      toast({
        title: "Connect Pi Wallet",
        description: "Please connect your Pi wallet to continue",
        variant: "destructive",
      })
      await connect()
      return
    }

    if (!formData.agreedToTerms) {
      console.log("[v0] Terms not agreed")
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    try {
      const vehicleInfo = {
        year: formData.vehicleYear,
        make: formData.vehicleMake,
        model: formData.vehicleModel,
      }

      const payload = {
        piUserId: user.uid,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        vehicleInfo,
        locationLagosAdjacent: formData.locationLagosAdjacent,
        hasHackneyPermit: formData.hasHackneyPermit,
        hasLasdriCert: formData.hasLasdriCert,
        hasInsurancePolicy: formData.hasInsurancePolicy,
        hasVisCertificate: formData.hasVisCertificate,
        passBackgroundCheck: formData.passBackgroundCheck,
      }

      console.log("[v0] Sending Lagos application:", payload)

      const response = await fetch("/api/lagos/join-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] Lagos API response:", { status: response.status, data })

      if (response.ok && data.success) {
        toast({
          title: "Application Submitted! 🇳🇬",
          description: "You're on the Lagos driver waitlist. We'll notify you when we're ready to launch!",
          duration: 5000,
        })
        setStep("benefits")
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          vehicleYear: "",
          vehicleMake: "",
          vehicleModel: "",
          locationLagosAdjacent: false,
          hasHackneyPermit: false,
          hasLasdriCert: false,
          hasInsurancePolicy: false,
          hasVisCertificate: false,
          passBackgroundCheck: false,
          agreedToTerms: false,
        })
      } else {
        throw new Error(data.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("[v0] Lagos driver application error:", error)
      toast({
        title: "Application Error",
        description: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (step === "application") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-950 via-emerald-900 to-teal-950 py-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setStep("benefits")}
              className="border-green-400 text-green-400 hover:bg-green-400/10"
            >
              ← Back to Benefits
            </Button>
          </div>

          <Card className="bg-white/5 backdrop-blur-sm border-green-400/30">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Lagos Driver Application 🇳🇬</CardTitle>
              <CardDescription className="text-green-200">
                Complete your profile now. Pay fees only after launch announcement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected && (
                <Card className="border-green-400/30 bg-green-500/10">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-sm text-green-200">Connect your Pi wallet to continue</p>
                      <Button onClick={connect} className="bg-green-600 hover:bg-green-700 text-white">
                        Connect Pi Wallet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-white">Personal Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-green-200">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className="bg-white/10 border-green-400/30 text-white placeholder:text-green-300/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-green-200">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="bg-white/10 border-green-400/30 text-white placeholder:text-green-300/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-green-200">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+234 XXX XXX XXXX"
                      className="bg-white/10 border-green-400/30 text-white placeholder:text-green-300/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-green-200">
                      Date of Birth * (Must be 21+)
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="bg-white/10 border-green-400/30 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-white">Vehicle Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="vehicleYear" className="text-green-200">
                      Vehicle Year *
                    </Label>
                    <Input
                      id="vehicleYear"
                      value={formData.vehicleYear}
                      onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                      placeholder="2020"
                      className="bg-white/10 border-green-400/30 text-white placeholder:text-green-300/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleMake" className="text-green-200">
                      Vehicle Make *
                    </Label>
                    <Input
                      id="vehicleMake"
                      value={formData.vehicleMake}
                      onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                      placeholder="Toyota"
                      className="bg-white/10 border-green-400/30 text-white placeholder:text-green-300/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vehicleModel" className="text-green-200">
                      Vehicle Model *
                    </Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      placeholder="Camry"
                      className="bg-white/10 border-green-400/30 text-white placeholder:text-green-300/50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-white">Required Documents</h3>
                <p className="text-sm text-green-200">
                  Check yes if you have these documents. After approval, you'll upload them in your dashboard.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-green-400/30">
                    <Checkbox
                      id="hasHackneyPermit"
                      checked={formData.hasHackneyPermit}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasHackneyPermit: checked as boolean })}
                      className="border-green-400 mt-1"
                    />
                    <Label htmlFor="hasHackneyPermit" className="text-green-200 leading-relaxed cursor-pointer">
                      <strong>Do you currently have a Hackney Permit Number?</strong>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-green-400/30">
                    <Checkbox
                      id="hasLasdriCert"
                      checked={formData.hasLasdriCert}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasLasdriCert: checked as boolean })}
                      className="border-green-400 mt-1"
                    />
                    <Label htmlFor="hasLasdriCert" className="text-green-200 leading-relaxed cursor-pointer">
                      <strong>Do you have a LASDRI Certificate?</strong>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-green-400/30">
                    <Checkbox
                      id="hasInsurancePolicy"
                      checked={formData.hasInsurancePolicy}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasInsurancePolicy: checked as boolean })
                      }
                      className="border-green-400 mt-1"
                    />
                    <Label htmlFor="hasInsurancePolicy" className="text-green-200 leading-relaxed cursor-pointer">
                      <strong>Do you have a valid Insurance Policy?</strong>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-green-400/30">
                    <Checkbox
                      id="hasVisCertificate"
                      checked={formData.hasVisCertificate}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasVisCertificate: checked as boolean })}
                      className="border-green-400 mt-1"
                    />
                    <Label htmlFor="hasVisCertificate" className="text-green-200 leading-relaxed cursor-pointer">
                      <strong>Do you have a VIS Certificate?</strong>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-green-400/30">
                    <Checkbox
                      id="passBackgroundCheck"
                      checked={formData.passBackgroundCheck}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, passBackgroundCheck: checked as boolean })
                      }
                      className="border-green-400 mt-1"
                    />
                    <Label htmlFor="passBackgroundCheck" className="text-green-200 leading-relaxed cursor-pointer">
                      <strong>Do you believe you will pass the background check which is required?</strong>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 rounded-lg bg-white/5 border border-green-400/30">
                    <Checkbox
                      id="locationLagosAdjacent"
                      checked={formData.locationLagosAdjacent}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, locationLagosAdjacent: checked as boolean })
                      }
                      className="border-green-400 mt-1"
                    />
                    <Label htmlFor="locationLagosAdjacent" className="text-green-200 leading-relaxed cursor-pointer">
                      <strong>Is your location in Lagos or Lagos-adjacent area?</strong>
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg bg-green-500/10 border border-green-400/30">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked as boolean })}
                  className="border-green-400 mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-green-200 leading-relaxed cursor-pointer">
                  I agree to the terms and conditions. I understand that fees (${SIGNUP_FEE_USD} signup + $
                  {YEARLY_FEE_USD} yearly) will only be charged after the official launch announcement. After
                  application approval, I will receive a welcome message and agreement acknowledgement for legal
                  purposes.
                </Label>
              </div>

              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
              >
                Submit Application
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Benefits Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-emerald-900 to-teal-950 py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <Badge className="bg-green-500/20 text-green-300 border-green-400/50 text-lg px-4 py-2">
            Lagos, Nigeria 🇳🇬
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Drive with{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
              Pi Ride Lagos
            </span>
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Earn 80-82% of every ride. Build your business with transparent fees and rewarding incentives.
          </p>
        </div>

        {/* Fee Structure Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="bg-white/5 backdrop-blur-sm border-green-400/30">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-green-400" />
                Upfront Plan - 18% Fee
              </CardTitle>
              <CardDescription className="text-green-200">Best value for committed drivers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-green-100">
                  <span>Signup Fee (One-time):</span>
                  <span className="font-semibold">
                    ${SIGNUP_FEE_USD} ({signupFeePi}π)
                  </span>
                </div>
                <div className="flex justify-between text-green-100">
                  <span>Yearly License (Annual):</span>
                  <span className="font-semibold">
                    ${YEARLY_FEE_USD} ({yearlyFeePi}π)
                  </span>
                </div>
                <div className="flex justify-between text-green-100">
                  <span>Per-Ride Fee:</span>
                  <span className="font-semibold">18%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30">
                <p className="text-sm text-green-200">
                  <strong>You Keep:</strong> 82% of every fare
                </p>
              </div>
              <ul className="space-y-2 text-sm text-green-100">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Lower commission = More earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>Pay fees after launch announcement</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-green-400/30">
            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <Users className="h-6 w-6 text-emerald-400" />
                No Upfront Plan - 20% Fee
              </CardTitle>
              <CardDescription className="text-green-200">Start driving with zero upfront costs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-green-100">
                  <span>Signup Fee:</span>
                  <span className="font-semibold">$0</span>
                </div>
                <div className="flex justify-between text-green-100">
                  <span>Yearly License (Annual):</span>
                  <span className="font-semibold">
                    ${YEARLY_FEE_USD} ({yearlyFeePi}π)
                  </span>
                </div>
                <div className="flex justify-between text-green-100">
                  <span>Per-Ride Fee:</span>
                  <span className="font-semibold">20%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-400/30">
                <p className="text-sm text-green-200">
                  <strong>You Keep:</strong> 80% of every fare
                </p>
              </div>
              <ul className="space-y-2 text-sm text-green-100">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>No money required to start</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Only $30 yearly license fee (pay after launch)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Start earning immediately at launch</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Pi Volatility Disclaimer */}
        <PiVolatilityDisclaimer variant="compact" className="mb-8" />

        {/* Fee Breakdown */}
        <Card className="bg-white/5 backdrop-blur-sm border-green-400/30 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-green-400" />
              Where Your Fees Go (Transparent Breakdown)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-400/30">
                <div className="text-2xl font-bold text-green-400">7.5%</div>
                <div className="text-sm text-green-200">VAT (Government Tax)</div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-400/30">
                <div className="text-2xl font-bold text-emerald-400">3%</div>
                <div className="text-sm text-green-200">Operations & Processing</div>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-400/30">
                <div className="text-2xl font-bold text-teal-400">2%</div>
                <div className="text-sm text-green-200">Driver Incentives Pool</div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-400/30">
              <p className="text-sm text-green-200">
                <strong>Platform Fee:</strong> 5.5% (Upfront) or 7.5% (No Upfront) - Covers app development, customer
                support, and platform maintenance
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Program */}
        <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-sm border-amber-400/50 mb-12">
          <CardHeader>
            <CardTitle className="text-3xl text-white flex items-center gap-2">
              <Gift className="h-8 w-8 text-amber-400" />
              Driver Rewards Program
            </CardTitle>
            <CardDescription className="text-gray-200 text-lg font-semibold">
              Maintain quality service and get rewarded every 25 rides
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* How it Works */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-400" />
                How It Works
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-400/50">
                  <div className="text-3xl font-bold text-amber-400 mb-2">1</div>
                  <p className="text-gray-200 font-semibold">Complete 20 paid rides</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-400/50">
                  <div className="text-3xl font-bold text-amber-400 mb-2">2</div>
                  <p className="text-gray-200 font-semibold">Maintain 4.5+ star rating</p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-400/50">
                  <div className="text-3xl font-bold text-amber-400 mb-2">3</div>
                  <p className="text-gray-200 font-semibold">Get 5% bonus on next 5 rides</p>
                </div>
              </div>
            </div>

            {/* The Reward */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-2 border-amber-400">
              <div className="flex items-start gap-4">
                <Percent className="h-12 w-12 text-amber-300 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-white">5% Cashback Discount</h4>
                  <p className="text-gray-100 font-medium">
                    After every 20 paid rides with a 4.5+ rating, you receive a{" "}
                    <strong className="text-amber-300">
                      5% discount paid directly to your driver dashboard balance
                    </strong>{" "}
                    for your next 5 rides.
                  </p>
                  <p className="text-gray-200 text-sm font-semibold">
                    This returns approximately the platform profit to you as a reward for excellent service, while still
                    covering VAT and operational costs.
                  </p>
                </div>
              </div>
            </div>

            {/* Example Earnings */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-400" />
                Example Earnings
              </h3>
              <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/50 space-y-2">
                <div className="flex justify-between text-white font-medium">
                  <span>Average Ride Fare:</span>
                  <span className="font-semibold">π {(5000 / (piPrice || 1)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-medium">
                  <span>Your Earnings (18% fee):</span>
                  <span className="font-semibold">π {(4100 / (piPrice || 1)).toFixed(2)} (82%)</span>
                </div>
                <div className="flex justify-between text-amber-200 font-semibold">
                  <span>Bonus on Next 5 Rides (+5%):</span>
                  <span>π {(250 / (piPrice || 1)).toFixed(2)} extra per ride!</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold text-lg pt-2 border-t border-amber-400/50">
                  <span>Total Bonus (5 rides):</span>
                  <span>π {(1250 / (piPrice || 1)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Reward Cycle */}
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-400" />
                <h4 className="font-semibold text-white">Continuous Rewards</h4>
              </div>
              <p className="text-sm text-white font-medium">
                This cycle repeats automatically! Every 20 paid rides with 4.5+ rating = 5% bonus on the next 5 rides.
                Keep delivering excellent service and keep earning more.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Benefits */}
        <Card className="bg-white/5 backdrop-blur-sm border-green-400/30 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-green-400" />
              Why Drive with Pi Ride Lagos?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Transparent Fees</h4>
                    <p className="text-sm text-green-200">See exactly where every Pi goes. No hidden charges.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Instant Payouts</h4>
                    <p className="text-sm text-green-200">Cash out your earnings anytime to your Pi wallet.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Pay in Pi Cryptocurrency</h4>
                    <p className="text-sm text-green-200">Accept Pi payments - fast, secure, and low-cost.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Driver Support</h4>
                    <p className="text-sm text-green-200">24/7 support team ready to help with any issues.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Verified Riders</h4>
                    <p className="text-sm text-green-200">All riders verified through Pi Network for safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">Flexible Schedule</h4>
                    <p className="text-sm text-green-200">Drive when you want. Be your own boss.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center space-y-6">
          <div className="p-6 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to Join Pi Ride Lagos?</h3>
            <p className="text-green-200 mb-4">
              Complete your profile today. Pay fees only after our official launch announcement.
            </p>
            <Button
              size="lg"
              onClick={() => setStep("application")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-lg px-8 py-6"
            >
              Join Driver Waitlist Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>

          <p className="text-sm text-green-300">
            Questions? Contact us at{" "}
            <a href="mailto:drivers@piride.com" className="underline">
              drivers@piride.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
