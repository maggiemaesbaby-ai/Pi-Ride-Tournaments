import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("admin-authenticated")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Admin logout error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
