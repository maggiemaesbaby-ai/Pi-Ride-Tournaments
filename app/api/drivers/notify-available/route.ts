import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, pickupCity, pickupLocation, dropoffLocation, rideType, pricePi } = body

    const supabase = await createClient()

    // Get all on-duty drivers in the pickup city
    const { data: drivers, error } = await supabase
      .from("drivers")
      .select("pi_user_id, email, full_name")
      .eq("is_on_duty", true)
      .contains("service_cities", [pickupCity])

    if (error) {
      console.error("[v0] Failed to fetch drivers:", error)
      throw new Error("Failed to fetch available drivers")
    }

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({
        success: true,
        driversNotified: 0,
        message: "No drivers available in this city",
      })
    }

    console.log(`[v0] Creating dashboard notifications for ${drivers.length} drivers`)

    const notifications = drivers.map((driver) => ({
      ride_id: rideId,
      driver_id: driver.pi_user_id,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      ride_type: rideType,
      price_pi: pricePi,
      status: "pending",
    }))

    const { error: notifError } = await supabase.from("ride_notifications").insert(notifications)

    if (notifError) {
      console.error("[v0] Failed to create ride notifications:", notifError)
      throw new Error("Failed to create ride notifications")
    }

    console.log(`[v0] Created ${drivers.length} dashboard notifications for ride ${rideId}`)

    return NextResponse.json({
      success: true,
      driversNotified: drivers.length,
      totalDrivers: drivers.length,
    })
  } catch (error: any) {
    console.error("[v0] Driver notification error:", error)
    return NextResponse.json({ error: error.message || "Failed to notify drivers" }, { status: 500 })
  }
}
