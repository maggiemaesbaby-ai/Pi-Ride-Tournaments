import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST - Admin sends message to driver
export async function POST(req: NextRequest) {
  try {
    const { driverPiUserId, message } = await req.json()

    if (!driverPiUserId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("driver_admin_messages")
      .insert({
        driver_pi_user_id: driverPiUserId,
        sender: "admin",
        message,
        read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[Admin Message] Error:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    console.log(`[Admin Message] Sent to driver ${driverPiUserId}`)

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[Admin Message] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Fetch messages for a driver or all messages for admin
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const driverPiUserId = searchParams.get("driverPiUserId")
    const isAdmin = searchParams.get("isAdmin") === "true"

    const supabase = await createClient()

    let query = supabase.from("driver_admin_messages").select("*").order("created_at", { ascending: false })

    if (driverPiUserId && !isAdmin) {
      query = query.eq("driver_pi_user_id", driverPiUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[Admin Message] Error fetching:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (error: any) {
    console.error("[Admin Message] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Mark message as read
export async function PUT(req: NextRequest) {
  try {
    const { messageId } = await req.json()

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("driver_admin_messages").update({ read: true }).eq("id", messageId)

    if (error) {
      console.error("[Admin Message] Error marking read:", error)
      return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[Admin Message] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
