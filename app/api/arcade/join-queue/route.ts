import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { gameId, userId, username, tier, entryFee, walletAddress, paymentId } = await req.json()

    console.log("[v0] Player joining tournament:", { gameId, userId, username, tier })

    const supabase = await createClient()

    const { data: tournamentEntry, error: entryError } = await supabase
      .from("tournament_entries")
      .insert({
        user_id: userId,
        game_id: gameId,
        tier_id: tier,
        entry_fee: entryFee,
        pi_payment_id: paymentId,
        status: "pending",
      })
      .select()
      .single()

    if (entryError) {
      console.error("[v0] Failed to create tournament entry:", entryError)
      throw new Error("Failed to create tournament entry")
    }

    console.log("[v0] Tournament entry created:", tournamentEntry.id)

    const { data: existingEntry } = await supabase
      .from("arcade_match_players")
      .select("match_id, arcade_matches!inner(game_id, tier, status)")
      .eq("user_id", userId)
      .eq("arcade_matches.game_id", gameId)
      .eq("arcade_matches.tier", tier)
      .in("arcade_matches.status", ["waiting", "active"])
      .single()

    if (existingEntry) {
      console.log("[v0] Player already in queue:", userId)
      return NextResponse.json(
        {
          error: "You are already in the queue for this tournament level",
          alreadyEntered: true,
        },
        { status: 400 },
      )
    }

    const { data: openMatch } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("game_id", gameId)
      .eq("tier_id", tier)
      .eq("status", "filling")
      .lt("current_players", "max_players")
      .single()

    let matchId: string

    if (openMatch) {
      // Join existing match
      matchId = openMatch.id

      // Update match player count and prize pool
      await supabase
        .from("tournament_matches")
        .update({
          current_players: openMatch.current_players + 1,
          prize_pool: (Number.parseFloat(openMatch.prize_pool) + Number.parseFloat(entryFee.toString())).toString(),
        })
        .eq("id", matchId)

      console.log("[v0] Joined existing match:", matchId)
    } else {
      // Create new match
      const { data: newMatch, error: matchError } = await supabase
        .from("tournament_matches")
        .insert({
          game_id: gameId,
          tier_id: tier,
          max_players: 10,
          current_players: 1,
          prize_pool: entryFee,
          status: "filling",
        })
        .select()
        .single()

      if (matchError) {
        console.error("[v0] Failed to create match:", matchError)
        throw new Error("Failed to create match")
      }

      matchId = newMatch.id
      console.log("[v0] Created new match:", matchId)
    }

    await supabase.from("match_participants").insert({
      match_id: matchId,
      entry_id: tournamentEntry.id,
      user_id: userId,
    })

    const { data: match } = await supabase
      .from("tournament_matches")
      .select("current_players, max_players")
      .eq("id", matchId)
      .single()

    const matchStarting = match && match.current_players >= match.max_players

    if (matchStarting) {
      // Mark match as active
      await supabase
        .from("tournament_matches")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", matchId)
    }

    return NextResponse.json({
      success: true,
      matchId,
      matchStarting,
      queuePosition: match?.current_players || 1,
      entryId: tournamentEntry.id,
    })
  } catch (error) {
    console.error("[v0] Queue join error:", error)
    return NextResponse.json({ error: "Failed to join queue" }, { status: 500 })
  }
}
