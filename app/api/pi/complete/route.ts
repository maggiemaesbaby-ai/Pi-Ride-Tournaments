import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json()

    if (!paymentId || !txid) {
      console.error("[COMPLETE] Missing required fields - paymentId:", !!paymentId, "txid:", !!txid)
      return NextResponse.json({ error: "Both paymentId and txid are required" }, { status: 400 })
    }

    const PI_API_KEY = process.env.PI_API_KEY?.trim()

    if (!PI_API_KEY) {
      console.error("[COMPLETE] PI_API_KEY environment variable not set")
      return NextResponse.json({ error: "Server configuration error - API key missing" }, { status: 500 })
    }

    console.log("[COMPLETE] Processing completion for payment:", paymentId)
    console.log("[COMPLETE] Transaction ID:", txid)
    console.log("[COMPLETE] Using API key (first 10 chars):", PI_API_KEY.substring(0, 10) + "...")

    // Per official Pi Platform API documentation:
    // Authorization: Key <your_server_api_key>
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ txid }),
    })

    const responseText = await response.text()
    console.log("[COMPLETE] Pi API response status:", response.status)
    console.log("[COMPLETE] Pi API response body:", responseText)

    if (!response.ok) {
      console.error("[COMPLETE] Pi API returned error:", response.status, responseText)
      return NextResponse.json(
        {
          error: "Payment completion failed",
          details: responseText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const data = JSON.parse(responseText)
    console.log("[COMPLETE] Payment completed successfully:", paymentId)
    console.log("[COMPLETE] Payment metadata:", data.metadata)

    let entryId = null
    try {
      const supabase = await createClient()

      // Save payment to database
      const { error: upsertError } = await supabase.from("pi_payments").upsert(
        {
          payment_id: paymentId,
          transaction_id: txid,
          amount: data.amount || 0,
          status: "completed",
          user_id: data.user_uid || null,
          metadata: data.metadata || {},
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "payment_id",
        },
      )

      if (upsertError) {
        console.error("[COMPLETE] Failed to save payment to database:", upsertError)
      } else {
        console.log("[COMPLETE] Payment saved to database:", paymentId)
      }

      // Create tournament entry if metadata contains tournament info
      if (data.metadata?.gameId && data.metadata?.tier && data.metadata?.userId) {
        console.log("[COMPLETE] Creating tournament entry with metadata:", data.metadata)

        const { data: tournamentEntry, error: entryError } = await supabase
          .from("tournament_entries")
          .insert({
            user_id: data.metadata.userId,
            game_id: data.metadata.gameId,
            tier_id: data.metadata.tier,
            entry_fee: data.amount,
            status: "active",
            score: null,
            platform: data.metadata.platform || "browser",
          })
          .select()
          .single()

        if (entryError) {
          console.error("[COMPLETE] Failed to create tournament entry:", entryError)
        } else {
          entryId = tournamentEntry.id
          console.log("[COMPLETE] Tournament entry created:", entryId, "platform:", tournamentEntry.platform)

          // Add to pot wallet
          const { data: potWallet } = await supabase
            .from("app_pot_wallet")
            .select("*")
            .eq("id", "00000000-0000-0000-0000-000000000001")
            .single()

          if (potWallet) {
            const newPotBalance = Number(potWallet.total_balance) + Number(data.amount)

            await supabase
              .from("app_pot_wallet")
              .update({
                total_balance: newPotBalance,
                last_updated: new Date().toISOString(),
              })
              .eq("id", "00000000-0000-0000-0000-000000000001")

            await supabase.from("pot_transactions").insert({
              type: "entry_fee",
              amount: data.amount,
              balance_before: potWallet.total_balance,
              balance_after: newPotBalance,
              locked_before: potWallet.locked_balance,
              locked_after: potWallet.locked_balance,
              description: `Pi Wallet entry fee: ${data.metadata.gameId} - ${data.metadata.tier}`,
              user_id: data.metadata.userId,
            })

            console.log("[COMPLETE] Added entry fee to pot wallet:", data.amount)
          }
        }
      }
    } catch (dbError) {
      console.error("[COMPLETE] Database error:", dbError)
      // Continue - payment verification is more critical than DB storage
    }
    // </CHANGE>

    return NextResponse.json({
      success: true,
      payment: data,
      entryId: entryId, // Return entryId so frontend can show platform choice
    })
  } catch (error: any) {
    console.error("[COMPLETE] Server error:", error.message)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
