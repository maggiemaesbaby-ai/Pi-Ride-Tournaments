import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { userId, amount } = await req.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: "userId and amount are required" }, { status: 400 })
    }

    console.log(`[v0] Adding test funds: ${amount}π to user: ${userId}`)

    const supabase = await createClient()

    // Check if user already has a balance
    const { data: existing } = await supabase.from("user_balances").select("balance").eq("user_id", userId).single()

    if (existing) {
      // Update existing balance
      const newBalance = Number.parseFloat(existing.balance) + Number.parseFloat(amount)
      const { error } = await supabase.from("user_balances").update({ balance: newBalance }).eq("user_id", userId)

      if (error) throw error

      console.log(`[v0] Updated balance to ${newBalance}π for user: ${userId}`)
      return NextResponse.json({ success: true, balance: newBalance })
    } else {
      // Create new balance record
      const { error } = await supabase.from("user_balances").insert({ user_id: userId, balance: amount })

      if (error) throw error

      console.log(`[v0] Created new balance ${amount}π for user: ${userId}`)
      return NextResponse.json({ success: true, balance: amount })
    }
  } catch (error) {
    console.error("[v0] Error adding test funds:", error)
    return NextResponse.json({ error: "Failed to add test funds" }, { status: 500 })
  }
}
