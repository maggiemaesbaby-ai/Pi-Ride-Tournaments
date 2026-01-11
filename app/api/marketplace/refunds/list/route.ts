import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")
    const buyerId = searchParams.get("buyerId")

    const supabase = await createClient()

    let query = supabase.from("marketplace_orders").select("*").eq("refund_requested", true)

    if (sellerId) {
      query = query.eq("seller_id", sellerId)
    }

    if (buyerId) {
      query = query.eq("buyer_id", buyerId)
    }

    const { data: requests, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Failed to load refund requests:", error)
      return NextResponse.json({ error: "Failed to load refund requests" }, { status: 500 })
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[v0] Refund list error:", error)
    return NextResponse.json({ error: "Failed to load refund requests" }, { status: 500 })
  }
}
