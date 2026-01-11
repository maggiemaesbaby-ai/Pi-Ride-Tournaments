import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const riderPiUserId = searchParams.get("riderPiUserId")

    if (!riderPiUserId) {
      return NextResponse.json({ error: "Rider ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get favorite drivers with their current status
    const { data: favorites, error } = await supabase
      .from("favorite_drivers")
      .select(
        `
        id,
        driver_id,
        created_at,
        drivers (
          id,
          full_name,
          rating,
          total_rides,
          vehicle_info,
          is_on_duty,
          current_location,
          service_cities
        )
      `,
      )
      .eq("rider_pi_user_id", riderPiUserId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error("Failed to fetch favorite drivers")
    }

    return NextResponse.json({
      success: true,
      favorites: favorites || [],
    })
  } catch (error: any) {
    console.error("[v0] List favorite drivers error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch favorites" }, { status: 500 })
  }
}
