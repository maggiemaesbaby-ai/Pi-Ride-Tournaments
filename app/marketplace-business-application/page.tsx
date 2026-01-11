"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { Store, Check, TrendingUp, Shield, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PiVolatilityDisclaimer } from "@/components/pi-volatility-disclaimer"

export default function MarketplaceBusinessApplication() {
  const { user, authenticate } = usePiWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phone: "",
    description: "",
    category: "",
    website: "",
    feeStructure: "upfront", // "upfront" or "no-upfront"
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    console.log("[v0] Marketplace business application page loaded")
    console.log("[v0] User wallet state:", {
      hasUser: !!user,
      uid: user?.uid,
      username: user?.username,
    })

    return () => {
      setMounted(false)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submit triggered")
    console.log("[v0] User wallet state:", { uid: user?.uid, username: user?.username })
    console.log("[v0] Form data:", formData)

    if (!user?.uid) {
      console.log("[v0] No user wallet connected, prompting authentication")
      toast({
        title: "Connect Wallet",
        description: "Connecting your Pi wallet...",
      })

      try {
        await authenticate()
        if (!mounted) return
        toast({
          title: "Wallet Connected",
          description: "Please submit your application again.",
        })
        return
      } catch (error) {
        console.error("[v0] Authentication failed:", error)
        if (!mounted) return
        toast({
          title: "Authentication Failed",
          description: "Please try again.",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      console.log("[v0] Sending application request...")
      const response = await fetch("/api/send-business-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          piUserId: user.uid,
          piUsername: user.username,
          timestamp: new Date().toISOString(),
        }),
      })

      console.log("[v0] API response status:", response.status)
      const responseData = await response.json()
      console.log("[v0] API response data:", responseData)

      if (!mounted) return

      if (response.ok) {
        toast({
          title: "Application Submitted!",
          description: "We'll review your application and get back to you within 24-48 hours.",
        })
        router.push("/marketplace")
      } else {
        throw new Error(responseData.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("[v0] Business application error:", error)
      if (!mounted) return
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Store className="w-12 h-12 text-amber-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
              Become a Pi Marketplace Seller
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of businesses accepting Pi payments. Choose the fee structure that works best for you.
          </p>
        </div>

        {/* Fee Structure Options */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className={`cursor-pointer transition-all ${formData.feeStructure === "upfront" ? "border-amber-500 border-2 shadow-lg" : "hover:border-amber-300"}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Upfront Fee Option
              </CardTitle>
              <CardDescription>Pay once, lower commission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-amber-600">$150 USD</div>
              <div className="text-sm text-muted-foreground">One-time setup fee</div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Only 3% transaction fee</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Unlimited product listings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Priority customer support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Featured seller badge</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-amber-600 hover:bg-amber-700"
                onClick={() => {
                  console.log("[v0] Upfront package selected")
                  setFormData((prev) => ({ ...prev, feeStructure: "upfront" }))
                }}
                variant={formData.feeStructure === "upfront" ? "default" : "outline"}
                type="button"
              >
                Select Upfront
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${formData.feeStructure === "no-upfront" ? "border-purple-500 border-2 shadow-lg" : "hover:border-purple-300"}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                No Upfront Fee Option
              </CardTitle>
              <CardDescription>Start free, pay per sale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-purple-600">$0 USD</div>
              <div className="text-sm text-muted-foreground">No setup fee required</div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>5% transaction fee</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Unlimited product listings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Standard customer support</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Get started immediately</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={() => {
                  console.log("[v0] No upfront package selected")
                  setFormData((prev) => ({ ...prev, feeStructure: "no-upfront" }))
                }}
                variant={formData.feeStructure === "no-upfront" ? "default" : "outline"}
                type="button"
              >
                Select No Upfront
              </Button>
            </CardContent>
          </Card>
        </div>

        <PiVolatilityDisclaimer variant="compact" className="my-6" />

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Fill out your business details to get started. Selected plan:{" "}
              <span className="font-bold">
                {formData.feeStructure === "upfront"
                  ? "Upfront Fee ($150, 3% commission)"
                  : "No Upfront ($0 setup, 5% commission)"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Business Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="business@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Business Category *</Label>
                  <Input
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Electronics, Clothing, Food"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourbusiness.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell us about your business, what you sell, and why you want to accept Pi payments..."
                  rows={5}
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Secure & Verified</p>
                  <p>
                    All applications are reviewed within 24-48 hours. Your Pi wallet will be used for receiving
                    payments.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => router.push("/marketplace")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-700 hover:to-purple-700"
                  disabled={isSubmitting}
                  onClick={() => console.log("[v0] Submit button clicked", { hasUser: !!user, isSubmitting })}
                >
                  {isSubmitting ? "Submitting..." : user ? "Submit Application" : "Connect Wallet & Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
