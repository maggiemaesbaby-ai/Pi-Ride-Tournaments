import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const isAuthenticated = req.cookies.get("admin-authenticated")?.value === "true"

  return NextResponse.json({ authenticated: isAuthenticated })
}
