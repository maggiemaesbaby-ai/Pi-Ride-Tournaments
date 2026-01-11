import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Send rollout notification to all ready drivers and riders
export async function POST(req: NextRequest) {
  try {
    const { city } = await req.json()

    if (city !== "Lagos") {
      return NextResponse.json({ error: "Currently only Lagos rollout is supported" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all drivers on waitlist
    const { data: drivers } = await supabase.from("lagos_driver_waitlist").select("*")

    // Mark all as notified
    const { error: driverError } = await supabase
      .from("lagos_driver_waitlist")
      .update({ rollout_notification_sent: true })
      .eq("city", "Lagos")

    if (driverError) {
      console.error("[Rollout Notification] Error updating drivers:", driverError)
    }

    // Get all riders on waitlist
    const { data: riders } = await supabase.from("lagos_rider_waitlist").select("*")

    // Mark all as notified
    const { error: riderError } = await supabase
      .from("lagos_rider_waitlist")
      .update({ rollout_notification_sent: true })
      .eq("city", "Lagos")

    if (riderError) {
      console.error("[Rollout Notification] Error updating riders:", riderError)
    }

    // In production, send actual notifications via email/push
    // For now, just log
    console.log(`[Rollout Notification] Sent to ${drivers?.length || 0} drivers and ${riders?.length || 0} riders`)

    return NextResponse.json({
      success: true,
      driversNotified: drivers?.length || 0,
      ridersNotified: riders?.length || 0,
      message: "Rollout notifications sent successfully!",
    })
  } catch (error: any) {
    console.error("[Rollout Notification] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
