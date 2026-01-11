import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated()
    if (!isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get users with positive balances
    const { data: balances, error: balancesError } = await supabase
      .from("user_balances")
      .select("*")
      .gt("balance", 0)
      .order("balance", { ascending: false })
      .limit(100)

    if (balancesError) throw balancesError

    // Enhance with user info and tournament stats
    const enhancedBalances = await Promise.all(
      (balances || []).map(async (balance: any) => {
        // Get tournament entries
        const { data: entries } = await supabase
          .from("tournament_entries")
          .select("prize_amount")
          .eq("user_id", balance.user_id)

        const tournamentEntries = entries?.length || 0
        const totalWinnings = entries?.reduce((sum, e) => sum + Number.parseFloat(e.prize_amount || 0), 0) || 0

        return {
          ...balance,
          tournament_entries: tournamentEntries,
          total_winnings: totalWinnings,
        }
      }),
    )

    // Get balance transaction summary for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: transactions, error: txError } = await supabase
      .from("balance_transactions")
      .select("amount")
      .gte("created_at", thirtyDaysAgo.toISOString())

    if (txError) throw txError

    const totalCredits = transactions?.filter((t: any) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0

    const totalDebits =
      transactions?.filter((t: any) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

    return NextResponse.json({
      success: true,
      userBalances: enhancedBalances,
      transactionSummary: {
        total_transactions: transactions?.length || 0,
        total_credits: totalCredits,
        total_debits: totalDebits,
      },
    })
  } catch (error) {
    console.error("[v0] Failed to fetch user balances:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch balances" }, { status: 500 })
  }
}
