import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, gameId, entryFee, tournamentTier, piPaymentId } = await request.json()

    if (!userId || !gameId || !entryFee || !tournamentTier || !piPaymentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create tournament entry
    const { data: entry, error } = await supabase
      .from("tournament_entries")
      .insert({
        user_id: userId,
        game_id: gameId,
        entry_fee: entryFee,
        tournament_tier: tournamentTier,
        pi_payment_id: piPaymentId,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating tournament entry:", error)
      return NextResponse.json({ error: "Failed to create tournament entry" }, { status: 500 })
    }

    console.log("[v0] Tournament entry created:", entry.id)

    return NextResponse.json({ success: true, entryId: entry.id })
  } catch (error) {
    console.error("[v0] Create tournament entry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
