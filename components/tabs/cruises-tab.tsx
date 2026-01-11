"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ship, Calendar, Users, MapPin, ArrowRight, Clock } from 'lucide-react'
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useCurrency } from "@/contexts/currency-provider"
import { toast } from "@/components/ui/use-toast"

interface CruiseLine {
  id: string
  name: string
  logo: string
  website: string
  description: string
  destinations: string[]
  priceRange: string
  piPrice: number
}

const cruiseLines: CruiseLine[] = [
  {
    id: "carnival",
    name: "Carnival Cruise Line",
    logo: "/carnival-cruise-line-logo.jpg",
    website: "", // Removed external link
    description: "Fun Ships for everyone with exciting destinations and entertainment",
    destinations: ["Caribbean", "Mexico", "Alaska", "Europe", "Hawaii"],
    priceRange: "$299 - $1,999 per person",
    piPrice: 1350,
  },
  {
    id: "royal-caribbean",
    name: "Royal Caribbean",
    logo: "/royal-caribbean-logo.png",
    website: "", // Removed external link
    description: "Innovative ships with world-class entertainment and amenities",
    destinations: ["Caribbean", "Mediterranean", "Alaska", "Asia", "Australia"],
    priceRange: "$399 - $2,999 per person",
    piPrice: 1800,
  },
  {
    id: "norwegian",
    name: "Norwegian Cruise Line",
    logo: "/norwegian-cruise-line-logo.jpg",
    website: "", // Removed external link
    description: "Freestyle cruising with flexible dining and entertainment options",
    destinations: ["Caribbean", "Europe", "Alaska", "Bermuda", "South America"],
    priceRange: "$349 - $2,499 per person",
    piPrice: 1575,
  },
]

export function CruisesTab() {
  const { isConnected } = usePiWallet()
  const { piPrice } = useCurrency()

  const handleBookCruise = (cruise: CruiseLine) => {
    toast({
      title: "Feature Coming Soon",
      description: "Cruise booking will be available after Pi Network approval. All bookings will be processed within the Pi ecosystem.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Ship className="w-8 h-8 text-cyan-500" />
          Dream Cruise Booking Coming Soon
        </h2>
        <p className="text-muted-foreground">Book cruises with Pi cryptocurrency - Available after Pi Network approval</p>
      </div>

      {/* Info Card */}
      <Card className="p-8 space-y-6 bg-gradient-to-br from-card to-muted/30">
        <div className="flex items-center justify-center gap-3">
          <Ship className="w-12 h-12 text-cyan-500" />
          <h3 className="text-2xl font-bold">Cruise Booking Feature</h3>
        </div>

        <div className="space-y-4 p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <h4 className="font-bold text-lg flex items-center gap-2 justify-center">
            <Clock className="w-5 h-5 text-cyan-500" />
            Coming After Pi Network Approval
          </h4>
          <div className="space-y-3 text-sm text-center text-muted-foreground">
            <p>Book cruises with top cruise lines including Carnival, Royal Caribbean, and Norwegian</p>
            <p>Pay with Pi cryptocurrency</p>
            <p>All bookings processed within the Pi ecosystem</p>
            <p>Exclusive Pi Pioneer deals and rewards</p>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-6 pt-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-500" />
            Why Book Cruises with Pi?
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
              <span>Pay with Pi cryptocurrency for any cruise</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
              <span>Access to all cruise lines and destinations</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
              <span>Seamless Pi-to-USD conversion</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2" />
              <span>Same prices as booking directly</span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Coming Soon
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Direct cruise search and booking in Pi Ride</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Compare prices across all cruise lines</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Real-time cabin availability</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              <span>Exclusive Pi user cruise deals</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
