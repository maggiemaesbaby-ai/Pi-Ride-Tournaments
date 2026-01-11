import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      console.error("[APPROVE] Missing paymentId in request")
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 })
    }

    const PI_API_KEY = process.env.PI_API_KEY?.trim()

    if (!PI_API_KEY) {
      console.error("[APPROVE] PI_API_KEY environment variable not set")
      return NextResponse.json({ error: "Server configuration error - API key missing" }, { status: 500 })
    }

    console.log("[APPROVE] Processing approval for payment:", paymentId)

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    console.log("[APPROVE] Pi API response status:", response.status)
    console.log("[APPROVE] Pi API response body:", responseText)

    if (!response.ok) {
      const errorData = JSON.parse(responseText)

      // If payment is already approved, treat it as success
      if (response.status === 400 && errorData.error === "already_approved") {
        console.log("[APPROVE] Payment already approved (treating as success):", paymentId)
        return NextResponse.json({
          success: true,
          payment: errorData.payment,
          alreadyApproved: true,
        })
      }

      console.error("[APPROVE] Pi API returned error:", response.status, responseText)
      return NextResponse.json(
        {
          error: "Payment approval failed",
          details: responseText,
          status: response.status,
        },
        { status: response.status },
      )
    }

    const data = JSON.parse(responseText)
    console.log("[APPROVE] Payment approved successfully:", paymentId)

    return NextResponse.json({ success: true, payment: data })
  } catch (error: any) {
    console.error("[APPROVE] Server error:", error.message)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
