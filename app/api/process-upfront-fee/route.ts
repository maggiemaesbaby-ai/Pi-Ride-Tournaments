import { type NextRequest, NextResponse } from "next/server"
import { driverDB } from "@/lib/driver-db"

// Handle successful direct upfront fee payment
export async function POST(request: NextRequest) {
  try {
    const { driverId, amountPaid, paymentId } = await request.json()

    if (!driverId || !amountPaid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = driverDB.recordUpfrontFeePayment(driverId, amountPaid)

    if (!success) {
      return NextResponse.json({ error: "Failed to record payment" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Upfront fee paid successfully",
    })
  } catch (error) {
    console.error("Error processing upfront fee:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
