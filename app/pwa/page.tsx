"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function PWAEntryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"checking" | "saving" | "success" | "error">("checking")
  const [message, setMessage] = useState("")

  useEffect(() => {
    console.log("[v0] PWA Entry - Page loaded")

    // Get all URL parameters
    const userId = searchParams.get("userId")
    const username = searchParams.get("username")
    const tournamentEntry = searchParams.get("tournamentEntry")
    const gameId = searchParams.get("gameId")

    console.log("[v0] PWA Entry - URL params:", { userId, username, tournamentEntry, gameId })

    if (userId && username) {
      setStatus("saving")
      setMessage("Linking your account...")

      try {
        // Store credentials in localStorage
        localStorage.setItem("pwa_user_id", userId)
        localStorage.setItem("pwa_username", username)

        // Verify storage worked
        const storedUserId = localStorage.getItem("pwa_user_id")
        const storedUsername = localStorage.getItem("pwa_username")

        console.log("[v0] PWA Entry - Stored in localStorage:", { storedUserId, storedUsername })

        if (storedUserId === userId && storedUsername === username) {
          setStatus("success")
          setMessage("Account linked successfully!")

          // Wait 1 second then redirect
          setTimeout(() => {
            if (tournamentEntry && gameId) {
              router.push(`/arcade/tournaments/${gameId}/play?tournamentEntry=${tournamentEntry}`)
            } else if (gameId) {
              router.push(`/arcade/tournaments/${gameId}`)
            } else {
              router.push("/arcade")
            }
          }, 1000)
        } else {
          throw new Error("Storage verification failed")
        }
      } catch (error) {
        console.error("[v0] PWA Entry - Storage error:", error)
        setStatus("error")
        setMessage("Failed to link account. Please try again.")
      }
    } else {
      // No credentials in URL - check if already stored
      const storedUserId = localStorage.getItem("pwa_user_id")

      if (storedUserId) {
        setStatus("success")
        setMessage("Already linked!")
        setTimeout(() => router.push("/arcade"), 500)
      } else {
        setStatus("error")
        setMessage("No account credentials found. Please open this link from Pi Browser.")
      }
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-sm border-purple-500/30 p-8">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Pi Arcade Legends
          </h1>

          {status === "checking" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-gray-300">Checking credentials...</p>
            </div>
          )}

          {status === "saving" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-gray-300">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-400 font-semibold">{message}</p>
              <p className="text-sm text-gray-400">Redirecting...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-400 font-semibold">{message}</p>
              <Button onClick={() => router.push("/arcade")} className="mt-4 bg-purple-600 hover:bg-purple-700">
                Go to Arcade
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
