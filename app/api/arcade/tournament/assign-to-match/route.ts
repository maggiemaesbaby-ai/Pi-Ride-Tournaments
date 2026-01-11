import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { entryId, userId, gameId, tierId, score } = await req.json()

    console.log("[v0] Match assignment request:", { entryId, userId, gameId, tierId, score })

    const supabase = await createClient()

    // Get tier configuration
    const { data: tierConfig, error: tierError } = await supabase
      .from("game_tiers")
      .select("*")
      .eq("game_id", gameId)
      .eq("tier_id", tierId)
      .single()

    if (tierError || !tierConfig) {
      console.error("[v0] Tier config not found")
      return NextResponse.json({ error: "Tier configuration not found" }, { status: 404 })
    }

    const playersPerMatch = tierConfig.players_per_match

    // Get all completed entries for this tier that haven't been assigned to a match yet
    const { data: unassignedEntries, error: entriesError } = await supabase
      .from("tournament_entries")
      .select(`
        id,
        user_id,
        entry_fee,
        game_sessions!inner(score)
      `)
      .eq("game_id", gameId)
      .eq("tier_id", tierId)
      .eq("status", "completed")
      .is("match_id", null)
      .order("created_at", { ascending: true })

    if (entriesError) {
      console.error("[v0] Error fetching unassigned entries:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    console.log(`[v0] Found ${unassignedEntries?.length || 0} unassigned entries for tier ${tierId}`)

    if (!unassignedEntries || unassignedEntries.length === 0) {
      return NextResponse.json({ success: true, message: "Waiting for more players" })
    }

    // Group entries ensuring unique players per match
    const matches: any[] = []
    const usedEntries = new Set<string>()
    let currentMatch: any[] = []
    const userEntriesInCurrentMatch = new Set<string>()

    for (const entry of unassignedEntries) {
      if (usedEntries.has(entry.id)) continue

      // If user already in current match, start new match
      if (userEntriesInCurrentMatch.has(entry.user_id)) {
        if (currentMatch.length >= playersPerMatch) {
          // Current match is full with unique players
          matches.push([...currentMatch])
          currentMatch = []
          userEntriesInCurrentMatch.clear()
        }
        // If current match not full but user exists, add to next match
        continue
      }

      // Add entry to current match
      currentMatch.push(entry)
      userEntriesInCurrentMatch.add(entry.user_id)
      usedEntries.add(entry.id)

      // If match is full, finalize it
      if (currentMatch.length >= playersPerMatch) {
        matches.push([...currentMatch])
        currentMatch = []
        userEntriesInCurrentMatch.clear()
      }
    }

    console.log(`[v0] Formed ${matches.length} complete matches with unique players`)

    // Create matches and assign participants
    for (const matchEntries of matches) {
      // Get next match number
      const { data: lastMatch } = await supabase
        .from("tournament_matches")
        .select("match_number")
        .eq("game_id", gameId)
        .eq("tier_id", tierId)
        .order("match_number", { ascending: false })
        .limit(1)
        .maybeSingle()

      const matchNumber = (lastMatch?.match_number || 0) + 1

      // Calculate prize pool
      const prizePool = matchEntries.reduce((sum: number, e: any) => sum + Number(e.entry_fee), 0)

      const { data: potWallet } = await supabase
        .from("app_pot_wallet")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single()

      if (potWallet) {
        const availableBalance = Number(potWallet.total_balance) - Number(potWallet.locked_balance)
        const neededAmount = prizePool

        console.log("[v0] Pot check - Available:", availableBalance, "Needed:", neededAmount)

        // If pot doesn't have enough, auto-fund it
        if (availableBalance < neededAmount) {
          const fundingNeeded = neededAmount - availableBalance
          console.log("[v0] Pot insufficient! Auto-funding needed:", fundingNeeded)

          // Auto-fund the pot from app wallet
          const newTotalBalance = Number(potWallet.total_balance) + fundingNeeded

          await supabase
            .from("app_pot_wallet")
            .update({
              total_balance: newTotalBalance,
              last_updated: new Date().toISOString(),
            })
            .eq("id", "00000000-0000-0000-0000-000000000001")

          // Log auto-funding transaction
          await supabase.from("pot_transactions").insert({
            type: "auto_fund_from_wallet",
            amount: fundingNeeded,
            balance_before: potWallet.total_balance,
            balance_after: newTotalBalance,
            locked_before: potWallet.locked_balance,
            locked_after: potWallet.locked_balance,
            description: `Auto-funded ${fundingNeeded}π from app wallet for match #${matchNumber}`,
            match_id: null,
          })

          console.log("[v0] Auto-funded", fundingNeeded, "π to pot wallet")

          // Update pot wallet reference for locking
          potWallet.total_balance = newTotalBalance
        }

        // Now lock the funds for the match
        const newLockedBalance = Number(potWallet.locked_balance) + Number(prizePool)

        await supabase
          .from("app_pot_wallet")
          .update({
            locked_balance: newLockedBalance,
            last_updated: new Date().toISOString(),
          })
          .eq("id", "00000000-0000-0000-0000-000000000001")

        await supabase.from("pot_transactions").insert({
          type: "lock_for_match",
          amount: prizePool,
          balance_before: potWallet.total_balance,
          balance_after: potWallet.total_balance,
          locked_before: potWallet.locked_balance,
          locked_after: newLockedBalance,
          description: `Locked for match #${matchNumber}: ${gameId} - ${tierId}`,
          match_id: null,
        })

        console.log("[v0] Locked", prizePool, "π in pot wallet for match:", matchNumber)
      }

      // Create match
      const { data: newMatch, error: matchError } = await supabase
        .from("tournament_matches")
        .insert({
          game_id: gameId,
          tier_id: tierId,
          match_number: matchNumber,
          max_players: playersPerMatch,
          current_players: matchEntries.length,
          prize_pool: prizePool,
          app_wallet_amount: 0, // Updated to 0 as prize pool is now locked in pot wallet
          status: "active",
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (matchError) {
        console.error("[v0] Error creating match:", matchError)
        continue
      }

      console.log(`[v0] Created match #${matchNumber}: ${newMatch.id}`)

      // Assign participants and get their scores
      for (const entry of matchEntries) {
        const score = entry.game_sessions[0]?.score || 0

        await supabase.from("match_participants").insert({
          match_id: newMatch.id,
          entry_id: entry.id,
          user_id: entry.user_id,
          final_score: score,
        })

        // Update entry with match_id
        await supabase.from("tournament_entries").update({ match_id: newMatch.id }).eq("id", entry.id)
      }

      // Mark match as using pot
      if (potWallet) {
        await supabase
          .from("tournament_matches")
          .update({
            uses_pot: true,
            pot_locked_amount: prizePool,
          })
          .eq("id", newMatch.id)

        console.log("[v0] Marked match as using pot:", newMatch.id)
      }

      // Trigger match completion and payout
      try {
        await fetch("/api/arcade/tournament/complete-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: newMatch.id }),
        })
      } catch (completeError) {
        console.error("[v0] Error triggering match completion:", completeError)
      }
    }

    return NextResponse.json({ success: true, matchesCreated: matches.length })
  } catch (error) {
    console.error("[v0] Assign to match error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
