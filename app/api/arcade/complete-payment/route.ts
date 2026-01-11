import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json()

    console.log("[v0] Arcade payment completion:", paymentId)

    const PI_API_KEY = process.env.PI_API_KEY?.trim()

    if (!PI_API_KEY) {
      console.error("[v0] PI_API_KEY environment variable not set")
      return NextResponse.json({ error: "Server configuration error - API key missing" }, { status: 500 })
    }

    // Complete payment with Pi Network
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    console.log("[v0] Pi API complete response:", response.status, responseText)

    if (!response.ok) {
      return NextResponse.json(
        { error: "Payment completion failed", details: responseText },
        { status: response.status },
      )
    }

    const data = JSON.parse(responseText)

    // Extract user and game info from payment metadata
    const userId = data.metadata?.userId
    const gameId = data.metadata?.gameId
    const tier = data.metadata?.tier

    console.log("[v0] Payment completed, creating match for:", { userId, gameId, tier })

    if (userId && gameId && tier) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Find or create match
      const { data: existingMatches } = await supabase
        .from("arcade_matches")
        .select("*")
        .eq("game_id", gameId)
        .eq("tier", tier)
        .eq("status", "waiting")
        .order("created_at", { ascending: true })

      let matchId: string

      if (existingMatches && existingMatches.length > 0) {
        // Join existing match
        const match = existingMatches[0]
        matchId = match.id

        const currentPlayers = match.players || []
        if (!currentPlayers.includes(userId)) {
          await supabase
            .from("arcade_matches")
            .update({
              players: [...currentPlayers, userId],
              updated_at: new Date().toISOString(),
            })
            .eq("id", matchId)

          console.log("[v0] User added to existing match:", matchId)
        }
      } else {
        // Create new match
        const { data: newMatch, error } = await supabase
          .from("arcade_matches")
          .insert({
            game_id: gameId,
            tier: tier,
            players: [userId],
            status: "waiting",
          })
          .select()
          .single()

        if (error) {
          console.error("[v0] Error creating match:", error)
          return NextResponse.json({ error: "Failed to create match" }, { status: 500 })
        }

        matchId = newMatch.id
        console.log("[v0] New match created:", matchId)
      }

      return NextResponse.json({ success: true, payment: data, matchId })
    }

    return NextResponse.json({ success: true, payment: data })
  } catch (error: any) {
    console.error("[v0] Arcade payment completion error:", error)
    return NextResponse.json({ error: error.message || "Payment completion failed" }, { status: 500 })
  }
}
