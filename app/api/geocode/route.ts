import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")

    if (!address) {
      return NextResponse.json({ error: "Address parameter is required" }, { status: 400 })
    }

    console.log("[v0] Geocoding address:", address)

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        "User-Agent": "PiRide/1.0",
      },
    })

    if (!response.ok) {
      console.error("[v0] Nominatim API error:", response.status)
      return NextResponse.json({ error: "Geocoding service failed" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Nominatim geocode response:", data)

    if (data && data.length > 0) {
      const result = data[0]
      const lat = Number.parseFloat(result.lat)
      const lng = Number.parseFloat(result.lon)

      console.log("[v0] Coordinates found:", { lat, lng })

      return NextResponse.json({
        success: true,
        coordinates: { lat, lng },
        formattedAddress: result.display_name,
      })
    }

    console.log("[v0] Address not found")
    return NextResponse.json({ success: false, error: "Address not found" }, { status: 404 })
  } catch (error: any) {
    console.error("[v0] Geocoding error:", error)
    return NextResponse.json({ error: error.message || "Geocoding failed" }, { status: 500 })
  }
}
