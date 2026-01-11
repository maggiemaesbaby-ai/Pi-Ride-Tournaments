import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] Auto-login API called")

  // Create session without password check
  const sessionData = {
    authenticated: true,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  const sessionCookie = Buffer.from(JSON.stringify(sessionData)).toString("base64")

  const response = NextResponse.json({ success: true })
  response.cookies.set("admin_session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 24 * 60 * 60, // 24 hours
  })

  console.log("[v0] Auto-login successful - session created")
  return response
}
