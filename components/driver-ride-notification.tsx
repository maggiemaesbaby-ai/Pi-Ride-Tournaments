"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Clock, Navigation } from "@/lib/icons"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface DriverRideNotificationProps {
  ride: any
  driverId: string
  onAccepted: () => void
}

export function DriverRideNotification({ ride, driverId, onAccepted }: DriverRideNotificationProps) {
  const [accepting, setAccepting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(90)
  const { toast } = useToast()

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const createdAt = new Date(ride.created_at).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - createdAt) / 1000)
      const remaining = Math.max(0, 90 - elapsed)
      setTimeRemaining(remaining)
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [ride.created_at])

  useEffect(() => {
    const audio = new Audio("/notification-bell.mp3")
    audio.play().catch((e) => console.log("[v0] Could not play notification sound:", e))
  }, [])

  const handleAccept = async () => {
    setAccepting(true)
    try {
      const response = await fetch("/api/rides/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: ride.id,
          driverId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept ride")
      }

      toast({
        title: "Ride Accepted!",
        description: "Rider has been notified. Continue to pickup location.",
      })

      onAccepted()
    } catch (error: any) {
      toast({
        title: "Could Not Accept Ride",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
    }
  }

  const calculateDriverEarnings = () => {
    // Default to 5% commission (standard tier) if not specified
    // Drivers with upfront fee paid have 3% commission
    const commissionRate = ride.driver_commission_rate || 0.05
    return (ride.price_pi * (1 - commissionRate)).toFixed(2)
  }

  if (timeRemaining === 0) {
    return null // Don't show expired rides
  }

  return (
    <Card className="border-green-500/50 bg-green-500/5 animate-pulse shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-green-600" />
            New Ride Request
          </span>
          <Badge variant="secondary" className="bg-green-600 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {timeRemaining}s
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Locations */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-green-600 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="text-sm font-medium">{ride.pickup_location?.address || "Loading..."}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-red-600 mt-1" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Dropoff</p>
              <p className="text-sm font-medium">{ride.dropoff_location?.address || "Loading..."}</p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-background rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Payment</span>
            <span className="font-semibold">{ride.price_pi}π</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Your Earnings</span>
            <span className="text-lg font-bold text-green-600">
              <DollarSign className="w-4 h-4 inline" />
              {calculateDriverEarnings()}π
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            After app fees ({((ride.driver_commission_rate || 0.05) * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Trip Details */}
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Distance</p>
            <p className="font-medium">{ride.distance_km?.toFixed(1) || "N/A"} km</p>
          </div>
          <div>
            <p className="text-muted-foreground">Est. Time</p>
            <p className="font-medium">{ride.duration_minutes || "N/A"} min</p>
          </div>
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium capitalize">{ride.ride_type || "standard"}</p>
          </div>
        </div>

        {/* Accept Button */}
        <Button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {accepting ? "Accepting..." : "Accept Ride"}
        </Button>
      </CardContent>
    </Card>
  )
}
