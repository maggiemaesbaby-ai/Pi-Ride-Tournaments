"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History, MapPin, Navigation, RefreshCw } from 'lucide-react'
import { getRecentTrips, RecentTrip } from "@/lib/saved-locations"
import { useCurrency } from "@/contexts/currency-provider"

interface RecentTripsProps {
  userId: string
  onRebook: (trip: RecentTrip) => void
}

export function RecentTrips({ userId, onRebook }: RecentTripsProps) {
  const [trips, setTrips] = useState<RecentTrip[]>([])
  const { formatPriceWithUSD } = useCurrency()

  useEffect(() => {
    if (userId) {
      setTrips(getRecentTrips(userId))
    }
  }, [userId])

  if (trips.length === 0) return null

  return (
    <Card className="p-6 bg-white/95 backdrop-blur-md border-2 border-slate-300 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">Recent Trips</h3>
        <Badge variant="secondary" className="ml-auto">{trips.length}</Badge>
      </div>

      <div className="space-y-3">
        {trips.slice(0, 5).map((trip) => (
          <Card
            key={trip.id}
            className="p-4 bg-slate-50 border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            onClick={() => onRebook(trip)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="font-medium">{trip.pickup}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Navigation className="w-3 h-3" />
                  <span className="font-medium">{trip.destination}</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="font-bold text-primary text-sm">{formatPriceWithUSD(trip.price).pi}</div>
                <div className="text-xs text-slate-600">{formatPriceWithUSD(trip.price).usd}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{trip.rideType} • {trip.service}</span>
              <Button size="sm" variant="ghost" className="h-7 px-2">
                <RefreshCw className="w-3 h-3 mr-1" />
                Book Again
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}
