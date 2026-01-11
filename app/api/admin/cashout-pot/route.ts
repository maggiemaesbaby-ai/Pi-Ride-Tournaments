import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get("cookie")
    if (!authHeader?.includes("admin-session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current pot wallet balance
    const { data: potWallet, error: potError } = await supabase.from("app_pot_wallet").select("*").single()

    if (potError || !potWallet) {
      return NextResponse.json({ error: "Pot wallet not found" }, { status: 404 })
    }

    // Calculate locked amount from active matches
    const { data: activeMatches } = await supabase
      .from("tournament_matches")
      .select("prize_pool, app_wallet_amount")
      .eq("uses_pot", true)
      .in("status", ["filling", "active"])

    let lockedAmount = 0
    if (activeMatches) {
      lockedAmount = activeMatches.reduce((sum, match) => {
        return sum + (Number(match.prize_pool) - Number(match.app_wallet_amount || 0))
      }, 0)
    }

    const currentBalance = Number(potWallet.total_balance)
    const available = currentBalance - lockedAmount

    if (amount > available) {
      return NextResponse.json(
        { error: `Insufficient available balance. Available: ${available.toFixed(2)}π` },
        { status: 400 },
      )
    }

    // Update pot wallet balance
    const newBalance = currentBalance - amount
    const { error: updateError } = await supabase
      .from("app_pot_wallet")
      .update({
        total_balance: newBalance,
        last_updated: new Date().toISOString(),
      })
      .eq("id", potWallet.id)

    if (updateError) {
      console.error("[Admin] Error updating pot wallet:", updateError)
      return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
    }

    // Record transaction
    await supabase.from("pot_transactions").insert({
      type: "admin_withdrawal",
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      locked_before: potWallet.locked_balance,
      locked_after: potWallet.locked_balance,
      description: `Admin cashout: ${amount}π transferred to personal wallet`,
    })

    console.log(`[Admin] Cashed out ${amount}π from pot wallet. New balance: ${newBalance}π`)

    return NextResponse.json({
      success: true,
      amount,
      newBalance,
      message: "Cashout successful",
    })
  } catch (error) {
    console.error("[Admin] Cashout error:", error)
    return NextResponse.json({ error: "Failed to process cashout" }, { status: 500 })
  }
}
