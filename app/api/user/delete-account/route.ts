import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Mark user as deleted (soft delete) - keep transaction records
    const { error } = await supabase
      .from("users")
      .update({
        deleted_at: new Date().toISOString(),
        email: null, // Remove PII
        phone: null,
        full_name: "[DELETED USER]",
      })
      .eq("pi_user_id", userId)

    if (error) {
      console.error("[v0] Failed to delete user:", error)
      throw new Error("Failed to delete account")
    }

    console.log("[v0] User account deleted:", userId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Delete account error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 })
  }
}
