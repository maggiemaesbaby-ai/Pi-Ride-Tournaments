"use client"

import { useState, useEffect } from "react"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Ride {
  id: string
  pickup: string
  destination: string
  price: number
  status: string
  createdAt: string
  rideType: string
  rating?: number
}

export function RideHistoryDashboard() {
  const { user } = usePiWallet()
  const [rides, setRides] = useState<Ride[]>([])
  const [filter, setFilter] = useState<"recent" | "month" | "all">("recent")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchRides = async () => {
      try {
        const response = await fetch(`/api/rides/history?userId=${user.uid}&filter=${filter}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setRides(data.rides || [])
      } catch (error) {
        console.error("[v0] Failed to fetch ride history:", error)
        setRides([])
      } finally {
        setLoading(false)
      }
    }

    fetchRides()
  }, [user, filter])

  if (!user) return null

  const demoCount = rides.filter((r) => r.rideType === "demo").length
  const regularCount = rides.filter((r) => r.rideType !== "demo").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ride History</h2>
        <div className="flex gap-2">
          <Button variant={filter === "recent" ? "default" : "outline"} size="sm" onClick={() => setFilter("recent")}>
            Last 5
          </Button>
          <Button variant={filter === "month" ? "default" : "outline"} size="sm" onClick={() => setFilter("month")}>
            This Month
          </Button>
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Demo Rides</div>
          <div className="text-3xl font-bold">{demoCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Regular Rides</div>
          <div className="text-3xl font-bold">{regularCount}</div>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading rides...</div>
      ) : rides.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No rides yet</div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <Card key={ride.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{ride.pickup}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-semibold">{ride.destination}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(ride.createdAt).toLocaleDateString()} at {new Date(ride.createdAt).toLocaleTimeString()}
                  </div>
                  {ride.rating && <div className="text-sm mt-1">Rating: {"⭐".repeat(ride.rating)}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold">{ride.price.toFixed(2)}π</div>
                  <Badge variant={ride.rideType === "demo" ? "secondary" : "default"}>
                    {ride.rideType === "demo" ? "Demo" : ride.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
