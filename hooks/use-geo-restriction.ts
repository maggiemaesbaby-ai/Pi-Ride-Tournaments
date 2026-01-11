"use client"

import { useState, useEffect } from "react"
import { verifyLocation, type GeoRestriction } from "@/lib/geo-blocking"

export function useGeoRestriction() {
  const [restriction, setRestriction] = useState<GeoRestriction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    verifyUserLocation()
  }, [])

  const verifyUserLocation = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await verifyLocation()
      setRestriction(result)
    } catch (err) {
      console.error("[GEO HOOK] Verification failed:", err)
      setError("Failed to verify location")
      // Set as restricted by default on error
      setRestriction({
        isRestricted: true,
        allowFreePlay: true,
        restrictionReason: "Unable to verify location",
        location: { country: "Unknown", countryCode: "XX" },
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    restriction,
    loading,
    error,
    isRestricted: restriction?.isRestricted ?? false,
    allowFreePlay: restriction?.allowFreePlay ?? true,
    refresh: verifyUserLocation,
  }
}
