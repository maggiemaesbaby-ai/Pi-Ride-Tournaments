"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Fuel, MapPin, Navigation, TrendingDown, TrendingUp } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

interface GasStation {
  id: string
  name: string
  address: string
  distance: number
  prices: {
    regular: number
    midGrade?: number
    premium: number
    diesel?: number
  }
  lastUpdated: string
  lat: number
  lng: number
}

export function GasTab() {
  const [stations, setStations] = useState<GasStation[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance")

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          fetchNearbyStations(position.coords.latitude, position.coords.longitude)
        },
        () => {
          const defaultLocation = { lat: 37.7749, lng: -122.4194 }
          setUserLocation(defaultLocation)
          fetchNearbyStations(defaultLocation.lat, defaultLocation.lng)
        },
      )
    }
  }, [])

  const fetchNearbyStations = async (lat: number, lng: number) => {
    setLoading(true)

    // Demo data - replace with real API call when GasBuddy API is integrated
    setTimeout(() => {
      const demoStations: GasStation[] = [
        {
          id: "1",
          name: "Shell",
          address: "123 Main St",
          distance: 0.5,
          prices: { regular: 3.89, midGrade: 4.19, premium: 4.49, diesel: 4.29 },
          lastUpdated: "5 mins ago",
          lat: lat + 0.005,
          lng: lng + 0.005,
        },
        {
          id: "2",
          name: "Chevron",
          address: "456 Oak Ave",
          distance: 0.8,
          prices: { regular: 3.79, premium: 4.39, diesel: 4.19 },
          lastUpdated: "12 mins ago",
          lat: lat - 0.007,
          lng: lng + 0.008,
        },
        {
          id: "3",
          name: "BP",
          address: "789 Elm Dr",
          distance: 1.2,
          prices: { regular: 3.99, midGrade: 4.29, premium: 4.59 },
          lastUpdated: "20 mins ago",
          lat: lat + 0.01,
          lng: lng - 0.009,
        },
        {
          id: "4",
          name: "Exxon",
          address: "321 Pine Rd",
          distance: 1.5,
          prices: { regular: 3.85, premium: 4.45, diesel: 4.25 },
          lastUpdated: "8 mins ago",
          lat: lat - 0.012,
          lng: lng - 0.006,
        },
        {
          id: "5",
          name: "76",
          address: "654 Maple Blvd",
          distance: 1.8,
          prices: { regular: 3.95, midGrade: 4.25, premium: 4.55, diesel: 4.35 },
          lastUpdated: "15 mins ago",
          lat: lat + 0.015,
          lng: lng + 0.012,
        },
      ]
      setStations(demoStations)
      setLoading(false)
    }, 1000)
  }

  const sortedStations = [...stations].sort((a, b) => {
    if (sortBy === "distance") {
      return a.distance - b.distance
    }
    return a.prices.regular - b.prices.regular
  })

  const openDirections = (station: GasStation) => {
    toast({
      title: "Directions Coming Soon",
      description: "In-app navigation to gas stations will be available after Pi Network approval",
    })
  }

  const lowestPrice = stations.length > 0 ? Math.min(...stations.map((s) => s.prices.regular)) : 0
  const highestPrice = stations.length > 0 ? Math.max(...stations.map((s) => s.prices.regular)) : 0

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Fuel className="w-6 h-6 text-orange-600" />
                Nearby Gas Stations
              </CardTitle>
              <CardDescription className="text-slate-700">Find the best gas prices near you</CardDescription>
            </div>
            {stations.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-sm text-green-700">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-semibold">${lowestPrice.toFixed(2)}</span>
                  <span className="text-slate-600">lowest</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-red-700">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">${highestPrice.toFixed(2)}</span>
                  <span className="text-slate-600">highest</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={sortBy === "distance" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("distance")}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Nearest
            </Button>
            <Button
              variant={sortBy === "price" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("price")}
              className="flex items-center gap-2"
            >
              <TrendingDown className="w-4 h-4" />
              Cheapest
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedStations.map((station) => (
                <Card
                  key={station.id}
                  className="hover:shadow-lg transition-shadow bg-white/95 backdrop-blur-sm border-2"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{station.name}</h3>
                          {station.prices.regular === lowestPrice && <Badge className="bg-green-500">Best Price</Badge>}
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{station.address}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Regular</span>
                            <span className="text-lg font-bold text-slate-900">
                              ${station.prices.regular.toFixed(2)}
                            </span>
                          </div>
                          {station.prices.midGrade && (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500">Mid-Grade</span>
                              <span className="text-lg font-bold text-slate-900">
                                ${station.prices.midGrade.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">Premium</span>
                            <span className="text-lg font-bold text-slate-900">
                              ${station.prices.premium.toFixed(2)}
                            </span>
                          </div>
                          {station.prices.diesel && (
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500">Diesel</span>
                              <span className="text-lg font-bold text-slate-900">
                                ${station.prices.diesel.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {station.distance.toFixed(1)} mi away
                          </span>
                          <span>Updated {station.lastUpdated}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => openDirections(station)}
                        size="sm"
                        className="ml-4 flex items-center gap-2"
                      >
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
            <strong>Note:</strong> Gas prices are updated by the community. Prices shown are approximate and may vary.
            Always verify prices at the pump.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
