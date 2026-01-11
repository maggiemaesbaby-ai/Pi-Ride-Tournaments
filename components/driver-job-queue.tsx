"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { rideMatchingDB, type RideRequest, type ScheduledRide } from "@/lib/ride-matching-db"
import { MapPin, Clock, User, Navigation, Calendar, Bell } from "@/lib/icons"
import { useCurrency } from "@/contexts/currency-provider"
import { useToast } from "@/hooks/use-toast"

interface DriverJobQueueProps {
  driverId: string
  username: string
}

export function DriverJobQueue({ driverId, username }: DriverJobQueueProps) {
  const [pendingInvitations, setPendingInvitations] = useState<RideRequest[]>([])
  const [activeRides, setActiveRides] = useState<RideRequest[]>([])
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>([])
  const { formatPriceWithUSD } = useCurrency()
  const { toast } = useToast()

  useEffect(() => {
    const loadJobs = () => {
      const invites = rideMatchingDB.getDriverPendingInvitations(driverId)
      const active = rideMatchingDB.getDriverActiveRides(driverId)
      const scheduled = rideMatchingDB.getDriverScheduledRides(driverId)

      setPendingInvitations(invites)
      setActiveRides(active)
      setScheduledRides(scheduled)
    }

    loadJobs()
    const interval = setInterval(loadJobs, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [driverId])

  const handleAcceptRide = (requestId: string) => {
    const success = rideMatchingDB.acceptRide(requestId, driverId)

    if (success) {
      toast({
        title: "Ride Accepted!",
        description: "Navigate to pickup location to begin",
      })

      // Refresh lists
      setPendingInvitations(rideMatchingDB.getDriverPendingInvitations(driverId))
      setActiveRides(rideMatchingDB.getDriverActiveRides(driverId))
    } else {
      toast({
        title: "Ride Unavailable",
        description: "This ride was already accepted by another driver",
        variant: "destructive",
      })
    }
  }

  const handleIgnoreRide = (requestId: string) => {
    // Remove from pending list locally (driver chose to ignore)
    setPendingInvitations((prev) => prev.filter((r) => r.id !== requestId))
  }

  const handleUpdateStatus = (requestId: string, status: RideRequest["status"]) => {
    rideMatchingDB.updateRideStatus(requestId, status)
    setActiveRides(rideMatchingDB.getDriverActiveRides(driverId))

    if (status === "completed") {
      toast({
        title: "Ride Completed!",
        description: "Payment will be processed shortly",
      })
    }
  }

  const handleAcceptScheduledRide = (rideId: string) => {
    const success = rideMatchingDB.acceptScheduledRide(rideId, driverId)

    if (success) {
      toast({
        title: "Scheduled Ride Accepted!",
        description: "You'll receive reminders before the pickup time",
      })
      setScheduledRides(rideMatchingDB.getDriverScheduledRides(driverId))
    }
  }

  const handleOnMyWay = (rideId: string) => {
    // Update status to indicate driver is en route
    rideMatchingDB.updateRideStatus(rideId, "driver_enroute")
    setActiveRides(rideMatchingDB.getDriverActiveRides(driverId))

    toast({
      title: "Customer Notified",
      description: "Rider will receive your ETA updates",
    })
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getTimeUntil = (timestamp: number) => {
    const minutes = Math.floor((timestamp - Date.now()) / 60000)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}min`
  }

  return (
    <div className="space-y-6">
      {/* Pending Ride Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5 animate-pulse">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              New Ride Requests ({pendingInvitations.length})
            </CardTitle>
            <CardDescription>Accept rides in your service area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingInvitations.map((request) => (
              <Card key={request.id} className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span>{request.username}</span>
                          <Badge variant="outline">{request.vehicleType}</Badge>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{request.pickupAddress}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{request.destinationAddress}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatPriceWithUSD(request.estimatedPrice).pi}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatPriceWithUSD(request.estimatedPrice).usd}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => handleAcceptRide(request.id)} className="flex-1">
                        Accept Ride
                      </Button>
                      <Button variant="outline" onClick={() => handleIgnoreRide(request.id)}>
                        Ignore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Rides */}
      {activeRides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Rides</CardTitle>
            <CardDescription>Current rides in progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRides.map((request) => (
              <Card key={request.id} className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="text-sm">
                        {request.status === "accepted"
                          ? "Navigate to Pickup"
                          : request.status === "driver_enroute"
                            ? "En Route to Pickup"
                            : request.status === "arrived"
                              ? "Arrived at Pickup"
                              : request.status === "in_progress"
                                ? "Ride in Progress"
                                : request.status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{request.username}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>{request.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-red-600 mt-0.5" />
                        <span>{request.destinationAddress}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {request.status === "accepted" && (
                        <Button onClick={() => handleUpdateStatus(request.id, "driver_enroute")} className="flex-1">
                          On My Way
                        </Button>
                      )}
                      {request.status === "driver_enroute" && (
                        <Button onClick={() => handleUpdateStatus(request.id, "arrived")} className="flex-1">
                          Arrived at Pickup
                        </Button>
                      )}
                      {request.status === "arrived" && (
                        <Button onClick={() => handleUpdateStatus(request.id, "in_progress")} className="flex-1">
                          Start Ride
                        </Button>
                      )}
                      {request.status === "in_progress" && (
                        <Button
                          onClick={() => handleUpdateStatus(request.id, "completed")}
                          className="flex-1"
                          variant="default"
                        >
                          Complete Ride
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this ride?")) {
                            rideMatchingDB.cancelRide(request.id, "driver")
                            setActiveRides(rideMatchingDB.getDriverActiveRides(driverId))
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scheduled Rides */}
      {scheduledRides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Scheduled Rides
            </CardTitle>
            <CardDescription>Your upcoming scheduled pickups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {scheduledRides.map((ride) => (
              <Card key={ride.id} className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(ride.scheduledFor)}
                        </Badge>
                        <div className="text-sm text-muted-foreground">In {getTimeUntil(ride.scheduledFor)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {formatPriceWithUSD(ride.estimatedPrice).pi}
                        </div>
                        <Badge variant="secondary" className="mt-1">
                          Prepaid
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{ride.username}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                        <span>{ride.pickupAddress}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-red-600 mt-0.5" />
                        <span>{ride.destinationAddress}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleOnMyWay(ride.id)}
                      className="w-full"
                      disabled={ride.scheduledFor - Date.now() > 30 * 60 * 1000} // Can only start 30 min before
                    >
                      {ride.scheduledFor - Date.now() > 30 * 60 * 1000
                        ? `Ready in ${getTimeUntil(ride.scheduledFor)}`
                        : "On My Way"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Jobs Available */}
      {pendingInvitations.length === 0 && activeRides.length === 0 && scheduledRides.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="text-muted-foreground mb-2">No ride requests at the moment</div>
            <p className="text-sm text-muted-foreground">
              You'll be notified when riders in your service area request rides
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
