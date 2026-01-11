import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, driverId } = body

    if (!rideId || !driverId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the ride details
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    // Create direct offer with 90 second expiry
    const expiresAt = new Date(Date.now() + 90 * 1000).toISOString()

    const { error: offerError } = await supabase.from("direct_ride_offers").insert({
      ride_id: rideId,
      driver_id: driverId,
      pickup_location: ride.pickup_location,
      dropoff_location: ride.dropoff_location,
      price_pi: ride.price_pi,
      distance_km: ride.distance_km,
      duration_minutes: ride.duration_minutes,
      expires_at: expiresAt,
    })

    if (offerError) {
      throw new Error("Failed to create direct offer")
    }

    return NextResponse.json({
      success: true,
      message: "Direct offer sent to driver",
      expiresAt,
    })
  } catch (error: any) {
    console.error("[v0] Direct offer error:", error)
    return NextResponse.json({ error: error.message || "Failed to send offer" }, { status: 500 })
  }
}
