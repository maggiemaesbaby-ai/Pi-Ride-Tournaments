"use client"

import { useEffect, useState } from "react"
import { usePiWallet } from "@/hooks/use-pi-wallet"

interface PiAdInterstitialProps {
  trigger: "daily-checkin" | "tournament-complete" | "free-play-ad"
  onClose: () => void
}

export function PiAdInterstitial({ trigger, onClose }: PiAdInterstitialProps) {
  const { user } = usePiWallet()
  const [adShown, setAdShown] = useState(false)

  useEffect(() => {
    const showAd = async () => {
      if (typeof window === "undefined" || adShown) return

      const Pi = (window as any).Pi
      if (!Pi) {
        console.log("[v0] Pi SDK not available for ads")
        onClose()
        return
      }

      // Ads can still show in PWA mode if Pi SDK is available
      if (trigger === "free-play-ad") {
        console.log("[v0] Free play ad - Pi SDK available, showing ad")
      } else if (!user) {
        console.log("[v0] User not connected, skipping ad")
        onClose()
        return
      }

      try {
        console.log("[v0] Showing Pi interstitial ad for:", trigger)

        // Show interstitial ad
        await Pi.Ads.requestInterstitial({
          onAdShown: () => {
            console.log("[v0] Ad shown successfully")
            setAdShown(true)
          },
          onAdClosed: () => {
            console.log("[v0] Ad closed")
            onClose()
          },
          onAdError: (error: any) => {
            console.error("[v0] Ad error:", error)
            onClose()
          },
        })
      } catch (error) {
        console.error("[v0] Failed to show ad:", error)
        onClose()
      }
    }

    showAd()
  }, [user, trigger, adShown, onClose])

  return null // Ad is shown by Pi SDK, no UI needed
}
