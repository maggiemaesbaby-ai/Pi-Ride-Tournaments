import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    console.log("[v0] 💰 Balance API called with userId:", userId)

    if (!userId) {
      console.log("[v0] ❌ Missing userId parameter")
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    console.log("[v0] 💰 Balance query result:", { balanceData, balanceError, userId })

    if (balanceError) {
      console.error("[v0] ❌ Get balance error:", balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    const { data: userData, error: userError } = await supabase
      .from("arcade_users")
      .select("pi_uid")
      .eq("wallet_address", userId)
      .maybeSingle()

    console.log("[v0] 💰 User query result:", { userData, userError, userId })

    const balance = balanceData?.balance || 0
    const piUid = userData?.pi_uid || null

    console.log("[v0] 💰 Returning balance:", balance, "for user:", userId, "with pi_uid:", piUid)

    return NextResponse.json({
      balance: Number(balance),
      piUid: piUid,
    })
  } catch (error: any) {
    console.error("[v0] ❌ Get balance error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
