import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all notifications for user
    const { data: notifications, error } = await supabase
      .from("user_notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Get unread count
    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("[v0] Get notifications error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { notificationId, userId, markAllRead } = await request.json()

    const supabase = await createClient()

    if (markAllRead && userId) {
      // Mark all as read for user
      const { error } = await supabase
        .from("user_notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)

      if (error) {
        console.error("[v0] Error marking all as read:", error)
        return NextResponse.json({ error: "Failed to mark all as read" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (notificationId) {
      // Mark single notification as read
      const { error } = await supabase.from("user_notifications").update({ read: true }).eq("id", notificationId)

      if (error) {
        console.error("[v0] Error marking as read:", error)
        return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Update notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
