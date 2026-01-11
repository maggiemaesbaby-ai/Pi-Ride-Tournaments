"use client"

import { useEffect, useState } from "react"

export function usePWADetection() {
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    const isPWAParam = new URLSearchParams(window.location.search).get("pwa") === "true"

    setIsPWA(isStandalone || isPWAParam)
  }, [])

  return { isPWA }
}
