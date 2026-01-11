"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, ArrowRight, TrendingUp } from "@/lib/icons"
import Link from "next/link"
import { driverPromoDB } from "@/lib/driver-promo-db"

export function DriveForPiPromoBanner() {
  const [promoData, setPromoData] = useState<Array<{ name: string; slots: number; country: string }>>([])
  const [totalSlotsLeft, setTotalSlotsLeft] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pi_ride_driver_promos")
      if (stored) {
        const data = JSON.parse(stored)
        // If we have less than 20 cities, clear and reinitialize
        if (Object.keys(data).length < 20) {
          localStorage.removeItem("pi_ride_driver_promos")
        }
      }
    }

    const data = driverPromoDB.getAllPromoData()
    console.log("[v0] DriveForPiPromoBanner - Total cities loaded:", data.length)
    console.log(
      "[v0] DriveForPiPromoBanner - Cities:",
      data.map((c) => c.city),
    )

    const citiesWithSlots = data.map((city) => ({
      name: city.city,
      country: city.country,
      slots: city.totalSlots - city.usedSlots,
    }))

    setPromoData(citiesWithSlots)
    setTotalSlotsLeft(citiesWithSlots.reduce((sum, city) => sum + city.slots, 0))

    console.log(
      "[v0] DriveForPiPromoBanner - Total slots available:",
      citiesWithSlots.reduce((sum, city) => sum + city.slots, 0),
    )
  }, [])

  return (
    <Card className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-6 border-0 shadow-xl">
      <div className="flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-full animate-pulse">
          <Zap className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-2xl font-bold">Pi Ride Launching in Lagos, Nigeria!</h3>
            <Badge className="bg-white text-green-600 font-bold animate-bounce">JOIN THE WAITLIST</Badge>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-lg mb-2">Be Part of the Pioneer Ride-Sharing Revolution!</p>
                <p className="text-white/95 text-sm leading-relaxed">
                  Lagos is our first city rollout. As drivers and riders join the waitlist, we'll work to complete all
                  regulatory requirements and announce the official launch date. Early waitlist members get priority
                  access when we go live!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-white/15 to-white/5 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/30">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">👨‍✈️</span> For Drivers
                </h4>
                <ul className="space-y-1 text-sm text-white/95">
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>
                      Keep <strong>80-82%</strong> of every fare (18-20% commission)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>$150 one-time signup + $30/year license fee</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>Complete profile & verifications before launch</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>No upfront fees - pay when we launch!</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">🚗</span> For Riders
                </h4>
                <ul className="space-y-1 text-sm text-white/95">
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>Safe, verified drivers with background checks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>Pay with Pi - support the Pi Network ecosystem</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>Rate & favorite your preferred drivers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-300 font-bold">✓</span>
                    <span>Be first to book when we launch!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/drive-for-pi" className="flex-1">
              <Button size="lg" className="w-full bg-white text-green-600 hover:bg-white/90 font-bold">
                Join as Driver <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/lagos-rider-waitlist" className="flex-1">
              <Button
                size="lg"
                variant="outline"
                className="w-full bg-white/10 text-white border-white/30 hover:bg-white/20 font-bold"
              >
                Join as Rider <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <p className="text-xs text-white/80 mt-3 text-center">
            The more pioneers join, the faster we launch! Share with friends in Lagos.
          </p>
        </div>
      </div>
    </Card>
  )
}
