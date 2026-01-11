import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piUserId, entryId } = body

    if (!piUserId) {
      return NextResponse.json({ error: "Pi User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the waitlist entry after user acknowledges the notification
    const { error } = await supabase.from("driver_waitlist").delete().eq("pi_user_id", piUserId).eq("id", entryId)

    if (error) {
      console.error("[v0] Failed to acknowledge notification:", error)
      return NextResponse.json({ error: "Failed to acknowledge notification" }, { status: 500 })
    }

    console.log(`[v0] User ${piUserId} acknowledged waitlist notification ${entryId}`)

    return NextResponse.json({
      success: true,
      message: "Notification acknowledged and removed from waitlist",
    })
  } catch (error: any) {
    console.error("[v0] Acknowledge notification error:", error)
    return NextResponse.json({ error: error.message || "Failed to acknowledge notification" }, { status: 500 })
  }
}
