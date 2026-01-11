"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Package, Clock, DollarSign, Shield, Search, Truck } from '@/lib/icons'
import { Box } from 'lucide-react'
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/contexts/currency-provider"

interface PackageSize {
  id: string
  name: string
  description: string
  maxWeight: string
  maxDimensions: string
  price: number
  icon: string
  isPioneer: boolean
}

const packageSizes: PackageSize[] = [
  {
    id: "small-pioneer",
    name: "Small Package",
    description: "Documents, small items",
    maxWeight: "Up to 5 lbs",
    maxDimensions: "12\" x 12\" x 6\"",
    price: 8.5,
    icon: "📦",
    isPioneer: true,
  },
  {
    id: "medium-pioneer",
    name: "Medium Package",
    description: "Boxes, clothing, electronics",
    maxWeight: "Up to 25 lbs",
    maxDimensions: "18\" x 18\" x 12\"",
    price: 15.0,
    icon: "📦",
    isPioneer: true,
  },
  {
    id: "large-pioneer",
    name: "Large Package",
    description: "Furniture, appliances",
    maxWeight: "Up to 50 lbs",
    maxDimensions: "24\" x 24\" x 18\"",
    price: 28.0,
    icon: "📦",
    isPioneer: true,
  },
  {
    id: "xl-pioneer",
    name: "Extra Large",
    description: "Multiple boxes, bulk items",
    maxWeight: "Up to 100 lbs",
    maxDimensions: "36\" x 36\" x 24\"",
    price: 45.0,
    icon: "🚛",
    isPioneer: true,
  },
]

export function PackagesTab() {
  const [pickupAddress, setPickupAddress] = useState("")
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [packageDetails, setPackageDetails] = useState("")
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const { isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const { formatPriceWithUSD } = useCurrency()

  const handleSearch = () => {
    if (!pickupAddress || !dropoffAddress) {
      toast({
        title: "Missing Addresses",
        description: "Please enter both pickup and dropoff addresses",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Finding Drivers",
      description: "Searching for available Pioneer drivers nearby...",
    })
  }

  const handleSelectSize = (sizeId: string) => {
    setSelectedSize(sizeId)
    const size = packageSizes.find((s) => s.id === sizeId)
    toast({
      title: "Package Size Selected",
      description: `${size?.name} - ${size?.price} π`,
    })
  }

  const handleBookDelivery = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Pi wallet to book delivery",
        variant: "destructive",
      })
      await connect()
      return
    }

    if (!pickupAddress || !dropoffAddress || !selectedSize || !recipientName || !recipientPhone) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const selectedPackage = packageSizes.find((s) => s.id === selectedSize)
    if (!selectedPackage) return

    const platformFee = selectedPackage.price * 0.03
    const totalAmount = selectedPackage.price + platformFee

    toast({
      title: "Processing Delivery",
      description: `Total: ${totalAmount.toFixed(2)} π`,
    })

    // Payment processing would go here
    console.log("[v0] Package delivery booking:", {
      pickupAddress,
      dropoffAddress,
      packageSize: selectedPackage.name,
      totalAmount,
    })
  }

  const handlePickupFocus = () => {
    if (!pickupAddress && navigator.geolocation) {
      toast({
        title: "Use Current Location?",
        description: "Tap 'Allow' to auto-fill your pickup address",
        action: {
          label: "Allow",
          onClick: () => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setPickupAddress("Current Location")
                toast({
                  title: "Location Enabled",
                  description: "Your current location has been set as pickup",
                })
              },
              () => {
                toast({
                  title: "Location Access Denied",
                  description: "Please enter your pickup address manually",
                  variant: "destructive",
                })
              },
            )
          },
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
          <Package className="w-6 h-6 text-primary" />
          Package Delivery
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="pickup" className="text-slate-900 font-semibold">
              Pickup Address *
            </Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
              <Input
                id="pickup"
                placeholder="Enter pickup address"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                onFocus={handlePickupFocus}
                className="pl-10 bg-slate-100/95 border-2 border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dropoff" className="text-slate-900 font-semibold">
              Dropoff Address *
            </Label>
            <div className="relative mt-2">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />
              <Input
                id="dropoff"
                placeholder="Enter dropoff address"
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                className="pl-10 bg-slate-100/95 border-2 border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipient-name" className="text-slate-900 font-semibold">
                Recipient Name *
              </Label>
              <Input
                id="recipient-name"
                placeholder="John Doe"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="mt-2 bg-slate-100/95 border-2 border-slate-300 text-slate-900"
              />
            </div>

            <div>
              <Label htmlFor="recipient-phone" className="text-slate-900 font-semibold">
                Recipient Phone *
              </Label>
              <Input
                id="recipient-phone"
                placeholder="(555) 123-4567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="mt-2 bg-slate-100/95 border-2 border-slate-300 text-slate-900"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="details" className="text-slate-900 font-semibold">
              Package Details (Optional)
            </Label>
            <Textarea
              id="details"
              placeholder="Describe your package (fragile, dimensions, special instructions...)"
              value={packageDetails}
              onChange={(e) => setPackageDetails(e.target.value)}
              className="mt-2 bg-slate-100/95 border-2 border-slate-300 text-slate-900"
              rows={3}
            />
          </div>

          <Button onClick={handleSearch} disabled={!pickupAddress || !dropoffAddress} className="w-full">
            <Search className="w-4 h-4 mr-2" />
            Find Available Drivers
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Select Package Size</h3>
          <Badge className="bg-primary text-white">
            <Shield className="w-3 h-3 mr-1" />
            Pioneer Drivers Only
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {packageSizes.map((size) => (
            <Card
              key={size.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                selectedSize === size.id
                  ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                  : "border-slate-300 hover:border-primary/50"
              }`}
              onClick={() => handleSelectSize(size.id)}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{size.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{size.name}</h4>
                    {size.isPioneer && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Pioneer
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{size.description}</p>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p>Max Weight: {size.maxWeight}</p>
                    <p>Max Dimensions: {size.maxDimensions}</p>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <div className="text-2xl font-bold text-primary">{formatPriceWithUSD(size.price).pi}</div>
                    <div className="text-sm text-slate-600">{formatPriceWithUSD(size.price).usd}</div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">+ 3% platform fee</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {selectedSize && (
        <Card className="p-6 bg-primary/10 border-2 border-primary">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Delivery Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">Package Size:</span>
              <span className="font-semibold text-slate-900">
                {packageSizes.find((s) => s.id === selectedSize)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Base Fee:</span>
              <span className="font-semibold text-slate-900">
                {formatPriceWithUSD(packageSizes.find((s) => s.id === selectedSize)?.price || 0).pi}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Platform Fee (3%):</span>
              <span className="font-semibold text-slate-900">
                {formatPriceWithUSD((packageSizes.find((s) => s.id === selectedSize)?.price || 0) * 0.03).pi}
              </span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-300 pt-2 text-lg">
              <span className="font-bold text-slate-900">Total:</span>
              <span className="font-bold text-primary">
                {formatPriceWithUSD((packageSizes.find((s) => s.id === selectedSize)?.price || 0) * 1.03).pi}
              </span>
            </div>
          </div>

          <Button onClick={handleBookDelivery} className="w-full mt-4" size="lg">
            {isConnected ? "Book Delivery" : "Connect Wallet to Book"}
          </Button>
        </Card>
      )}

      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Box className="w-5 h-5 text-blue-600" />
          Package Delivery Features
        </h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Verified Pioneer drivers only - Built-in trust and security</span>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Real-time tracking from pickup to delivery</span>
          </li>
          <li className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Only 3% platform fee - Drivers keep 97% of earnings</span>
          </li>
          <li className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <span>Same-day delivery available for local packages</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
