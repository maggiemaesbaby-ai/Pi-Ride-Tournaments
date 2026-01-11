import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: potWallet, error: potError } = await supabase.from("app_pot_wallet").select("*").single()

    if (potError) {
      console.error("[v0] Error fetching pot wallet:", potError)
      return NextResponse.json({ error: "Failed to fetch pot wallet" }, { status: 500 })
    }

    console.log("[v0] Pot wallet balance from DB:", potWallet.total_balance)

    // Get recent transactions
    const { data: transactions, error: txError } = await supabase
      .from("pot_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (txError) {
      console.error("[v0] Error fetching transactions:", txError)
    }

    // Get locked matches count
    const { count: lockedMatchesCount } = await supabase
      .from("tournament_matches")
      .select("*", { count: "exact", head: true })
      .eq("uses_pot", true)
      .in("status", ["filling", "active"])

    // Calculate total expected payouts for active matches
    const { data: activeMatches } = await supabase
      .from("tournament_matches")
      .select("prize_pool, app_wallet_amount")
      .eq("uses_pot", true)
      .in("status", ["filling", "active"])

    let totalLockedForPayouts = 0
    if (activeMatches) {
      totalLockedForPayouts = activeMatches.reduce((sum, match) => {
        return sum + (Number(match.prize_pool) - Number(match.app_wallet_amount || 0))
      }, 0)
    }

    return NextResponse.json({
      potWallet,
      transactions: transactions || [],
      stats: {
        lockedMatchesCount: lockedMatchesCount || 0,
        totalLockedForPayouts,
        profitAvailable: Number(potWallet.total_balance) - totalLockedForPayouts,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Pot wallet error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Add funds to pot
export async function POST(request: Request) {
  try {
    const { amount, description, source } = await request.json()

    const supabase = await createClient()

    // Get current pot wallet
    const { data: potWallet } = await supabase.from("app_pot_wallet").select("*").single()

    if (!potWallet) {
      return NextResponse.json({ error: "Pot wallet not found" }, { status: 404 })
    }

    const newBalance = Number(potWallet.total_balance) + Number(amount)

    // Update pot wallet
    await supabase
      .from("app_pot_wallet")
      .update({
        total_balance: newBalance,
        last_updated: new Date().toISOString(),
      })
      .eq("id", potWallet.id)

    await supabase.from("pot_transactions").insert({
      type: source === "auto" ? "auto_fund_from_wallet" : "manual_add_funds",
      amount,
      balance_before: potWallet.total_balance,
      balance_after: newBalance,
      locked_before: potWallet.locked_balance,
      locked_after: potWallet.locked_balance,
      description: description || "Funds added to pot",
    })

    return NextResponse.json({ success: true, newBalance })
  } catch (error) {
    console.error("[v0] Add funds error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
