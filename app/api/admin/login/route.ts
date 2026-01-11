import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    console.log("[v0] 🔐 ADMIN LOGIN API CALLED")

    const { password } = await req.json()
    console.log("[v0] Received password:", !!password)

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
    console.log("[v0] Env password exists:", !!ADMIN_PASSWORD)
    console.log("[v0] Env password value:", ADMIN_PASSWORD)

    if (!ADMIN_PASSWORD) {
      console.log("[v0] ❌ ADMIN_PASSWORD not configured in environment")
      return NextResponse.json({ success: false, error: "Admin password not configured" }, { status: 500 })
    }

    const passwordMatch = password?.trim() === ADMIN_PASSWORD.trim()
    console.log("[v0] Password match:", passwordMatch)

    if (!passwordMatch) {
      console.log("[v0] ❌ INVALID PASSWORD")
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 })
    }

    console.log("[v0] ✅ PASSWORD CORRECT - LOGIN SUCCESS")

    const response = NextResponse.json({ success: true })
    response.cookies.set("admin-authenticated", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("[v0] Admin login error:", error)
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 })
  }
}
