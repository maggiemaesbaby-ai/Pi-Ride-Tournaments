import { type NextRequest, NextResponse } from "next/server"
import { requestRide } from "@/lib/rideshare-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pickup, destination, service, provider } = body

    console.log("[v0] API Route - Ride request received:", { pickup, destination, service, provider })

    // Validate required fields
    if (!pickup || !destination || !service || !provider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Request ride from provider
    const rideResponse = await requestRide({
      pickup,
      destination,
      service,
      provider,
    })

    console.log("[v0] API Route - Ride requested successfully:", rideResponse)

    return NextResponse.json({
      success: true,
      rideId: rideResponse.id || "demo-ride-id",
      provider,
      service,
      status: "confirmed",
      message: "Ride requested successfully",
    })
  } catch (error: any) {
    console.error("[v0] API Route - Ride request error:", error)

    return NextResponse.json(
      {
        error: error.message || "Failed to request ride",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
