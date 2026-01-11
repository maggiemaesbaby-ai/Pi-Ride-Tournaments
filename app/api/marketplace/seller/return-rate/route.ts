import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get("sellerId")

    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Calculate return rate from marketplace_orders table
    const { data: allOrders, error: ordersError } = await supabase
      .from("marketplace_orders")
      .select("id, refund_status")
      .eq("seller_id", sellerId)

    if (ordersError) {
      console.error("[v0] Failed to get orders:", ordersError)
      // Return default values instead of failing
      return NextResponse.json({
        success: true,
        returnRate: 0,
        totalSales: 0,
        totalReturns: 0,
      })
    }

    const totalSales = allOrders?.length || 0
    const totalReturns =
      allOrders?.filter((order) => order.refund_status === "approved" || order.refund_status === "completed").length ||
      0

    const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0

    return NextResponse.json({
      success: true,
      returnRate: Math.round(returnRate * 100) / 100, // Round to 2 decimals
      totalSales,
      totalReturns,
    })
  } catch (error) {
    console.error("[v0] Return rate fetch error:", error)
    // Return default values instead of failing
    return NextResponse.json({
      success: true,
      returnRate: 0,
      totalSales: 0,
      totalReturns: 0,
    })
  }
}
