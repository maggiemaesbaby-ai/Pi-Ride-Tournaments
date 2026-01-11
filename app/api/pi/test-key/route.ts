import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const PI_API_KEY = process.env.PI_API_KEY

  if (!PI_API_KEY) {
    return NextResponse.json(
      {
        valid: false,
        error: "PI_API_KEY environment variable not set",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    valid: true,
    keyLength: PI_API_KEY.length,
    keyPrefix: PI_API_KEY.substring(0, 10) + "...",
    keySuffix: "..." + PI_API_KEY.substring(PI_API_KEY.length - 4),
    hint: "If payments fail with 401, ensure this key matches your Pi app's environment (sandbox/production)",
  })
}
