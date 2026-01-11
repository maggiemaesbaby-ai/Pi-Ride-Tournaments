"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { driverDB, RideRequest } from "@/lib/driver-db"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { MapPin, Clock, DollarSign, AlertCircle, CheckCircle2, Bell } from '@/lib/icons'
import { Navigation } from 'lucide-react'
import { useCurrency } from "@/contexts/currency-provider"

export function RealTimeRideMatching() {
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([])
  const [acceptedRequest, setAcceptedRequest] = useState<RideRequest | null>(null)
  const { user } = usePiWallet()
  const { toast } = useToast()
  const { formatPriceWithUSD } = useCurrency()

  // Poll for new ride requests every 3 seconds when driver is online
  useEffect(() => {
    if (!user?.username) return

    const driver = driverDB.getDriverByPiUsername(user.username)
    if (!driver || !driver.isOnline) return

    const interval = setInterval(() => {
      const requests = driverDB.getPendingRequestsForDriver(driver.id)
      
      if (requests.length > pendingRequests.length) {
        // New ride request available
        toast({
          title: "🚗 New Ride Request!",
          description: "A rider is looking for a driver nearby",
        })
        
        // Play notification sound (if browser supports it)
        if (typeof Audio !== 'undefined') {
          try {
            const audio = new Audio('/notification.mp3')
            audio.play().catch(() => {}) // Ignore errors
          } catch (e) {}
        }
      }
      
      setPendingRequests(requests)
    }, 3000)

    return () => clearInterval(interval)
  }, [user, pendingRequests.length])

  const handleAcceptRide = (requestId: string) => {
    if (!user?.username) return

    const driver = driverDB.getDriverByPiUsername(user.username)
    if (!driver) return

    // Check if driver has paid fee (if not free signup)
    if (!driver.isFreeSignup && driver.feeStatus === 'pending' && driver.completedRides === 0) {
      toast({
        title: "Payment Required",
        description: "You must pay the 100π one-time fee to accept your first ride",
        variant: "destructive"
      })
      // In production, trigger Pi payment here
      return
    }

    const success = driverDB.acceptRideRequest(requestId, driver.id)
    
    if (success) {
      const request = driverDB.getRideRequest(requestId)
      setAcceptedRequest(request)
      setPendingRequests([])
      
      toast({
        title: "Ride Accepted! 🎉",
        description: "Navigate to the pickup location",
      })
    } else {
      toast({
        title: "Ride Unavailable",
        description: "Another driver already accepted this ride",
        variant: "destructive"
      })
    }
  }

  const handleCompleteRide = () => {
    if (!acceptedRequest) return

    // In production, this would be triggered after navigation/delivery
    const rating = 5 // Mock rating - would come from user
    driverDB.completeRide(acceptedRequest.id, rating)
    
    toast({
      title: "Ride Completed! ✨",
      description: `You earned ${formatPriceWithUSD(acceptedRequest.estimatedPrice).pi}`,
    })
    
    setAcceptedRequest(null)
  }

  if (acceptedRequest) {
    return (
      <Card className="mb-6 border-2 border-green-500 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Active Ride
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Pickup</p>
                <p className="font-semibold">{acceptedRequest.pickup}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Navigation className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Destination</p>
                <p className="font-semibold">{acceptedRequest.destination}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Earnings</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPriceWithUSD(acceptedRequest.estimatedPrice).pi}
                </p>
              </div>
              <Button onClick={handleCompleteRide} size="lg">
                Complete Ride
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (pendingRequests.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="py-12 text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Waiting for Ride Requests</h3>
          <p className="text-muted-foreground">
            Make sure you're online to receive notifications when riders are nearby
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold">Incoming Ride Requests</h3>
        <Badge className="bg-red-500">{pendingRequests.length}</Badge>
      </div>

      {pendingRequests.map((request) => (
        <Card key={request.id} className="border-2 border-primary bg-primary/5 animate-pulse-subtle">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pickup</p>
                    <p className="font-semibold">{request.pickup}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Navigation className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Destination</p>
                    <p className="font-semibold">{request.destination}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="outline">
                    {request.vehicleType}
                  </Badge>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {Math.floor((Date.now() - request.requestedAt) / 1000)}s ago
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">You'll Earn</p>
                <p className="text-2xl font-bold text-primary mb-3">
                  {formatPriceWithUSD(request.estimatedPrice).pi}
                </p>
                <Button 
                  onClick={() => handleAcceptRide(request.id)}
                  className="w-full"
                  size="lg"
                >
                  Accept Ride
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className="text-xs text-yellow-600 font-medium">
                First driver to accept gets the ride!
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
