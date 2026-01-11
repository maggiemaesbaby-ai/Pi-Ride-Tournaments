import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createA2UPayment, submitA2UPayment, completeA2UPayment } from "@/lib/pi-a2u"

export async function POST(request: NextRequest) {
  console.log("[API] ========== CASHOUT API CALLED ==========")

  try {
    const supabase = await createClient()

    const { userId, amount, piUid } = await request.json()

    console.log("[API] A2U Cashout request:", { userId, amount, piUid })
    console.log("[API] Environment check - PI_API_KEY exists:", !!process.env.PI_API_KEY)
    console.log("[API] Environment check - PI_WALLET_PRIVATE_SEED exists:", !!process.env.PI_WALLET_PRIVATE_SEED)

    if (!userId || !amount) {
      console.log("[API] ❌ Cashout failed - Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (amount < 1) {
      console.log("[API] ❌ Cashout failed - Amount below minimum")
      return NextResponse.json({ error: "Minimum cashout is 1π" }, { status: 400 })
    }

    console.log("[API] Fetching user balance from database...")
    const { data: balanceData, error: balanceError } = await supabase
      .from("user_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (balanceError) {
      console.error("[API] ❌ Balance fetch error:", balanceError)
      throw balanceError
    }

    const currentBalance = Number(balanceData?.balance || 0)
    console.log("[API] Current balance:", currentBalance)

    if (currentBalance < amount) {
      console.log("[API] ❌ Cashout failed - Insufficient balance")
      return NextResponse.json({ error: `Insufficient balance. Available: ${currentBalance}π` }, { status: 400 })
    }

    let userPiUid = piUid

    if (!userPiUid) {
      console.log("[API] No pi_uid in request, fetching from database...")
      const { data: userData, error: userError } = await supabase
        .from("arcade_users")
        .select("pi_username, pi_uid")
        .eq("wallet_address", userId)
        .single()

      if (userError) {
        console.error("[API] ❌ User fetch error:", userError)
      }

      userPiUid = userData?.pi_uid

      if (!userPiUid) {
        console.log("[API] ❌ Cashout failed - No Pi UID found")
        return NextResponse.json(
          { error: "Pi account not linked. Please connect your Pi wallet first." },
          { status: 400 },
        )
      }
    }

    console.log("[API] ✅ Using Pi UID:", userPiUid)
    console.log("[API] Creating A2U payment for Pi UID:", userPiUid)

    let paymentId: string
    try {
      console.log("[API] Calling createA2UPayment...")
      paymentId = await createA2UPayment({
        amount: Number(amount),
        memo: `Cashout from Pi Ride Arcade - ${amount}π`,
        metadata: {
          type: "arcade_cashout",
          userId: userId,
          amount: amount,
        },
        uid: userPiUid, // Use the pi_uid we obtained
      })
      console.log("[API] ✅ A2U payment created successfully! Payment ID:", paymentId)
    } catch (error: any) {
      console.error("[API] ❌ Failed to create A2U payment:", error.message)
      console.error("[API] Full error:", error)
      return NextResponse.json({ error: `Payment creation failed: ${error.message}` }, { status: 400 })
    }

    let txid: string
    try {
      console.log("[API] Submitting A2U payment to Pi blockchain...")
      txid = await submitA2UPayment(paymentId)
      console.log("[API] ✅ A2U payment submitted to blockchain! TXID:", txid)
    } catch (error: any) {
      console.error("[API] ❌ Failed to submit A2U payment:", error.message)
      console.error("[API] Full error:", error)
      return NextResponse.json({ error: `Payment submission failed: ${error.message}` }, { status: 400 })
    }

    let completedPayment: any
    try {
      console.log("[API] Completing A2U payment...")
      completedPayment = await completeA2UPayment(paymentId, txid)
      console.log("[API] ✅ A2U payment completed successfully!")
      console.log("[API] Completed payment data:", completedPayment)
    } catch (error: any) {
      console.error("[API] ❌ Failed to complete A2U payment:", error.message)
      console.error("[API] Full error:", error)
      return NextResponse.json({ error: `Payment completion failed: ${error.message}` }, { status: 400 })
    }

    console.log("[API] Checking for duplicate transactions...")
    const { data: existingTx } = await supabase
      .from("balance_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("description", `Cashout ${amount}π to Pi wallet (Payment ID: ${paymentId})`)
      .maybeSingle()

    if (existingTx) {
      console.log("[API] ⚠️ Duplicate cashout prevented for payment:", paymentId)
      return NextResponse.json({ error: "This payment has already been processed" }, { status: 400 })
    }

    console.log("[API] Updating user balance...")
    const newBalance = currentBalance - Number(amount)
    const { error: updateError } = await supabase
      .from("user_balances")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", userId)

    if (updateError) {
      console.error("[API] ❌ Cashout - balance update error:", updateError)
      throw updateError
    }
    console.log("[API] ✅ Balance updated from", currentBalance, "to", newBalance)

    console.log("[API] Recording transaction...")
    const { error: txError } = await supabase.from("balance_transactions").insert({
      user_id: userId,
      amount: Number(amount),
      type: "withdrawal",
      description: `Cashout ${amount}π to Pi wallet (Payment ID: ${paymentId})`,
      status: "completed",
    })

    if (txError) {
      console.error("[API] ⚠️ Cashout - transaction recording error:", txError)
    } else {
      console.log("[API] ✅ Transaction recorded successfully")
    }

    console.log("[API] ========== CASHOUT SUCCESSFUL ==========")
    console.log("[API] Payment ID:", paymentId)
    console.log("[API] TXID:", txid)
    console.log("[API] New balance:", newBalance)

    return NextResponse.json({
      success: true,
      message: `Successfully cashed out ${amount}π to your Pi wallet`,
      newBalance,
      piPaymentId: paymentId,
      txid: txid,
    })
  } catch (error: any) {
    console.error("[API] ========== CASHOUT ERROR ==========")
    console.error("[API] Error name:", error.name)
    console.error("[API] Error message:", error.message)
    console.error("[API] Error stack:", error.stack)
    return NextResponse.json({ error: error.message || "Failed to process cashout" }, { status: 500 })
  }
}
