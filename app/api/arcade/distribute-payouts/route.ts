import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json()

    const supabase = await createClient()

    const { data: match } = await supabase
      .from("arcade_matches")
      .select("*, arcade_match_players(*)")
      .eq("id", matchId)
      .single()

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    const winners = match.arcade_match_players.filter((p: any) => p.rank <= 3).sort((a: any, b: any) => a.rank - b.rank)

    console.log("[v0] Distributing payouts for match:", matchId)
    console.log("[v0] Winners:", winners)

    const PI_NETWORK_FEE = 0.01
    let totalFeesCovered = 0

    const paymentPromises = winners.map(async (winner: any) => {
      if (!winner.payout || winner.payout <= 0) return null

      try {
        // Send full payout to winner, app covers the Pi Network fee
        totalFeesCovered += PI_NETWORK_FEE

        const response = await fetch("/api/pi-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: winner.payout,
            recipient: winner.wallet_address,
            memo: `Pi Arcade Legends - Prize for rank #${winner.rank} (No Hidden Fees!)`,
            metadata: {
              matchId,
              gameId: match.game_id,
              rank: winner.rank,
            },
          }),
        })

        const paymentData = await response.json()
        console.log("[v0] Payment sent to rank #", winner.rank, ":", paymentData)

        return paymentData
      } catch (error) {
        console.error("[v0] Payment failed for winner:", winner, error)
        return null
      }
    })

    const paymentResults = await Promise.all(paymentPromises)

    // Calculate app revenue after covering all fees
    const totalEntryFees = match.entry_fee * match.arcade_match_players.length
    const totalPayouts = match.arcade_match_players
      .filter((p: any) => p.rank <= 3)
      .reduce((sum: number, p: any) => sum + (p.payout || 0), 0)

    const appRevenue = totalEntryFees - totalPayouts - totalFeesCovered

    const ownerWallet = process.env.NEXT_PUBLIC_PI_WALLET_ADDRESS || process.env.PI_WALLET_ADDRESS
    console.log("[v0] App revenue after covering fees:", appRevenue, "Total fees covered:", totalFeesCovered)

    if (ownerWallet && appRevenue > 0) {
      try {
        const feeResponse = await fetch("/api/pi-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: appRevenue,
            recipient: ownerWallet,
            memo: `Pi Arcade Legends - Net Revenue (Fees Covered)`,
            metadata: {
              matchId,
              gameId: match.game_id,
              type: "app_revenue",
              totalFeesCovered,
            },
          }),
        })

        const feeData = await feeResponse.json()
        console.log("[v0] App revenue sent:", feeData)
      } catch (error) {
        console.error("[v0] App revenue payment failed:", error)
      }
    }

    return NextResponse.json({
      success: true,
      paymentsSent: paymentResults.filter((p) => p !== null).length,
      appRevenue,
      totalFeesCovered,
    })
  } catch (error) {
    console.error("[v0] Distribute payouts error:", error)
    return NextResponse.json({ error: "Failed to distribute payouts" }, { status: 500 })
  }
}
