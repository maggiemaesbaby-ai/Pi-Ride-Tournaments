import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { userId, amount, piPaymentId } = await request.json()

    console.log("[API] Add funds request:", { userId, amount, piPaymentId })

    if (!userId || !amount || !piPaymentId) {
      console.error("[API] Add funds - missing fields:", { userId, amount, piPaymentId })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user balance exists
    const { data: existing, error: selectError } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (selectError) {
      console.error("[API] Add funds - select error:", selectError)
      throw selectError
    }

    let newBalance: number

    if (existing) {
      // Update existing balance
      const updatedBalance = Number(existing.balance) + Number(amount)
      console.log("[API] Updating balance from", existing.balance, "to", updatedBalance)

      const { error: updateError } = await supabase
        .from("user_balances")
        .update({ balance: updatedBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)

      if (updateError) {
        console.error("[API] Add funds - update error:", updateError)
        throw updateError
      }
      newBalance = updatedBalance
    } else {
      // Create new balance record
      console.log("[API] Creating new balance record with", amount)
      const { error: insertError } = await supabase.from("user_balances").insert({ user_id: userId, balance: amount })

      if (insertError) {
        console.error("[API] Add funds - insert error:", insertError)
        throw insertError
      }
      newBalance = Number(amount)
    }

    // Record transaction
    const { error: txError } = await supabase.from("balance_transactions").insert({
      user_id: userId,
      amount: Number(amount),
      type: "deposit",
      pi_payment_id: piPaymentId,
      description: "Added funds to dashboard",
    })

    if (txError) {
      console.error("[API] Add funds - transaction error:", txError)
      // Don't fail if transaction log fails
    }

    console.log("[API] Add funds successful - new balance:", newBalance)

    return NextResponse.json({
      success: true,
      newBalance,
    })
  } catch (error: any) {
    console.error("[API] Add funds error:", error)
    return NextResponse.json({ error: error.message || "Failed to add funds" }, { status: 500 })
  }
}
