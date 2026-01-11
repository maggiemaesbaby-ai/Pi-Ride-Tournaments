"use client"

import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/header"
import { ServiceTabs } from "@/components/service-tabs"
import { StatsBar } from "@/components/stats-bar"
import { HeroSection } from "@/components/hero-section"
import { MarketingBanner } from "@/components/marketing-banner"
import { LoadingScreen } from "@/components/loading-screen"
import { BackgroundMap } from "@/components/background-map"
import { PiBusinessesBanner } from "@/components/pi-businesses-banner"
import { Button } from "@/components/ui/button"
import { ShoppingBag } from "@/lib/icons"
import Link from "next/link"
import { RideHistoryDashboard } from "@/components/ride-history-dashboard"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { DriverAgreementModal } from "@/components/driver-agreement-modal"
import { LagosWaitlistSystem } from "@/components/lagos-waitlist-system"

export default function Home() {
  const [activeTab, setActiveTab] = useState("rides")
  const [isLoaded, setIsLoaded] = useState(false)
  const [arcadePulse, setArcadePulse] = useState(false)
  const serviceTabsRef = useRef<{ setTab: (tab: string) => void; scrollToTabs: () => void } | null>(null)
  const { user } = usePiWallet()
  const [showDriverAgreement, setShowDriverAgreement] = useState(false)
  const [driverName, setDriverName] = useState("")

  useEffect(() => {
    const checkPendingPlatformChoice = () => {
      const pendingPlatformChoice = localStorage.getItem("pending_platform_choice")

      if (pendingPlatformChoice) {
        try {
          const data = JSON.parse(pendingPlatformChoice)
          console.log("[v0] 🎯 Found pending platform choice on home page")
          console.log("[v0] Platform choice data:", data)
          console.log("[v0] GameId:", data.gameId)
          console.log("[v0] EntryId:", data.entryId)
          console.log("[v0] TierId:", data.tierId)

          if (!data.gameId) {
            console.error("[v0] ❌ No gameId in pending platform choice, clearing data")
            localStorage.removeItem("pending_platform_choice")
            return
          }

          const redirectUrl = `/arcade/tournaments/${data.gameId}`
          console.log("[v0] 🔄 Redirecting to:", redirectUrl)

          // Use window.location.replace to avoid back button issues
          window.location.replace(redirectUrl)
        } catch (error) {
          console.error("[v0] Error parsing pending platform choice:", error)
          localStorage.removeItem("pending_platform_choice")
        }
      } else {
        console.log("[v0] No pending platform choice found on home page")
      }
    }

    checkPendingPlatformChoice()
    const timeoutId1 = setTimeout(checkPendingPlatformChoice, 300)
    const timeoutId2 = setTimeout(checkPendingPlatformChoice, 800)

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
    }
  }, [])

  useEffect(() => {
    setIsLoaded(true)

    const checkActiveTournaments = setInterval(() => {
      fetch("/api/arcade/active-tournaments")
        .then((res) => res.json())
        .then((data) => {
          setArcadePulse(data.hasActiveTournaments || false)
        })
        .catch(() => setArcadePulse(false))
    }, 5000)

    return () => clearInterval(checkActiveTournaments)
  }, [])

  useEffect(() => {
    const checkDriverStatus = async () => {
      if (!user?.uid) return

      try {
        const response = await fetch(`/api/driver/check-status?piUserId=${user.uid}`)
        const data = await response.json()

        if (data.isDriver && data.needsAgreement) {
          setDriverName(data.driverName)
          setShowDriverAgreement(true)
        }
      } catch (error) {
        console.error("[v0] Failed to check driver status:", error)
      }
    }

    checkDriverStatus()
  }, [user?.uid])

  const handleServiceSelect = (service: string) => {
    if (serviceTabsRef.current) {
      serviceTabsRef.current.setTab(service)

      setTimeout(() => {
        if (serviceTabsRef.current) {
          serviceTabsRef.current.scrollToTabs()

          setTimeout(() => {
            serviceTabsRef.current?.scrollToTabs()

            setTimeout(() => {
              serviceTabsRef.current?.scrollToTabs()
            }, 200)
          }, 150)
        }
      }, 100)
    }
  }

  const handleAcceptAgreement = async () => {
    if (!user?.uid) return

    try {
      const response = await fetch("/api/driver-application/accept-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ piUserId: user.uid }),
      })

      if (response.ok) {
        setShowDriverAgreement(false)
        alert("Welcome to Pi Ride! Your driver account is now active. You can access your driver dashboard anytime.")
        // Optionally redirect to driver dashboard
        // window.location.href = "/driver-dashboard"
      } else {
        alert("Failed to accept agreement. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Failed to accept agreement:", error)
      alert("An error occurred. Please try again.")
    }
  }

  try {
    return (
      <>
        <LoadingScreen />
        <DriverAgreementModal isOpen={showDriverAgreement} driverName={driverName} onAccept={handleAcceptAgreement} />
        <div className="relative min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
          {activeTab !== "map" && (
            <div className="fixed inset-0 z-0">
              <BackgroundMap />
            </div>
          )}

          <div className="relative z-10 min-h-screen">
            <Header />
            <main className="container mx-auto px-4 py-6 max-w-7xl space-y-8">
              <HeroSection onServiceSelect={handleServiceSelect} />

              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 px-4 rounded-xl border-2 border-purple-500 max-w-4xl mx-auto">
                <div className="flex flex-col gap-3">
                  <Link href="/arcade" className="w-full">
                    <Button
                      size="lg"
                      className="w-full h-16 text-xl px-8 font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 border-2 border-cyan-300 transition-all duration-300"
                    >
                      <span className="mr-3 text-3xl flex-shrink-0">🕹️</span>
                      <span>Pi Arcade Legends</span>
                    </Button>
                  </Link>
                  <Link href="/marketplace" className="w-full">
                    <Button
                      size="lg"
                      className="w-full h-16 text-xl px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-2 border-purple-400"
                    >
                      <ShoppingBag className="w-6 h-6 mr-3 flex-shrink-0" />
                      <span>Marketplace</span>
                    </Button>
                  </Link>
                  <Link href="/collectibles-shop" className="w-full">
                    <Button
                      size="lg"
                      className="w-full h-16 text-xl px-8 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 border-2 border-amber-400"
                    >
                      <span className="mr-3 text-2xl flex-shrink-0">📚</span>
                      <span>Books, Graded, Cards & Toy Shop</span>
                    </Button>
                  </Link>
                </div>
              </div>

              <MarketingBanner />

              <LagosWaitlistSystem />

              <PiBusinessesBanner />

              <StatsBar />

              {activeTab === "rides" && user?.uid && <RideHistoryDashboard />}

              <ServiceTabs ref={serviceTabsRef} onTabChange={setActiveTab} />
            </main>
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error("[v0] Home page render error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Error</h1>
          <p className="mb-4">There was an error loading the page. Please refresh.</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    )
  }
}
