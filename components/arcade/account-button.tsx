"use client"

import { useState, useEffect } from "react"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PlayerDashboard } from "./player-dashboard"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function AccountButton() {
  const [showDashboard, setShowDashboard] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    try {
      // Check if wallet is connected (from Pi SDK or localStorage)
      const walletAddress = localStorage.getItem("piWalletAddress")

      if (!walletAddress) {
        setLoading(false)
        return
      }

      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("arcade_users")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("[v0] Error loading user:", error)
      }

      setUser(data)
    } catch (err) {
      console.error("[v0] Error loading user:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative rounded-full border-2 border-cyan-500/50" disabled>
        <User className="h-5 w-5 text-cyan-400" />
      </Button>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full border-2 border-cyan-500 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all"
        onClick={() => setShowDashboard(true)}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url || "/placeholder.svg"}
            alt={user.username}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-cyan-400" />
        )}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
      </Button>

      <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-gradient-to-br from-purple-900/95 via-black/95 to-cyan-900/95 border-2 border-cyan-500">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-cyan-400">Player Dashboard</DialogTitle>
          </DialogHeader>
          <PlayerDashboard user={user} onUpdate={loadUser} />
        </DialogContent>
      </Dialog>
    </>
  )
}
