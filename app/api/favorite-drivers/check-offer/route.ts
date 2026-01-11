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

    // Get the offer
    const { data: offer, error } = await supabase.from("direct_ride_offers").select("*").eq("ride_id", rideId).single()

    if (error && error.code !== "PGRST116") {
      throw new Error("Failed to check offer status")
    }

    if (!offer) {
      return NextResponse.json({
        success: true,
        status: "no_offer",
      })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(offer.expires_at)
    const isExpired = now > expiresAt

    if (isExpired && offer.status === "pending") {
      // Update status to expired
      await supabase.from("direct_ride_offers").update({ status: "expired" }).eq("id", offer.id)
    }

    return NextResponse.json({
      success: true,
      status: isExpired ? "expired" : offer.status,
      offer: isExpired ? null : offer,
      timeRemaining: isExpired ? 0 : Math.max(0, expiresAt.getTime() - now.getTime()),
    })
  } catch (error: any) {
    console.error("[v0] Check offer error:", error)
    return NextResponse.json({ error: error.message || "Failed to check offer" }, { status: 500 })
  }
}
