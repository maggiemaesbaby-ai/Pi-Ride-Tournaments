import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, gameId, tierId } = body

    console.log("[v0] TEST MODE API - Request received")
    console.log("[v0] TEST MODE API - Body:", JSON.stringify(body, null, 2))
    console.log("[v0] TEST MODE API - Extracted values:", { userId, gameId, tierId })
    console.log("[v0] TEST MODE API - Value types:", {
      userIdType: typeof userId,
      gameIdType: typeof gameId,
      tierIdType: typeof tierId,
    })

    if (!userId || !gameId || !tierId) {
      console.error("[v0] TEST MODE API - Missing required fields:", { userId, gameId, tierId })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Only allow test mode for Newbie tier
    if (tierId !== "tier-0") {
      console.error("[v0] TEST MODE API - Invalid tier for test mode:", tierId)
      return NextResponse.json({ error: "Test mode only available for Newbie tier" }, { status: 403 })
    }

    const supabase = await createClient()

    // Get tier configuration
    console.log("[v0] TEST MODE API - Querying tier config:", { gameId, tierId })

    const { data: tierConfig, error: tierError } = await supabase
      .from("game_tiers")
      .select("*")
      .eq("game_id", gameId)
      .eq("tier_id", tierId)
      .single()

    console.log("[v0] TEST MODE API - Tier query result:", {
      tierConfig,
      tierError,
      hasData: !!tierConfig,
    })

    if (tierError || !tierConfig) {
      console.error("[v0] TEST MODE API - Tier configuration not found")
      console.error("[v0] TEST MODE API - Query params were:", { gameId, tierId })
      console.error("[v0] TEST MODE API - Supabase error:", tierError)
      return NextResponse.json({ error: "Invalid tournament tier" }, { status: 404 })
    }

    console.log("[v0] TEST MODE API - Tier config found:", tierConfig.tier_name)

    // Check if user already has an active entry in this tier
    const { data: existingEntry } = await supabase
      .from("match_participants")
      .select(`
        match_id,
        entry_id,
        tournament_matches!inner(status, game_id, tier_id)
      `)
      .eq("user_id", userId)
      .eq("tournament_matches.game_id", gameId)
      .eq("tournament_matches.tier_id", tierId)
      .in("tournament_matches.status", ["filling", "active"])
      .maybeSingle()

    if (existingEntry) {
      console.log("[v0] TEST MODE API - Player already in this tier:", tierId)
      return NextResponse.json(
        {
          error: `You already have an active entry in ${tierConfig.tier_name}`,
          entryId: existingEntry.entry_id,
          matchId: existingEntry.match_id,
        },
        { status: 400 },
      )
    }

    // Create tournament entry (no payment for test mode)
    const { data: tournamentEntry, error: entryError } = await supabase
      .from("tournament_entries")
      .insert({
        user_id: userId,
        game_id: gameId,
        tier_id: tierId,
        entry_fee: tierConfig.entry_fee,
        pi_payment_id: `TEST_${Date.now()}`, // Test payment ID
        status: "pending",
      })
      .select()
      .single()

    if (entryError) {
      console.error("[v0] TEST MODE API - Failed to create entry:", entryError)
      throw new Error("Failed to create tournament entry")
    }

    console.log("[v0] TEST MODE API - Tournament entry created:", tournamentEntry.id)

    // Find or create open match for this tier
    const { data: openMatch } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("game_id", gameId)
      .eq("tier_id", tierId)
      .eq("status", "filling")
      .lt("current_players", tierConfig.players_per_match)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    let matchId: string
    let matchNumber: number

    if (openMatch) {
      // Join existing match
      matchId = openMatch.id
      matchNumber = openMatch.match_number

      const newPlayerCount = openMatch.current_players + 1
      const newPrizePool = (
        Number.parseFloat(openMatch.prize_pool) + Number.parseFloat(tierConfig.entry_fee.toString())
      ).toFixed(2)
      const matchFull = newPlayerCount >= tierConfig.players_per_match

      // Calculate app wallet amount
      const payoutStructure = tierConfig.payout_structure as Record<string, number>
      const totalPayouts = Object.values(payoutStructure).reduce((sum, amount) => sum + amount, 0)
      const appWalletAmount = Number.parseFloat(newPrizePool) - totalPayouts

      await supabase
        .from("tournament_matches")
        .update({
          current_players: newPlayerCount,
          prize_pool: newPrizePool,
          app_wallet_amount: appWalletAmount,
          status: matchFull ? "active" : "filling",
          started_at: matchFull ? new Date().toISOString() : null,
        })
        .eq("id", matchId)

      console.log(
        "[v0] TEST MODE API - Joined match #" + matchNumber,
        `(${newPlayerCount}/${tierConfig.players_per_match})`,
      )
    } else {
      // Get next match number
      const { data: lastMatch } = await supabase
        .from("tournament_matches")
        .select("match_number")
        .eq("game_id", gameId)
        .eq("tier_id", tierId)
        .order("match_number", { ascending: false })
        .limit(1)
        .maybeSingle()

      matchNumber = (lastMatch?.match_number || 0) + 1

      // Calculate initial app wallet amount
      const payoutStructure = tierConfig.payout_structure as Record<string, number>
      const totalPayouts = Object.values(payoutStructure).reduce((sum, amount) => sum + amount, 0)
      const appWalletAmount = Number.parseFloat(tierConfig.entry_fee.toString()) - totalPayouts

      // Create new match
      const { data: newMatch, error: matchError } = await supabase
        .from("tournament_matches")
        .insert({
          game_id: gameId,
          tier_id: tierId,
          match_number: matchNumber,
          max_players: tierConfig.players_per_match,
          current_players: 1,
          prize_pool: tierConfig.entry_fee,
          app_wallet_amount: appWalletAmount,
          status: "filling",
        })
        .select()
        .single()

      if (matchError) {
        console.error("[v0] TEST MODE API - Failed to create match:", matchError)
        throw new Error("Failed to create match")
      }

      matchId = newMatch.id
      console.log("[v0] TEST MODE API - Created new match #" + matchNumber, `(1/${tierConfig.players_per_match})`)
    }

    // Add participant to match
    await supabase.from("match_participants").insert({
      match_id: matchId,
      entry_id: tournamentEntry.id,
      user_id: userId,
    })

    console.log("[v0] TEST MODE API - Successfully joined tournament")

    return NextResponse.json({
      success: true,
      entryId: tournamentEntry.id,
      matchId,
      matchNumber,
      tierName: tierConfig.tier_name,
      message: "Test entry created - No Pi payment required!",
    })
  } catch (error: any) {
    console.error("[v0] TEST MODE API - Error:", error)
    return NextResponse.json({ error: error.message || "Failed to join tournament" }, { status: 500 })
  }
}
