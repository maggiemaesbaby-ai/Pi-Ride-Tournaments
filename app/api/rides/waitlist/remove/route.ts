import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { piUserId, city } = body

    if (!piUserId) {
      return NextResponse.json({ error: "Pi User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete waitlist entries for this user in this city
    const { error } = await supabase
      .from("driver_waitlist")
      .delete()
      .eq("pi_user_id", piUserId)
      .eq("city", city || "")

    if (error) {
      console.error("[v0] Failed to remove from waitlist:", error)
      return NextResponse.json({ error: "Failed to remove from waitlist" }, { status: 500 })
    }

    console.log(`[v0] Removed user ${piUserId} from waitlist in ${city}`)

    return NextResponse.json({
      success: true,
      message: "Removed from waitlist successfully",
    })
  } catch (error: any) {
    console.error("[v0] Remove waitlist error:", error)
    return NextResponse.json({ error: error.message || "Failed to remove from waitlist" }, { status: 500 })
  }
}
// </CHANGE>
