import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { piUserId, amount } = await req.json()

    if (!piUserId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get driver wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from("driver_wallet_balances")
      .select("*")
      .eq("driver_pi_user_id", piUserId)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Driver wallet not found" }, { status: 404 })
    }

    if (wallet.available_balance < amount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${wallet.available_balance}π` },
        { status: 400 },
      )
    }

    // Deduct from driver wallet
    const newBalance = Number(wallet.available_balance) - Number(amount)

    const { error: updateError } = await supabase
      .from("driver_wallet_balances")
      .update({
        available_balance: newBalance,
        total_cashed_out: Number(wallet.total_cashed_out) + Number(amount),
        updated_at: new Date().toISOString(),
      })
      .eq("driver_pi_user_id", piUserId)

    if (updateError) {
      console.error("[Driver Cashout] Error updating wallet:", updateError)
      return NextResponse.json({ error: "Failed to process cashout" }, { status: 500 })
    }

    // Deduct from drive pot total balance (not locked, as it was already released)
    const { data: drivePot } = await supabase
      .from("drive_pot_wallet")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single()

    if (drivePot) {
      const newPotBalance = Number(drivePot.total_balance) - Number(amount)

      await supabase
        .from("drive_pot_wallet")
        .update({
          total_balance: newPotBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "00000000-0000-0000-0000-000000000001")

      // Log transaction
      await supabase.from("drive_pot_transactions").insert({
        transaction_type: "admin_cashout",
        amount: Number(amount),
        driver_pi_user_id: piUserId,
        description: "Driver cashed out to Pi wallet",
        balance_before: drivePot.total_balance,
        balance_after: newPotBalance,
        locked_before: drivePot.locked_balance,
        locked_after: drivePot.locked_balance,
      })
    }

    console.log(`[Driver Cashout] ${piUserId} cashed out ${amount}π. New balance: ${newBalance}π`)

    return NextResponse.json({
      success: true,
      newBalance,
      amount,
    })
  } catch (error: any) {
    console.error("[Driver Cashout] Error:", error)
    return NextResponse.json({ error: error.message || "Cashout failed" }, { status: 500 })
  }
}

// GET driver wallet balance
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const piUserId = searchParams.get("piUserId")

    if (!piUserId) {
      return NextResponse.json({ error: "Missing piUserId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: wallet, error } = await supabase
      .from("driver_wallet_balances")
      .select("*")
      .eq("driver_pi_user_id", piUserId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[Driver Wallet] Error:", error)
      return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
    }

    if (!wallet) {
      // Create wallet if doesn't exist
      const { data: newWallet } = await supabase
        .from("driver_wallet_balances")
        .insert({
          driver_pi_user_id: piUserId,
          available_balance: 0,
          lifetime_earnings: 0,
          total_cashed_out: 0,
        })
        .select()
        .single()

      return NextResponse.json({ wallet: newWallet || { available_balance: 0, lifetime_earnings: 0 } })
    }

    return NextResponse.json({ wallet })
  } catch (error: any) {
    console.error("[Driver Wallet] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
