import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { gameId, userId, walletAddress, paymentId, tier, entryFee } = await request.json()

    console.log("[v0] Creating/joining match:", { gameId, tier, entryFee })

    const supabase = await createClient()

    const TIER_PLAYER_LIMITS: { [key: string]: number } = {
      "tier-1": 7,
      "tier-2": 7,
      "tier-3": 7,
      "tier-4": 5,
      "tier-5": 3,
      "tier-6-mega": 100,
    }

    const maxPlayers = TIER_PLAYER_LIMITS[tier] || 7

    const { data: waitingMatches } = await supabase
      .from("arcade_matches")
      .select("id, arcade_match_players(count)")
      .eq("game_id", gameId)
      .eq("tier", tier)
      .eq("status", "waiting")
      .order("created_at", { ascending: true })

    let matchId: string | null = null

    // Find first match that has space
    if (waitingMatches && waitingMatches.length > 0) {
      for (const match of waitingMatches) {
        const playerCount = match.arcade_match_players[0]?.count || 0
        if (playerCount < maxPlayers) {
          matchId = match.id
          console.log("[v0] Found existing match with space:", matchId, "Players:", playerCount)
          break
        }
      }
    }

    if (!matchId) {
      const escrowWallet = process.env.NEXT_PUBLIC_PI_WALLET_ADDRESS || process.env.PI_WALLET_ADDRESS || ""

      console.log("[v0] Creating new match for", maxPlayers, "players")

      const { data: newMatch, error: matchError } = await supabase
        .from("arcade_matches")
        .insert({
          game_id: gameId,
          tier,
          entry_fee: entryFee,
          prize_pool: entryFee * maxPlayers,
          max_players: maxPlayers,
          status: "waiting",
          escrow_wallet: escrowWallet,
        })
        .select()
        .single()

      if (matchError) {
        console.error("[v0] Match creation error:", matchError)
        throw matchError
      }
      matchId = newMatch.id
    }

    const { error: playerError } = await supabase.from("arcade_match_players").insert({
      match_id: matchId,
      user_id: userId,
      wallet_address: walletAddress,
      payment_id: paymentId,
      payment_status: "completed",
      game_status: "waiting",
    })

    if (playerError) {
      console.error("[v0] Player add error:", playerError)
      throw playerError
    }

    const { count: currentPlayers } = await supabase
      .from("arcade_match_players")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchId)

    const matchStarting = currentPlayers === maxPlayers

    if (matchStarting) {
      console.log("[v0] Match is full! Starting match:", matchId)
      await supabase
        .from("arcade_matches")
        .update({ status: "active", started_at: new Date().toISOString() })
        .eq("id", matchId)
    } else {
      console.log("[v0] Match waiting. Players:", currentPlayers, "/", maxPlayers)
    }

    return NextResponse.json({ matchId, matchStarting, currentPlayers })
  } catch (error) {
    console.error("[v0] Create match error:", error)
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
  }
}
