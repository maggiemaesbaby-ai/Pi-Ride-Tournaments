"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Clock, DollarSign } from "lucide-react"
import { useCurrency } from "@/contexts/currency-provider"
import { toast } from "@/components/ui/use-toast"
import { VehicleImageGallery } from "@/components/vehicle-image-gallery"

export function VehiclesTab() {
  const { piPrice, formatPrice } = useCurrency()

  // Example vehicle from DTC Autogroup - 2025 Ram 5500 Chassis Cab
  const exampleVehicleUSD = 89995 // Example MSRP
  const exampleVehiclePi = Math.round(exampleVehicleUSD / piPrice)

  const exampleVehicleImages = [
    "/2025-ram-5500-front-view.jpg",
    "/2025-ram-5500-side-view.jpg",
    "/2025-ram-5500-rear-view.jpg",
    "/2025-ram-5500-interior-dashboard.jpg",
    "/2025-ram-5500-interior-seats.jpg",
    "/2025-ram-5500-engine-bay.jpg",
  ]

  const handleComingSoon = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Vehicle purchasing with Pi will be available after partnership with DTC Autogroup is finalized.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Car className="w-8 h-8 text-blue-500" />
          Buy New Vehicles with Pi
        </h2>
        <p className="text-muted-foreground">Partnership coming soon with DTC Autogroup</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-8 space-y-6 bg-gradient-to-br from-card to-muted/30 border-2 border-blue-500/20">
        <div className="flex items-center justify-center gap-3">
          <Car className="w-12 h-12 text-blue-500" />
          <h3 className="text-2xl font-bold">DTC Autogroup Partnership</h3>
        </div>

        <div className="space-y-4 p-6 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="font-bold text-lg flex items-center gap-2 justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
            Coming Soon
          </h4>
          <div className="space-y-3 text-sm text-center text-muted-foreground">
            <p>Purchase new vehicles from DTC Autogroup dealerships</p>
            <p>Pay with Pi cryptocurrency</p>
            <p>Seamless Pi-to-USD conversion at checkout</p>
            <p>Browse inventory including Ram, Chrysler, Dodge, Jeep & more</p>
          </div>
        </div>

        {/* Example Vehicle */}
        <Card className="border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-500" />
              Example: 2025 Ram 5500 Chassis Cab
            </CardTitle>
            <CardDescription>Preview of upcoming vehicle inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <VehicleImageGallery images={exampleVehicleImages} vehicleName="2025 Ram 5500 Chassis Cab" />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">MSRP (USD)</span>
              <span className="text-lg font-bold">${exampleVehicleUSD.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Price in Pi</span>
              <span className="text-lg font-bold text-primary">{formatPrice(exampleVehiclePi)}</span>
            </div>
            <Button className="w-full" onClick={handleComingSoon}>
              <DollarSign className="w-5 h-5 mr-2" />
              Purchase with Pi - Coming Soon
            </Button>
          </CardContent>
        </Card>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 pt-6">
        <Card className="p-6 space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            Why Buy Vehicles with Pi?
          </CardTitle>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Pay with Pi cryptocurrency for new vehicles</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Access to DTC Autogroup inventory nationwide</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Seamless Pi-to-USD conversion at market rates</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
              <span>Same competitive pricing as cash/financing</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            Coming Soon Features
          </CardTitle>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Browse full DTC Autogroup inventory in-app</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Real-time vehicle availability and pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Compare models and trim levels</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Exclusive Pi user vehicle deals</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
