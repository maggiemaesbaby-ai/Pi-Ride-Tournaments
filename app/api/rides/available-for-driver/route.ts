import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const driverId = searchParams.get("driverId")
    const serviceType = searchParams.get("serviceType") || "Economy"

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    await supabase.rpc("expire_old_ride_notifications")

    // Get driver info
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("service_cities, is_on_duty")
      .eq("pi_user_id", driverId)
      .single()

    if (driverError || !driver || !driver.is_on_duty) {
      return NextResponse.json({ rides: [] })
    }

    const { data: notifications, error: notifError } = await supabase
      .from("ride_notifications")
      .select("*")
      .eq("driver_id", driverId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })

    if (notifError) {
      console.error("[v0] Failed to fetch ride notifications:", notifError)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    const now = Date.now()
    const rides =
      notifications?.map((notif) => {
        const expiresAt = new Date(notif.expires_at).getTime()
        const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000))

        return {
          id: notif.ride_id,
          notificationId: notif.id,
          pickup_location: notif.pickup_location,
          dropoff_location: notif.dropoff_location,
          ride_type: notif.ride_type,
          price_pi: notif.price_pi,
          created_at: notif.created_at,
          timeRemaining,
        }
      }) || []

    // Filter rides within 90 second window and in driver's service cities
    const availableRides = rides.filter((ride) => {
      // Within 90 second window
      if (ride.timeRemaining > 90) return false

      // Check if pickup location is in driver's service cities
      const pickupCity = extractCityFromAddress(ride.pickup_location?.address || "")
      return driver.service_cities?.includes(pickupCity)
    })

    return NextResponse.json({
      success: true,
      rides: availableRides,
    })
  } catch (error: any) {
    console.error("[v0] Available rides error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function extractCityFromAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim())
  if (parts.length >= 2) {
    return parts[parts.length - 2].split(" ")[0]
  }
  return parts[0]
}
