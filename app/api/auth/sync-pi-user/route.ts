import { type NextRequest, NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createServiceRoleClient()
    } catch (error: any) {
      console.error("[API] Failed to create service role client:", error.message)
      return NextResponse.json(
        {
          error: "Database configuration error. Please check Vercel environment variables and redeploy.",
          details: error.message,
        },
        { status: 503 },
      )
    }

    const { piUid, piUsername, walletAddress } = await request.json()

    if (!piUid || !walletAddress) {
      return NextResponse.json({ error: "Pi UID and wallet address are required" }, { status: 400 })
    }

    console.log("[API] Syncing Pi user to arcade_users:", { piUid, piUsername, walletAddress })

    const { data: existingUser } = await supabase
      .from("arcade_users")
      .select("id, pi_uid")
      .eq("wallet_address", walletAddress)
      .single()

    if (existingUser && existingUser.pi_uid === piUid) {
      console.log("[API] ✅ Pi user already synced:", piUid)
      return NextResponse.json({ success: true, piUid, piUsername, alreadySynced: true })
    }

    const { error } = await supabase.from("arcade_users").upsert(
      {
        wallet_address: walletAddress,
        pi_uid: piUid,
        pi_username: piUsername || `user_${piUid.slice(0, 8)}`,
        username: piUsername || `user_${piUid.slice(0, 8)}`,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "wallet_address",
      },
    )

    if (error) {
      console.error("[API] Error syncing Pi user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[API] ✅ Pi user synced successfully:", piUid)

    return NextResponse.json({ success: true, piUid, piUsername })
  } catch (error: any) {
    console.error("[API] ❌ Error in sync-pi-user:", error)
    return NextResponse.json({ error: error.message || "Failed to sync Pi user" }, { status: 500 })
  }
}
