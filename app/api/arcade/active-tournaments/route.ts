import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In production, this would query Supabase for active queues
    // For now, simulate random activity
    const hasActiveTournaments = Math.random() > 0.5

    return NextResponse.json({ hasActiveTournaments })
  } catch (error) {
    console.error("[v0] Active tournaments check error:", error)
    return NextResponse.json({ hasActiveTournaments: false })
  }
}
