import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { orderId, sellerId, approved, returnAddress, message } = await request.json()

    console.log("[v0] Processing refund response:", { orderId, approved })

    const supabase = await createClient()

    const { data: order, error: orderError } = await supabase
      .from("marketplace_orders")
      .update({
        refund_status: approved ? "approved" : "declined",
        refund_approved_at: approved ? new Date().toISOString() : null,
        refund_reason: order?.refund_reason + (message ? ` | Seller response: ${message}` : ""),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("seller_id", sellerId)
      .select()
      .single()

    if (orderError) {
      console.error("[v0] Order update error:", orderError)
      return NextResponse.json({ error: "Failed to process refund response" }, { status: 500 })
    }

    // Notify buyer
    await supabase.from("notifications").insert({
      user_id: order.buyer_id,
      type: "refund_response",
      title: approved ? "Return Request Approved" : "Return Request Declined",
      message: approved
        ? `Your return request has been approved. Return address: ${returnAddress || "Check order details"}`
        : `Your return request has been declined. ${message || "Contact the seller for more information."}`,
      reference_id: orderId,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Refund response processed successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Refund response error:", error)
    return NextResponse.json({ error: "Refund response failed" }, { status: 500 })
  }
}
