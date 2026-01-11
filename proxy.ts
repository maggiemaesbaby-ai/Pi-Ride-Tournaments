import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  // Admin routes are now open - no authentication required
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
