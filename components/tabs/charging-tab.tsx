"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, MapPin, Navigation } from "@/lib/icons"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { toast } from "@/components/ui/use-toast"

interface ChargingStation {
  id: string
  name: string
  address: string
  distance: number
  available: number
  total: number
  lat: number
  lng: number
}

export function ChargingTab() {
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [estimatedKwh, setEstimatedKwh] = useState(30)
  const { isConnected, connect } = usePiWallet()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setUserLocation(location)
          fetchNearbyStations(location.lat, location.lng)
        },
        () => {
          console.warn("[v0] Location access denied for EV charging")
          setLoading(false)
          toast({
            title: "Location Required",
            description: "Please enable location services to find nearby EV charging stations",
            variant: "destructive",
          })
        },
      )
    } else {
      setLoading(false)
    }
  }, [])

  const fetchNearbyStations = async (lat: number, lng: number) => {
    setLoading(true)

    // TODO: Integrate with OpenChargeMap API or similar EV charging station database
    console.log(`[v0] Fetching EV stations near ${lat}, ${lng}`)

    // Demo data
    setTimeout(() => {
      const demoStations: ChargingStation[] = [
        {
          id: "1",
          name: "Downtown Charging Hub",
          address: "123 Main St",
          distance: 0.5,
          available: 4,
          total: 6,
          lat: lat + 0.005,
          lng: lng + 0.005,
        },
        {
          id: "2",
          name: "Mall Parking Lot",
          address: "456 Shopping Center Dr",
          distance: 1.2,
          available: 2,
          total: 4,
          lat: lat - 0.007,
          lng: lng + 0.008,
        },
        {
          id: "3",
          name: "Airport Station",
          address: "789 Airport Rd",
          distance: 3.5,
          available: 8,
          total: 10,
          lat: lat + 0.01,
          lng: lng - 0.009,
        },
      ]
      setStations(demoStations)
      setLoading(false)
    }, 1000)
  }

  const openDirections = (station: ChargingStation) => {
    toast({
      title: "Directions Coming Soon",
      description: `Navigation to ${station.name} will be available after Pi Network approval`,
    })
  }

  const handleConnectOrBook = async () => {
    console.log("[v0] Charging - Connect or Book clicked", { isConnected })

    if (!isConnected) {
      console.log("[v0] Charging - Wallet not connected, initiating connection...")
      await connect()
      return
    }

    await handleBookCharging()
  }

  const handleBookCharging = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Pi wallet to book charging.",
        variant: "destructive",
      })
      return
    }

    if (selectedStation === null) {
      toast({
        title: "No station selected",
        description: "Please select a charging station.",
        variant: "destructive",
      })
      return
    }

    const station = stations.find((s) => s.id === selectedStation)
    if (!station) return

    const baseAmount = 0.15 * estimatedKwh // Placeholder price
    const platformFee = baseAmount * 0.02
    const totalAmount = baseAmount + platformFee

    try {
      if (typeof window === "undefined" || !window.Pi || typeof window.Pi.createPayment !== "function") {
        toast({
          title: "Pi SDK not available",
          description: "Please make sure you're accessing this app through the Pi Browser.",
          variant: "destructive",
        })
        return
      }

      const paymentData = {
        amount: totalAmount,
        memo: `EV Charging: ${station.name} - ${estimatedKwh} kWh`,
        metadata: {
          service: "charging",
          station: station.name,
          kwh: estimatedKwh,
        },
      }

      window.Pi.createPayment(paymentData, {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[v0] Charging - Payment ready for approval:", paymentId)
          try {
            const response = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            if (!response.ok) {
              throw new Error("Failed to approve payment")
            }

            console.log("[v0] Charging - Payment approved successfully")
          } catch (error) {
            console.error("[v0] Charging - Error approving payment:", error)
            toast({
              title: "Approval Failed",
              description: "Failed to approve payment. Please try again.",
              variant: "destructive",
            })
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[v0] Charging - Payment completed:", { paymentId, txid })
          try {
            const response = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            if (!response.ok) {
              throw new Error("Failed to complete payment")
            }

            toast({
              title: "Charging slot reserved!",
              description: `Successfully reserved at ${station.name} for ${estimatedKwh} kWh`,
            })
          } catch (error) {
            console.error("[v0] Charging - Error completing payment:", error)
            toast({
              title: "Completion Failed",
              description: "Payment processed but completion failed. Contact support.",
              variant: "destructive",
            })
          }
        },
        onCancel: (paymentId: string) => {
          console.log("[v0] Charging - Payment cancelled:", paymentId)
          toast({
            title: "Payment cancelled",
            description: "You cancelled the payment.",
            variant: "destructive",
          })
        },
        onError: (error: Error, payment?: any) => {
          console.error("[v0] Charging - Payment error:", error)
          toast({
            title: "Payment failed",
            description: error.message || "Something went wrong with the payment.",
            variant: "destructive",
          })
        },
      })
    } catch (error: any) {
      console.error("[v0] Charging - Exception in handleBookCharging:", error)
      toast({
        title: "Booking failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const selectedOption = stations.find((s) => s.id === selectedStation)
  const totalCost = selectedOption ? 0.15 * estimatedKwh : 0 // Placeholder price
  const platformFee = totalCost * 0.02

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="w-6 h-6 text-green-600" />
            EV Charging Stations
          </CardTitle>
          <CardDescription className="text-slate-700">Find nearby electric vehicle charging locations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !userLocation ? (
            <Card className="p-8 text-center bg-white/95">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600">Enable location services to find nearby charging stations</p>
            </Card>
          ) : stations.length === 0 ? (
            <Card className="p-8 text-center bg-white/95">
              <Zap className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p className="text-slate-600">No charging stations found nearby</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {stations.map((station) => (
                <Card
                  key={station.id}
                  className="hover:shadow-lg transition-shadow bg-white/95 backdrop-blur-sm border-2"
                  onClick={() => {
                    console.log("[v0] Charging - Selected station:", station.name)
                    setSelectedStation(station.id)
                    toast({
                      title: "Station selected",
                      description: `${station.name} - Placeholder price π per kWh`,
                    })
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{station.name}</h3>
                        <div className="space-y-2 text-sm text-slate-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600" />
                            <span>{station.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-green-600" />
                            <span>{station.distance} mi away</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-green-600" />
                            <span>
                              {station.available} of {station.total} chargers available
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => openDirections(station)} size="sm" className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        <span className="hidden md:inline">Directions</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-2 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-slate-700">
            <strong>Note:</strong> Charging station data is provided for informational purposes. Availability and
            pricing may vary by location and provider.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
