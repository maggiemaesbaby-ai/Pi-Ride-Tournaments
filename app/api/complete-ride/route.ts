import { type NextRequest, NextResponse } from "next/server"
import { driverDB } from "@/lib/driver-db"

export async function POST(request: NextRequest) {
  try {
    const { requestId, rating, driverId } = await request.json()

    if (!requestId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = driverDB.completeRide(requestId, rating)

    if (!result.success) {
      return NextResponse.json({ error: "Failed to complete ride" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      driverEarnings: result.driverEarnings,
      needsDirectPayment: result.needsDirectPayment,
      upfrontFeeOwed: result.remainingFeeOwed,
    })
  } catch (error) {
    console.error("Error completing ride:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
