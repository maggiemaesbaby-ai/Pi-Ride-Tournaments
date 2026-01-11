import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { userId, gameId, tierId, entryFee, platform } = await request.json()

    console.log("[API] Join with balance:", { userId, gameId, tierId, entryFee, platform })

    console.log("[API] Platform value being stored in tournament_entries:", platform || "browser")

    if (!userId || !gameId || !tierId || !entryFee) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (balanceError) throw balanceError

    const currentBalance = Number(balanceData?.balance || 0)

    if (currentBalance < entryFee) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    const newBalance = currentBalance - Number(entryFee)
    await supabase
      .from("user_balances")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId)

    const { data: potWallet } = await supabase
      .from("app_pot_wallet")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()

    if (potWallet) {
      const newPotBalance = Number(potWallet.total_balance) + Number(entryFee)

      await supabase
        .from("app_pot_wallet")
        .update({
          total_balance: newPotBalance,
          last_updated: new Date().toISOString(),
        })
        .eq("id", "00000000-0000-0000-0000-000000000001")

      await supabase.from("pot_transactions").insert({
        type: "entry_fee",
        amount: entryFee,
        balance_before: potWallet.total_balance,
        balance_after: newPotBalance,
        locked_before: potWallet.locked_balance,
        locked_after: potWallet.locked_balance,
        description: `Balance entry fee: ${gameId} - ${tierId}`,
        user_id: userId,
      })

      console.log("[API] Added entry fee to pot wallet:", entryFee, "New pot balance:", newPotBalance)
    }

    const { data: tournamentEntry, error: entryError } = await supabase
      .from("tournament_entries")
      .insert({
        user_id: userId,
        game_id: gameId,
        tier_id: tierId,
        entry_fee: entryFee,
        status: "active",
        score: null,
        platform: platform || "browser",
      })
      .select()
      .single()

    if (entryError) {
      console.error("[API] Failed to create tournament entry:", entryError)
      throw new Error("Failed to create tournament entry")
    }

    console.log("[API] Tournament entry created:", {
      entryId: tournamentEntry.id,
      platform: tournamentEntry.platform,
      user_id: userId,
    })

    await supabase.from("balance_transactions").insert({
      user_id: userId,
      amount: -Number(entryFee),
      type: "tournament_entry",
      description: `Tournament entry: ${gameId} - ${tierId}`,
    })

    console.log("[API] Tournament entry created:", tournamentEntry.id, "New balance:", newBalance)

    return NextResponse.json({
      success: true,
      entryId: tournamentEntry.id,
      newBalance,
      readyToPlay: true,
    })
  } catch (error: any) {
    console.error("[API] Join with balance error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
