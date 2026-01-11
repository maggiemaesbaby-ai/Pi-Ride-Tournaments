import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all drivers
    const { data: drivers, error: driversError } = await supabase.from("drivers").select("service_cities, is_on_duty")

    if (driversError) {
      console.error("[v0] Failed to fetch drivers:", driversError)
      throw new Error("Failed to fetch drivers")
    }

    // Get waitlist
    const { data: waitlist, error: waitlistError } = await supabase.from("driver_waitlist").select("city")

    if (waitlistError) {
      console.error("[v0] Failed to fetch waitlist:", waitlistError)
      throw new Error("Failed to fetch waitlist")
    }

    // Aggregate stats by city
    const cityMap = new Map<
      string,
      {
        onDutyDrivers: number
        totalDrivers: number
        waitlistCount: number
      }
    >()

    // Process drivers
    drivers?.forEach((driver) => {
      driver.service_cities.forEach((city: string) => {
        const stats = cityMap.get(city) || { onDutyDrivers: 0, totalDrivers: 0, waitlistCount: 0 }
        stats.totalDrivers++
        if (driver.is_on_duty) stats.onDutyDrivers++
        cityMap.set(city, stats)
      })
    })

    // Process waitlist
    waitlist?.forEach((entry) => {
      const stats = cityMap.get(entry.city) || { onDutyDrivers: 0, totalDrivers: 0, waitlistCount: 0 }
      stats.waitlistCount++
      cityMap.set(entry.city, stats)
    })

    // Convert to array
    const stats = Array.from(cityMap.entries()).map(([city, data]) => ({
      city,
      ...data,
    }))

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error("[v0] City stats API error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch city stats" }, { status: 500 })
  }
}
