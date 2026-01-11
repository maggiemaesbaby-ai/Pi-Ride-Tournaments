import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Release driver earnings from locked pot to driver dashboard wallet
export async function POST(req: NextRequest) {
  try {
    const { piUserId } = await req.json()

    if (!piUserId) {
      return NextResponse.json({ error: "Missing piUserId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Call the database function to release earnings
    const { data, error } = await supabase.rpc("release_driver_earnings", {
      p_driver_pi_user_id: piUserId,
    })

    if (error) {
      console.error("[Release Earnings] Error:", error)
      return NextResponse.json({ error: "Failed to release earnings" }, { status: 500 })
    }

    if (!data.success) {
      return NextResponse.json({ error: data.message || "No earnings to release" }, { status: 400 })
    }

    console.log(`[Release Earnings] Released ${data.amount_released}π to driver ${piUserId}`)

    return NextResponse.json({
      success: true,
      amountReleased: data.amount_released,
      newLockedBalance: data.new_locked_balance,
    })
  } catch (error: any) {
    console.error("[Release Earnings] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
