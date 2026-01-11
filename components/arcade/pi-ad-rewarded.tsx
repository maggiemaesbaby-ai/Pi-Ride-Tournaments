"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface PiAdRewardedProps {
  onRewardGranted: (reward: string) => void
  rewardDescription: string
  trigger: React.ReactNode
}

export function PiAdRewarded({ onRewardGranted, rewardDescription, trigger }: PiAdRewardedProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const showRewardedAd = async () => {
    setIsLoading(true)

    try {
      // Check if Pi SDK is available
      if (typeof window === "undefined" || !window.Pi) {
        toast({
          title: "Ads Not Available",
          description: "Please update your Pi Browser to watch rewarded ads.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if ad network is supported
      const nativeFeatures = await window.Pi.nativeFeaturesList()
      if (!nativeFeatures.includes("ad_network")) {
        toast({
          title: "Update Required",
          description: "Please update your Pi Browser to access rewarded ads.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Check if ad is ready
      const isAdReadyResponse = await window.Pi.Ads.isAdReady("rewarded")

      if (!isAdReadyResponse.ready) {
        // Try to load the ad
        const requestAdResponse = await window.Pi.Ads.requestAd("rewarded")

        if (requestAdResponse.result === "ADS_NOT_SUPPORTED") {
          toast({
            title: "Ads Not Supported",
            description: "Please update your Pi Browser to watch rewarded ads.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        if (requestAdResponse.result !== "AD_LOADED") {
          toast({
            title: "Ad Unavailable",
            description: "Ads are temporarily unavailable. Please try again later.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Show the rewarded ad
      const showAdResponse = await window.Pi.Ads.showAd("rewarded")

      if (showAdResponse.result === "AD_REWARDED") {
        // Verify with backend before granting reward
        const response = await fetch("/api/arcade/verify-rewarded-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adId: showAdResponse.adId }),
        })

        const result = await response.json()

        if (result.rewarded === true) {
          onRewardGranted(result.reward)
          toast({
            title: "Reward Granted!",
            description: `You received: ${result.reward}`,
          })
        } else {
          toast({
            title: "Reward Failed",
            description: result.error || "Unable to verify ad. Please try again.",
            variant: "destructive",
          })
        }
      } else if (showAdResponse.result === "AD_CANCELLED") {
        toast({
          title: "Ad Cancelled",
          description: "You must watch the full ad to receive your reward.",
        })
      } else {
        toast({
          title: "Error",
          description: "An error occurred while displaying the ad.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Rewarded ad error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div onClick={showRewardedAd} className={isLoading ? "opacity-50 pointer-events-none" : ""}>
      {trigger}
    </div>
  )
}
