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

    // Get tournament entries from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: entries, error: entriesError } = await supabase
      .from("tournament_entries")
      .select("*, tournament:tournament_id(*)")
      .gte("created_at", thirtyDaysAgo.toISOString())

    if (entriesError) throw entriesError

    // Calculate statistics
    let totalPiCollected = 0
    let totalBalanceCollected = 0
    let totalPayouts = 0
    let winnersCount = 0
    const tournamentSet = new Set()
    const tierStats: any = {}
    const gameStats: any = {}

    entries?.forEach((entry: any) => {
      const tournament = entry.tournament
      if (!tournament) return

      tournamentSet.add(entry.tournament_id)

      const entryFee = Number.parseFloat(tournament.entry_fee_pi || 0)
      if (entry.payment_method === "pi") {
        totalPiCollected += entryFee
      } else {
        totalBalanceCollected += entryFee
      }

      if (entry.prize_amount && entry.prize_amount > 0) {
        totalPayouts += Number.parseFloat(entry.prize_amount)
        winnersCount++
      }

      // Tier stats
      const tier = tournament.tier
      if (!tierStats[tier]) {
        tierStats[tier] = { tier, entries: 0, pi_revenue: 0, balance_revenue: 0 }
      }
      tierStats[tier].entries++
      if (entry.payment_method === "pi") {
        tierStats[tier].pi_revenue += entryFee
      } else {
        tierStats[tier].balance_revenue += entryFee
      }

      // Game stats
      const gameId = tournament.game_id
      if (!gameStats[gameId]) {
        gameStats[gameId] = { game_id: gameId, entries: 0, total_revenue: 0 }
      }
      gameStats[gameId].entries++
      gameStats[gameId].total_revenue += entryFee
    })

    const totalRevenue = totalPiCollected + totalBalanceCollected
    const appProfit = totalRevenue - totalPayouts

    const revenueByTier = Object.values(tierStats).sort((a: any, b: any) => a.tier - b.tier)
    const revenueByGame = Object.values(gameStats).sort((a: any, b: any) => b.total_revenue - a.total_revenue)

    return NextResponse.json({
      success: true,
      stats: {
        totalEntries: entries?.length || 0,
        activeTournaments: tournamentSet.size,
        totalPiCollected,
        totalBalanceCollected,
        totalRevenue,
        totalPayouts,
        appProfit,
        winnersCount,
      },
      revenueByTier,
      revenueByGame,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch tournament stats:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 })
  }
}
