import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export async function GET(req: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated()
    return NextResponse.json({ authenticated: isAuthenticated })
  } catch (error) {
    return NextResponse.json({ authenticated: false })
  }
}
