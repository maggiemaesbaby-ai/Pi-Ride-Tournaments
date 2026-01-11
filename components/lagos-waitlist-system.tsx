"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Users, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

export function LagosWaitlistSystem() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-green-400 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 p-1">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-950/90 to-teal-950/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative z-10 p-8 md:p-12">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-300 border border-green-400/50">
                <MapPin className="h-4 w-4" />
                <span>First Launch City</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white">
                Pi Ride Coming to{" "}
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                  Lagos, Nigeria! 🇳🇬
                </span>
              </h2>

              <p className="text-xl text-green-100 max-w-3xl mx-auto">
                Join the waitlist today! The more drivers and riders who sign up, the faster we launch in your city.
              </p>
            </div>

            {/* Two Column Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Driver Waitlist Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-green-400/30 hover:bg-white/15 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-green-400" />
                    Driver Waitlist
                  </CardTitle>
                  <CardDescription className="text-green-200">
                    Earn 80-82% of every ride fare you complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-green-100">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Complete your profile now, pay fees only after launch announcement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Upload documents: Hackney permit, LASDRI cert, insurance, VIS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Choose: $150 upfront (18% fee) or no upfront (20% fee)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Must be 21+ years old with comprehensive insurance</span>
                    </li>
                  </ul>

                  <Link href="/lagos-driver-application" className="block">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold"
                    >
                      Join Driver Waitlist
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Rider Waitlist Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-green-400/30 hover:bg-white/15 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <Users className="h-6 w-6 text-emerald-400" />
                    Rider Waitlist
                  </CardTitle>
                  <CardDescription className="text-green-200">
                    Get safe, affordable rides paid entirely in Pi
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3 text-green-100">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Be first to ride when we launch in Lagos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Pay with Pi - no cash or cards needed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Verified drivers with background checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>Track your ride in real-time for safety</span>
                    </li>
                  </ul>

                  <Link href="/lagos-rider-waitlist" className="block">
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
                    >
                      Join Rider Waitlist
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Info Banner */}
            <div className="text-center p-6 rounded-xl bg-green-500/10 border border-green-400/30">
              <p className="text-lg text-green-100 font-medium">
                💚 The more people who join the waitlist, the faster we can launch in Lagos! 💚
              </p>
              <p className="text-sm text-green-200 mt-2">
                As our waitlist grows, we'll notify everyone when we're ready to begin operations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
