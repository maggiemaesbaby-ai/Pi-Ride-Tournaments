import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const piUserId = searchParams.get("piUserId")

    if (!piUserId) {
      return NextResponse.json({ error: "Pi User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: waitlistEntries, error } = await supabase
      .from("driver_waitlist")
      .select("*")
      .eq("pi_user_id", piUserId)
      .eq("notified", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to fetch waitlist:", error)
      return NextResponse.json({ error: "Failed to fetch waitlist" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      waitlist: waitlistEntries || [],
    })
  } catch (error: any) {
    console.error("[v0] Waitlist fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch waitlist" }, { status: 500 })
  }
}
// </CHANGE>
