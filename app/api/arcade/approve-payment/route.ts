import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json()

    console.log("[v0] Arcade payment approval:", paymentId)

    const PI_API_KEY = process.env.PI_API_KEY?.trim()

    if (!PI_API_KEY) {
      console.error("[v0] PI_API_KEY environment variable not set")
      return NextResponse.json({ error: "Server configuration error - API key missing" }, { status: 500 })
    }

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()
    console.log("[v0] Pi API response:", response.status, responseText)

    if (!response.ok) {
      return NextResponse.json({ error: "Payment approval failed", details: responseText }, { status: response.status })
    }

    const data = JSON.parse(responseText)

    // Match creation happens in background or via polling
    console.log("[v0] Payment approved successfully, metadata:", data.metadata)

    return NextResponse.json({ success: true, payment: data })
  } catch (error: any) {
    console.error("[v0] Arcade payment approval error:", error)
    return NextResponse.json({ error: error.message || "Payment approval failed" }, { status: 500 })
  }
}
