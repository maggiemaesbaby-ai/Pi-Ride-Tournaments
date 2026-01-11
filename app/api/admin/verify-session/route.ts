import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    console.log("[v0] Verifying admin session...")
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("admin_session")

    console.log("[v0] Session cookie exists:", !!sessionCookie)

    if (!sessionCookie) {
      console.log("[v0] No session cookie found")
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Decode and verify session
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString())
    console.log("[v0] Session data:", sessionData)

    if (sessionData.expires < Date.now()) {
      console.log("[v0] Session expired")
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    console.log("[v0] Session valid")
    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error("[v0] Session verification error:", error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
