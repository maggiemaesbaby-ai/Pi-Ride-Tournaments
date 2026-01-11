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

    // Get waitlist entries that have been notified but not yet acknowledged
    const { data: notifiedEntries, error } = await supabase
      .from("driver_waitlist")
      .select("*")
      .eq("pi_user_id", piUserId)
      .eq("notified", true)

    if (error) {
      console.error("[v0] Failed to check notifications:", error)
      return NextResponse.json({ error: "Failed to check notifications" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      hasNotifications: (notifiedEntries?.length || 0) > 0,
      entries: notifiedEntries || [], // Added entries field for accessing individual notification details
      notifications: notifiedEntries || [],
      count: notifiedEntries?.length || 0,
    })
    // </CHANGE>
  } catch (error: any) {
    console.error("[v0] Check notifications error:", error)
    return NextResponse.json({ error: error.message || "Failed to check notifications" }, { status: 500 })
  }
}
