"use client"
import Script from "next/script"
import { useEffect } from "react"
import { piSDK } from "@/lib/pi-sdk"

export function PiSDKInit() {
  useEffect(() => {
    const timer = setTimeout(() => {
      piSDK.initialize()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Script
      src="https://sdk.minepi.com/pi-sdk.js"
      strategy="afterInteractive"
      onLoad={() => console.log("[v0] Pi SDK loaded")}
      onError={(e) => console.error("[v0] Pi SDK load failed:", e)}
    />
  )
}
