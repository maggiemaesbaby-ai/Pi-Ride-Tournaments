import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rideId, driverId, response } = body

    if (!rideId || !driverId || !response) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify driver owns this ride
    const { data: ride, error: rideError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    if (ride.driver_id !== driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update ride with driver response
    const { error: updateError } = await supabase
      .from("rides")
      .update({
        driver_response: response,
      })
      .eq("id", rideId)

    if (updateError) {
      throw new Error("Failed to save driver response")
    }

    return NextResponse.json({
      success: true,
      message: "Response saved successfully",
    })
  } catch (error: any) {
    console.error("[v0] Driver response error:", error)
    return NextResponse.json({ error: error.message || "Failed to save response" }, { status: 500 })
  }
}
