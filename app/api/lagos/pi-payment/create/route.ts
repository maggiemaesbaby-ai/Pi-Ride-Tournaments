import { type NextRequest, NextResponse } from "next/server"

// Create Pi payment for Lagos fees
export async function POST(req: NextRequest) {
  try {
    const { feeType, piUserId } = await req.json()

    if (!feeType || !piUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let amount: number
    let memo: string

    switch (feeType) {
      case "app_signup":
        amount = 150.0 // $150 USD worth of Pi
        memo = "Pi Ride Lagos - Driver App Signup Fee"
        break
      case "yearly_license":
        amount = 30.0 // $30 USD worth of Pi
        memo = "Pi Ride Lagos - Yearly License Fee"
        break
      default:
        return NextResponse.json({ error: "Invalid fee type" }, { status: 400 })
    }

    // Get USD to Pi conversion rate
    const piRate = await getUSDtoPiRate()
    const amountInPi = amount / piRate

    // Create payment identifier
    const paymentId = `lagos-${feeType}-${piUserId}-${Date.now()}`

    return NextResponse.json({
      success: true,
      paymentId,
      amount: amountInPi,
      memo,
      metadata: {
        feeType,
        piUserId,
        usdAmount: amount,
        piRate,
      },
    })
  } catch (error: any) {
    console.error("[Lagos Pi Payment] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Get current USD to Pi conversion rate
async function getUSDtoPiRate(): Promise<number> {
  // In production, fetch from Pi Network price API or exchange
  // For now, return a placeholder rate
  // Example: 1 Pi = $0.50 USD, so to get $150, you need 300 Pi
  return 0.5 // $0.50 per Pi
}
