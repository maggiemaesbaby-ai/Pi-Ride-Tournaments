import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rideId = searchParams.get("rideId")

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: ride, error } = await supabase
      .from("rides")
      .select("id, status, driver_id, driver_name, accepted_at, created_at")
      .eq("id", rideId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    // Check if acceptance window expired
    const rideCreatedAt = new Date(ride.created_at).getTime()
    const now = Date.now()
    const elapsedSeconds = (now - rideCreatedAt) / 1000

    if (ride.status === "pending" && elapsedSeconds > 90) {
      // Mark as expired and trigger refund
      await supabase.from("rides").update({ status: "expired" }).eq("id", rideId)

      return NextResponse.json({
        status: "expired",
        timeElapsed: Math.floor(elapsedSeconds),
        message: "No driver accepted within 90 seconds. Refund initiated.",
      })
    }

    return NextResponse.json({
      status: ride.status,
      driverId: ride.driver_id,
      driverName: ride.driver_name,
      acceptedAt: ride.accepted_at,
      timeElapsed: Math.floor(elapsedSeconds),
    })
  } catch (error: any) {
    console.error("[v0] Check status error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
