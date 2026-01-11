import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const body = await request.json()
    const { userId, gameId, tier, tierId, paymentId, txid, entryFee, platform } = body
    const tierIdToUse = tier || tierId

    console.log("[v0] join-wallet API called:", { userId, gameId, tierIdToUse, paymentId, txid, platform })

    // Validate required fields
    if (!userId || !gameId || !tierIdToUse || !paymentId || !txid) {
      console.error("[v0] Missing required fields:", { userId, gameId, tierIdToUse, paymentId, txid })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Step 1: Verify payment with Pi Network
    console.log("[v0] Verifying payment with Pi Network...")
    const piVerifyResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid }),
    })

    const piVerifyData = await piVerifyResponse.json()
    console.log("[v0] Pi Network verification response:", piVerifyData)

    if (!piVerifyResponse.ok) {
      console.error("[v0] Pi Network verification failed:", piVerifyData)
      throw new Error("Payment verification with Pi Network failed")
    }

    // Step 2: Store payment in database
    console.log("[v0] Storing payment in database...")
    const { error: paymentError } = await supabase.from("pi_payments").upsert(
      {
        payment_id: paymentId,
        user_id: userId,
        amount: entryFee || 0,
        status: "completed",
        transaction_id: txid,
        created_at: new Date().toISOString(),
      },
      {
        onConflict: "payment_id",
      },
    )

    if (paymentError) {
      console.error("[v0] Error storing payment:", paymentError)
      throw new Error("Failed to store payment")
    }

    // Step 3: Create tournament entry
    console.log("[v0] Creating tournament entry...")
    const entryId = `${gameId}-${tierIdToUse}-${userId}-${Date.now()}`

    const { error: entryError } = await supabase.from("tournament_entries").insert({
      entry_id: entryId,
      user_id: userId,
      game_id: gameId,
      tier_id: tierIdToUse,
      payment_id: paymentId,
      entry_fee: entryFee || 0,
      status: "active",
      platform: platform || "browser",
      created_at: new Date().toISOString(),
    })

    if (entryError) {
      console.error("[v0] Error creating entry:", entryError)
      throw new Error("Failed to create tournament entry")
    }

    console.log("[v0] ✅ Tournament entry created:", entryId)

    return NextResponse.json({
      success: true,
      entry: {
        id: entryId,
      },
      entryId,
      paymentVerified: true,
      message: "Payment verified and tournament joined successfully",
    })
  } catch (error: any) {
    console.error("[v0] join-wallet API error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to process payment and join tournament",
      },
      { status: 500 },
    )
  }
}
