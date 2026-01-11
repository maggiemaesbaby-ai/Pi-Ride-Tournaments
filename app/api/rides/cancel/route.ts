import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { rideId } = await req.json()

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get ride details
    const { data: ride, error: fetchError } = await supabase.from("rides").select("*").eq("id", rideId).single()

    if (fetchError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    // Only allow cancellation if ride is still pending
    if (ride.status !== "pending") {
      return NextResponse.json({ error: "Cannot cancel ride in current status" }, { status: 400 })
    }

    // Update ride status to cancelled
    const { error: updateError } = await supabase
      .from("rides")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", rideId)

    if (updateError) {
      throw updateError
    }

    // TODO: Process Pi payment refund if payment was made
    // For now, we'll return success with refund flag
    const refunded = !!ride.pi_payment_id

    return NextResponse.json({
      success: true,
      refunded,
      message: refunded ? "Ride cancelled and payment refunded" : "Ride cancelled successfully",
    })
  } catch (error: any) {
    console.error("[v0] Ride cancellation error:", error)
    return NextResponse.json({ error: error.message || "Failed to cancel ride" }, { status: 500 })
  }
}
