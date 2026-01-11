import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, driverId } = body

    if (!offerId || !driverId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the offer
    const { data: offer, error: offerError } = await supabase
      .from("direct_ride_offers")
      .select("*")
      .eq("id", offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Verify driver
    if (offer.driver_id !== driverId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if expired
    const now = new Date()
    const expiresAt = new Date(offer.expires_at)
    if (now > expiresAt) {
      await supabase.from("direct_ride_offers").update({ status: "expired" }).eq("id", offerId)
      return NextResponse.json({ error: "Offer has expired" }, { status: 410 })
    }

    // Accept offer
    const { error: acceptError } = await supabase
      .from("direct_ride_offers")
      .update({
        status: "accepted",
        accepted_at: now.toISOString(),
      })
      .eq("id", offerId)

    if (acceptError) {
      throw new Error("Failed to accept offer")
    }

    // Update ride status
    await supabase
      .from("rides")
      .update({
        status: "accepted",
        driver_id: driverId,
      })
      .eq("id", offer.ride_id)

    return NextResponse.json({
      success: true,
      message: "Offer accepted",
      rideId: offer.ride_id,
    })
  } catch (error: any) {
    console.error("[v0] Accept offer error:", error)
    return NextResponse.json({ error: error.message || "Failed to accept offer" }, { status: 500 })
  }
}
