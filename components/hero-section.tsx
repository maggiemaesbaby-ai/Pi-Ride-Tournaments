"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "@/lib/icons"

interface HeroSectionProps {
  onServiceSelect?: (service: string) => void
}

export function HeroSection({ onServiceSelect }: HeroSectionProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const { connect, isConnected } = usePiWallet()

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // Default to a sample location if permission denied
          setUserLocation({ lat: 37.7749, lng: -122.4194 })
        },
      )
    }
  }, [])

  const handleConnectWallet = async () => {
    await connect()
    // After connecting, scroll to services section
    const servicesSection = document.getElementById("services-section")
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleServiceSelect = (service: string) => {
    if (service === "arcade") {
      window.location.href = "/arcade"
      return
    }
    if (service === "marketplace") {
      window.location.href = "/marketplace"
      return
    }
    if (onServiceSelect) {
      onServiceSelect(service)
    }
  }

  return (
    <div className="relative min-h-[500px] md:min-h-[600px] overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 via-purple-600 to-pink-600 bg-[length:300%_100%] animate-[gradient_8s_ease-in-out_infinite] border border-white/10 shadow-xl">
      {/* Floating Greek Pi Symbol Clouds */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {/* Large organic cloud - top left */}
        <div className="absolute -top-24 -left-28 w-72 h-56 blur-3xl bg-white/60 rounded-[60%_40%_30%_70%/60%_30%_70%_40%]" />
        <div className="absolute -top-16 -left-12 w-48 h-64 blur-3xl bg-white/55 rounded-[40%_60%_70%_30%/50%_60%_40%_50%]" />
        <svg className="absolute top-12 left-16 w-44 h-44 text-white/70" viewBox="0 0 100 100" fill="currentColor">
          <text x="20" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>

        {/* Wispy cloud - top right */}
        <div className="absolute -top-20 right-8 w-64 h-40 blur-2xl bg-white/50 rounded-[70%_30%_50%_50%/40%_50%_50%_60%]" />
        <div className="absolute top-4 right-32 w-36 h-48 blur-3xl bg-white/45 rounded-[30%_70%_60%_40%/70%_30%_40%_60%]" />
        <svg
          className="absolute top-20 right-40 w-32 h-32 text-white/65 rotate-12"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <text x="15" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>

        {/* Puffy cloud - center right */}
        <div className="absolute top-1/3 -right-20 w-60 h-52 blur-3xl bg-white/60 rounded-[50%_50%_40%_60%/60%_40%_60%_40%]" />
        <div className="absolute top-1/3 right-8 w-44 h-56 blur-3xl bg-white/55 rounded-[60%_40%_50%_50%/50%_50%_50%_50%]" />
        <svg
          className="absolute top-1/3 right-12 w-36 h-36 text-white/60 -rotate-6"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <text x="18" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>

        {/* Small fluffy cloud - bottom left */}
        <div className="absolute bottom-12 left-24 w-48 h-44 blur-2xl bg-white/52 rounded-[40%_60%_60%_40%/50%_50%_50%_50%]" />
        <div className="absolute bottom-20 left-40 w-32 h-36 blur-2xl bg-white/48 rounded-[60%_40%_50%_50%/40%_60%_60%_40%]" />
        <svg
          className="absolute bottom-28 left-44 w-28 h-28 text-white/58 rotate-[15deg]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <text x="15" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>

        {/* Large drifting cloud - bottom center */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-80 h-48 blur-3xl bg-white/55 rounded-[50%_50%_70%_30%/60%_40%_50%_50%]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/3 w-56 h-56 blur-3xl bg-white/50 rounded-[30%_70%_40%_60%/50%_50%_60%_40%]" />
        <svg
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-32 h-32 text-white/52 -rotate-3"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <text x="15" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>

        {/* Extra scattered organic clouds */}
        <div className="absolute top-1/4 left-1/4 w-36 h-32 blur-2xl bg-white/45 rounded-[55%_45%_60%_40%/45%_55%_45%_55%]" />
        <svg
          className="absolute top-1/4 left-1/4 w-24 h-24 text-white/48 rotate-[20deg]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <text x="15" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>

        <div className="absolute bottom-1/3 right-1/4 w-40 h-36 blur-2xl bg-white/42 rounded-[45%_55%_50%_50%/55%_45%_55%_45%]" />
        <svg
          className="absolute bottom-1/3 right-1/4 w-20 h-20 text-white/45 -rotate-[12deg]"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <text x="10" y="75" fontFamily="serif" fontSize="80" fontWeight="bold">
            π
          </text>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[500px] md:min-h-[600px] px-6 text-center">
        <p className="text-xs text-muted-foreground/50 mb-2">
          Impact-Site-Verification: a52738d3-8914-4c63-a97c-48de5677985d
        </p>

        {/* Main Tagline */}
        <div className="w-full space-y-6 flex flex-col items-center">
          <h1 className="text-6xl md:text-7xl font-bold text-balance text-center w-full">
            <span className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Traveling Made Easy
            </span>
            <br />
            <span className="text-foreground">All in Pi</span>
          </h1>

          {/* Subtitle */}
          <p className="text-4xl md:text-5xl font-bold text-balance w-full text-center">
            <span className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 bg-clip-text text-transparent animate-gradient">
              Ride Shop and Play All With Pi Ride
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            {!isConnected && (
              <Button size="lg" onClick={handleConnectWallet} className="gap-2 text-lg px-8 py-6">
                Connect Wallet - Get Started with Pi
              </Button>
            )}

            {/* Explore Services dropdown with Vehicles replacing Cruises */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-lg px-8 py-6 bg-white text-black hover:bg-gray-100 border-2"
                >
                  Explore Services
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem onClick={() => handleServiceSelect("rides")}>🚗 Rides</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("food")}>🍔 Food Delivery</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("arcade")}>🎮 Pi Arcade Legends</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("marketplace")}>🛍️ Marketplace</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("packages")}>📦 Package Delivery</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("vehicles")}>🚙 Vehicles</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("accommodation")}>
                  🏨 Accommodations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("rentals")}>🚲 Rentals</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("charging")}>⚡ EV Charging</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("gas")}>⛽ Gas Stations</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleServiceSelect("transit")}>🚌 Transit Passes</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Drive for Pi banner */}
          <Card className="max-w-2xl mx-auto mt-8 bg-gradient-to-r from-primary/10 via-purple-500/10 to-secondary/10 border-2 border-primary/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="text-left flex-1">
                  <h3 className="text-2xl font-bold text-primary mb-2">Drive for Pi Ride</h3>
                  <p className="text-black mb-3">Earn up to 27% more than Uber/Lyft. Only 3% commission!</p>
                  <div className="flex items-center gap-2 text-sm text-black">
                    <span>$100 in Pi one-time fee</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8"
                  onClick={() => (window.location.href = "/drive-for-pi")}
                >
                  Get Started Now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Secure Pi Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Real-time Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
