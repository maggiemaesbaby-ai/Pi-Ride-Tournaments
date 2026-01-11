import { type NextRequest, NextResponse } from "next/server"
import { driverDB } from "@/lib/driver-db"

// Switch driver to deferred payment mode after failed direct payment
export async function POST(request: NextRequest) {
  try {
    const { driverId } = await request.json()

    if (!driverId) {
      return NextResponse.json({ error: "Missing driver ID" }, { status: 400 })
    }

    const success = driverDB.switchToDeferredPayment(driverId)

    if (!success) {
      return NextResponse.json({ error: "Failed to switch to deferred payment" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Switched to deferred payment mode",
    })
  } catch (error) {
    console.error("Error switching to deferred payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
