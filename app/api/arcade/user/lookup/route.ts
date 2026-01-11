import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    // Look up user by username
    const { data: users, error } = await supabase
      .from("users")
      .select("user_id, username")
      .ilike("username", username)
      .limit(1)

    if (error) {
      console.error("[API] User lookup error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      userId: users[0].user_id,
      username: users[0].username,
    })
  } catch (error: any) {
    console.error("[API] User lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
