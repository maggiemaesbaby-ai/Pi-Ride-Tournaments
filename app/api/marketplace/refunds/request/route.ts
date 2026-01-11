import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, reason, details } = await request.json()

    console.log("[v0] Processing refund request:", { orderId, reason })

    const supabase = await createClient()

    // Update order with refund request
    const { data: order, error: orderError } = await supabase
      .from("marketplace_orders")
      .update({
        refund_requested: true,
        refund_reason: `${reason}${details ? ` - ${details}` : ""}`,
        refund_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order update error:", orderError)
      return NextResponse.json({ error: "Failed to submit refund request" }, { status: 500 })
    }

    // Create notification for seller
    await supabase.from("notifications").insert({
      user_id: order.seller_id,
      type: "refund_request",
      title: "Return Request Received",
      message: `A buyer has requested a return for order #${orderId.slice(-8)}. Reason: ${reason}`,
      reference_id: orderId,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Refund request submitted successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Refund request error:", error)
    return NextResponse.json({ error: "Refund request failed" }, { status: 500 })
  }
}
