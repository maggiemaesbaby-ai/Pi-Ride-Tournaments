import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { matchId } = await request.json()

    const supabase = await createClient()

    // Get all pending payouts for this match
    const { data: payouts, error } = await supabase
      .from("tournament_payouts")
      .select("*")
      .eq("match_id", matchId)
      .eq("status", "pending")

    if (error) {
      console.error("[v0] Error fetching payouts:", error)
      return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
    }

    console.log("[v0] Processing", payouts.length, "payouts for match:", matchId)

    const updates = []
    const notifications = []

    for (const payout of payouts) {
      // Get or create user balance
      const { data: balance, error: balanceError } = await supabase
        .from("user_balances")
        .select("*")
        .eq("user_id", payout.user_id)
        .single()

      if (balanceError && balanceError.code !== "PGRST116") {
        console.error("[v0] Error fetching balance:", balanceError)
        continue
      }

      const currentBalance = balance?.balance || 0
      const newBalance = currentBalance + payout.amount

      // Update or insert user balance
      if (balance) {
        await supabase.from("user_balances").update({ balance: newBalance }).eq("user_id", payout.user_id)
      } else {
        await supabase.from("user_balances").insert({
          user_id: payout.user_id,
          balance: payout.amount,
        })
      }

      // Create balance transaction record
      await supabase.from("balance_transactions").insert({
        user_id: payout.user_id,
        amount: payout.amount,
        type: "tournament_payout",
        description: `Tournament prize payout - Match ${matchId}`,
        match_id: matchId,
      })

      notifications.push(
        supabase.from("user_notifications").insert({
          user_id: payout.user_id,
          type: "tournament_payout",
          title: "🏆 Tournament Prize Won!",
          message: `You won ${payout.amount}π in a tournament match! Your balance has been updated.`,
          data: {
            match_id: matchId,
            amount: payout.amount,
            balance_after: newBalance,
          },
        }),
      )

      // Mark payout as completed
      updates.push(
        supabase
          .from("tournament_payouts")
          .update({
            status: "completed",
            processed_at: new Date().toISOString(),
            pi_transaction_id: `balance_credit_${Date.now()}_${payout.id}`,
          })
          .eq("id", payout.id),
      )
    }

    await Promise.all([...updates, ...notifications])

    const { data: match } = await supabase
      .from("tournament_matches")
      .select("uses_pot, pot_locked_amount, prize_pool")
      .eq("id", matchId)
      .single()

    if (match?.uses_pot && match.pot_locked_amount) {
      const { data: potWallet } = await supabase
        .from("app_pot_wallet")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single()

      if (potWallet) {
        const totalPayoutAmount = payouts.reduce((sum, p) => sum + Number(p.amount), 0)
        const newLockedBalance = Number(potWallet.locked_balance) - Number(match.pot_locked_amount)
        const newTotalBalance = Number(potWallet.total_balance) - Number(totalPayoutAmount)

        await supabase
          .from("app_pot_wallet")
          .update({
            total_balance: newTotalBalance,
            locked_balance: newLockedBalance,
            last_updated: new Date().toISOString(),
          })
          .eq("id", "00000000-0000-0000-0000-000000000001")

        await supabase.from("pot_transactions").insert({
          type: "payout",
          amount: -totalPayoutAmount,
          balance_before: potWallet.total_balance,
          balance_after: newTotalBalance,
          locked_before: potWallet.locked_balance,
          locked_after: newLockedBalance,
          description: `Payouts for match ${matchId}`,
          match_id: matchId,
        })

        console.log(
          "[v0] Released",
          match.pot_locked_amount,
          "π from locked, deducted",
          totalPayoutAmount,
          "π from pot wallet",
        )
        console.log("[v0] Pot wallet profit:", Number(match.pot_locked_amount) - totalPayoutAmount, "π")
      }
    }

    // Mark match as paid out
    await supabase.from("tournament_matches").update({ status: "paid_out" }).eq("id", matchId)

    console.log("[v0] Payouts processed and notifications sent for", payouts.length, "users")

    return NextResponse.json({ success: true, payoutsProcessed: payouts.length })
  } catch (error) {
    console.error("[v0] Process payouts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
