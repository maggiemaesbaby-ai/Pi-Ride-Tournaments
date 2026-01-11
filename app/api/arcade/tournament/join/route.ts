import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { userId, gameId, tierId, entryFee, piPaymentId, platform } = await req.json()

    console.log("[v0] Tournament join request:", { userId, gameId, tierId, entryFee, piPaymentId, platform })

    if (!piPaymentId) {
      return NextResponse.json({ error: "Payment ID required for tournament entry" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: tierConfig, error: tierError } = await supabase
      .from("tournament_tiers")
      .select("*")
      .eq("game_id", gameId)
      .eq("id", tierId)
      .single()

    if (tierError || !tierConfig) {
      console.error("[v0] Tier configuration not found:", { gameId, tierId, error: tierError })
      return NextResponse.json({ error: "Invalid tournament tier" }, { status: 404 })
    }

    console.log("[v0] Tier config:", {
      name: tierConfig.name,
      players: tierConfig.pool_size,
      entry: tierConfig.entry_fee,
    })

    const { data: paymentRecord, error: paymentError } = await supabase
      .from("pi_payments")
      .select("*")
      .eq("payment_id", piPaymentId)
      .single()

    if (paymentError || !paymentRecord) {
      console.error("[v0] Payment not found:", piPaymentId)
      return NextResponse.json({ error: "Payment not verified. Please complete payment first." }, { status: 400 })
    }

    if (paymentRecord.status !== "completed") {
      console.error("[v0] Payment not completed:", { piPaymentId, status: paymentRecord.status })
      return NextResponse.json(
        { error: "Payment not completed. Please wait for blockchain confirmation." },
        { status: 400 },
      )
    }

    const { data: existingEntry } = await supabase
      .from("tournament_entries")
      .select("id")
      .eq("payment_id", piPaymentId)
      .maybeSingle()

    if (existingEntry) {
      console.error("[v0] Payment already used:", piPaymentId)
      return NextResponse.json({ error: "This payment has already been used for a tournament entry." }, { status: 400 })
    }

    const { data: tournamentEntry, error: entryError } = await supabase
      .from("tournament_entries")
      .insert({
        user_id: userId,
        game_id: gameId,
        tier_id: tierId,
        entry_fee: entryFee,
        payment_id: piPaymentId,
        status: "active",
        platform: null, // Platform not set until user chooses
      })
      .select()
      .single()

    if (entryError) {
      console.error("[v0] Failed to create tournament entry:", entryError)
      throw new Error("Failed to create tournament entry")
    }

    console.log("[v0] Tournament entry created with verified payment:", tournamentEntry.id)

    return NextResponse.json({
      success: true,
      entryId: tournamentEntry.id,
      tierName: tierConfig.name,
      readyToPlay: true,
    })
  } catch (error) {
    console.error("[v0] Tournament join error:", error)
    return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 })
  }
}
