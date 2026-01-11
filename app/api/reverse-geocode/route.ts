import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")

    if (!lat || !lng) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 })
    }

    console.log(`[v0] Reverse geocoding: ${lat}, ${lng}`)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          "User-Agent": "PiRide/1.0",
        },
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Nominatim API error:", response.status, errorText)
      return NextResponse.json({ error: "Geocoding failed" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Nominatim response:", data)

    if (data.display_name) {
      // Format the address nicely
      const address = data.display_name
      console.log("[v0] Address resolved:", address)
      return NextResponse.json({ address })
    }

    console.log("[v0] No address found for coordinates")
    return NextResponse.json({ error: "No address found" }, { status: 404 })
  } catch (error) {
    console.error("[v0] Reverse geocoding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
