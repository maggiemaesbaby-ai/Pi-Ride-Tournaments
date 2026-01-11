"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UtensilsCrossed, MapPin, Users, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Badge } from "@/components/ui/badge"

export function FoodTab() {
  const [location, setLocation] = useState("")
  const [showWaitlist, setShowWaitlist] = useState(false)
  const { toast } = useToast()

  const handleJoinWaitlist = () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enter your delivery address to join the waitlist",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Added to Waitlist!",
      description: "We'll notify you when Pi food delivery launches in your area",
    })
    setShowWaitlist(false)
    setLocation("")
  }

  const handleLocationFocus = () => {
    if (!location && navigator.geolocation) {
      toast({
        title: "Use Current Location?",
        description: "Tap 'Allow' to auto-fill your delivery address",
        action: (
          <ToastAction
            altText="Allow location access"
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setLocation("Current Location")
                  toast({
                    title: "Location Enabled",
                    description: "Your current location has been set",
                  })
                },
                () => {
                  toast({
                    title: "Location Access Denied",
                    description: "Please enter your address manually",
                    variant: "destructive",
                  })
                },
              )
            }}
          >
            Allow
          </ToastAction>
        ),
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-8 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 shadow-lg text-center">
        <div className="flex justify-center mb-4">
          <UtensilsCrossed className="w-16 h-16 text-orange-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Pi Food Delivery</h2>
        <Badge className="bg-orange-600 text-white mb-4">Coming Soon</Badge>
        <p className="text-lg text-slate-700 mb-6">
          Order from Pi Ride Partners and local restaurants and pay with Pi! We're building partnerships with
          restaurants in your area.
        </p>
        <div className="space-y-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
            <input
              type="text"
              placeholder="Enter your delivery address"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={handleLocationFocus}
              className="w-full px-4 py-3 pl-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 bg-white border-slate-300 text-slate-900"
            />
          </div>
          <Button onClick={handleJoinWaitlist} size="lg" className="w-full bg-orange-600 hover:bg-orange-700">
            <Users className="w-5 h-5 mr-2" />
            Join Waitlist
          </Button>
        </div>
        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-orange-200">
          <p className="text-sm text-slate-700">
            <Clock className="w-4 h-4 inline mr-1" />
            Be among the first to order food with Pi when we launch!
          </p>
        </div>
      </Card>
    </div>
  )
}
