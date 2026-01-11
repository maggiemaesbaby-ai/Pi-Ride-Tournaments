import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")

    console.log("[v0] check-payment API called for paymentId:", paymentId)

    if (!paymentId) {
      return NextResponse.json({ error: "Missing paymentId" }, { status: 400 })
    }

    // Check with Pi Network if payment is complete
    console.log("[v0] Checking payment status with Pi Network API...")
    const piResponse = await fetch(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`,
      },
    })

    if (!piResponse.ok) {
      console.log("[v0] Pi Network API returned non-OK status:", piResponse.status)
      return NextResponse.json({ completed: false })
    }

    const payment = await piResponse.json()
    console.log("[v0] Payment status from Pi Network:", {
      status: payment.status,
      txid: payment.transaction?.txid,
      developer_completed: payment.status?.developer_completed,
    })

    const isCompleted = payment.status?.developer_completed === true
    const txid = payment.transaction?.txid

    return NextResponse.json({
      completed: isCompleted,
      txid: txid,
      status: payment.status,
    })
  } catch (error) {
    console.error("[v0] check-payment API error:", error)
    return NextResponse.json({ completed: false })
  }
}
