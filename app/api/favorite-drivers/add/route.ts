import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { riderPiUserId, driverId } = body

    if (!riderPiUserId || !driverId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorite_drivers")
      .select("id")
      .eq("rider_pi_user_id", riderPiUserId)
      .eq("driver_id", driverId)
      .single()

    if (existing) {
      return NextResponse.json({ success: true, message: "Driver already favorited" })
    }

    // Add to favorites
    const { error: insertError } = await supabase.from("favorite_drivers").insert({
      rider_pi_user_id: riderPiUserId,
      driver_id: driverId,
    })

    if (insertError) {
      throw new Error("Failed to add favorite driver")
    }

    return NextResponse.json({
      success: true,
      message: "Driver added to favorites",
    })
  } catch (error: any) {
    console.error("[v0] Add favorite driver error:", error)
    return NextResponse.json({ error: error.message || "Failed to add favorite" }, { status: 500 })
  }
}
