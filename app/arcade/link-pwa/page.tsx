"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LinkPWAPage() {
  const [username, setUsername] = useState("")
  const [pastedLink, setPastedLink] = useState("")
  const [loading, setLoading] = useState(false)
  const [linkedUserId, setLinkedUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if already linked
    const storedUserId = localStorage.getItem("pwa_user_id")
    const storedUsername = localStorage.getItem("pwa_username")
    if (storedUserId && storedUsername) {
      setLinkedUserId(storedUserId)
      setUsername(storedUsername)
    }
  }, [])

  const handlePasteLink = async () => {
    console.log("[v0] 🔗 handlePasteLink called")
    console.log("[v0] 📋 Pasted link:", pastedLink)

    if (!pastedLink.trim()) {
      toast.error("Please paste a link")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] ✂️ Attempting to parse pasted link...")

      // Extract URL parameters from the pasted link
      const url = new URL(pastedLink)
      console.log("[v0] ✅ URL parsed successfully")
      console.log("[v0] 📍 URL pathname:", url.pathname)
      console.log("[v0] 🔍 URL search params:", url.search)

      const userId = url.searchParams.get("userId") || url.searchParams.get("uid")
      const usernameParam = url.searchParams.get("username")
      const tournamentEntry = url.searchParams.get("tournamentEntry") || url.searchParams.get("entryId")
      const gameId = url.searchParams.get("gameId")

      console.log("[v0] 📊 Extracted params from link:", { userId, usernameParam, tournamentEntry, gameId })

      if (userId && usernameParam) {
        console.log("[v0] ✅ Valid parameters found, storing in localStorage...")

        // Store in localStorage
        localStorage.setItem("pwa_user_id", userId)
        localStorage.setItem("pwa_username", usernameParam)

        console.log("[v0] 💾 Stored user info:", {
          userId: localStorage.getItem("pwa_user_id"),
          username: localStorage.getItem("pwa_username"),
        })

        if (tournamentEntry && gameId) {
          console.log("[v0] 🎮 Tournament entry found! Updating platform to PWA...")
          console.log("[v0] 📝 Entry ID:", tournamentEntry)
          console.log("[v0] 🎯 Game ID:", gameId)

          try {
            console.log("[v0] 📡 Sending update-platform request with:", {
              entryId: tournamentEntry,
              platform: "pwa",
            })

            const updateResponse = await fetch("/api/arcade/tournament/update-platform", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                entryId: tournamentEntry,
                platform: "pwa",
              }),
            })

            const updateData = await updateResponse.json()
            console.log("[v0] 📡 Update platform API response status:", updateResponse.status)
            console.log("[v0] 📡 Update platform API response data:", updateData)

            if (updateResponse.ok) {
              console.log("[v0] ✅ Tournament entry platform updated to PWA successfully!")
              console.log("[v0] 🔍 Verifying update - Entry should now have platform='pwa'")

              const entryData = {
                entryId: tournamentEntry,
                gameId: gameId,
                played: false,
              }
              localStorage.setItem("pwa_tournament_entry", JSON.stringify(entryData))
              console.log("[v0] 💾 Tournament entry stored in localStorage:", entryData)
            } else {
              console.error("[v0] ❌ Failed to update entry platform:", updateData.error)
              toast.error(`Failed to update tournament platform: ${updateData.error}`)
            }
          } catch (error) {
            console.error("[v0] ❌ Error updating entry platform:", error)
            toast.error("Failed to update tournament platform")
          }
        } else {
          console.log("[v0] ⚠️ No tournament entry found in link")
        }

        setLinkedUserId(userId)
        setUsername(usernameParam)

        console.log("[v0] ✅ PWA account linked successfully!")
        toast.success("PWA account linked successfully!")

        // Redirect based on what's in the link
        setTimeout(() => {
          if (tournamentEntry && gameId) {
            console.log("[v0] 🎮 Redirecting to game with tournament entry")
            const tier = url.searchParams.get("tier") || "bronze"
            router.push(`/arcade/game/${gameId}?entryId=${tournamentEntry}&tier=${tier}&userId=${userId}&pwa=true`)
          } else if (gameId) {
            console.log("[v0] 🎲 Redirecting to tournament:", `/arcade/tournaments/${gameId}`)
            router.push(`/arcade/tournaments/${gameId}`)
          } else {
            console.log("[v0] 🏠 Redirecting to arcade home")
            router.push("/arcade")
          }
        }, 1000)
      } else {
        console.error("[v0] ❌ Missing required parameters:", { userId, usernameParam })
        toast.error("Invalid link format. Please copy the complete link from Pi Browser.")
      }
    } catch (error) {
      console.error("[v0] ❌ Error parsing pasted link:", error)
      toast.error("Invalid link format. Please paste the complete URL from Pi Browser.")
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!username.trim()) {
      toast.error("Please enter your username")
      return
    }

    setLoading(true)
    try {
      // Fetch user ID from database based on username
      const response = await fetch(`/api/arcade/user/lookup?username=${encodeURIComponent(username)}`)
      const data = await response.json()

      if (data.userId) {
        // Store in localStorage
        localStorage.setItem("pwa_user_id", data.userId)
        localStorage.setItem("pwa_username", username)
        setLinkedUserId(data.userId)

        toast.success("PWA account linked successfully!")

        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push("/arcade/dashboard")
        }, 1000)
      } else {
        toast.error("Username not found. Please check your Pi Browser username.")
      }
    } catch (error) {
      console.error("Error linking PWA account:", error)
      toast.error("Failed to link account. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = () => {
    localStorage.removeItem("pwa_user_id")
    localStorage.removeItem("pwa_username")
    localStorage.removeItem("pwa_tournament_entry")
    setLinkedUserId(null)
    setUsername("")
    toast.success("PWA account unlinked")
  }

  if (linkedUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-sm border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-green-400">✓ PWA Linked</CardTitle>
            <CardDescription className="text-gray-300">Your PWA is linked to your Pi Browser account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="font-semibold text-white">{username}</p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => router.push("/arcade/dashboard")}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => router.push("/arcade")}
                variant="outline"
                className="w-full border-purple-500/50 text-white hover:bg-purple-500/20"
              >
                View Tournaments
              </Button>
              <Button onClick={handleUnlink} variant="destructive" className="w-full">
                Unlink Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-sm border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Link PWA to Pi Browser</CardTitle>
          <CardDescription className="text-gray-300">
            Connect your PWA to access your balance and tournament entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paste" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="paste">Paste Link</TabsTrigger>
              <TabsTrigger value="manual">Enter Username</TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-2">
                <p className="text-cyan-300 font-semibold text-sm">📋 Recommended Method</p>
                <p className="text-gray-300 text-sm">
                  In Pi Browser, after paying for a tournament, click "Play on PWA" and copy the link. Then paste it
                  here.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="pastedLink" className="text-sm font-medium text-white">
                  PWA Link from Pi Browser
                </label>
                <Input
                  id="pastedLink"
                  placeholder="Paste the complete link here..."
                  value={pastedLink}
                  onChange={(e) => setPastedLink(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasteLink()}
                  className="bg-black/40 border-purple-500/50 text-white placeholder:text-gray-500"
                />
              </div>

              <Button
                onClick={handlePasteLink}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                {loading ? "Linking..." : "Link Account with Pasted Link"}
              </Button>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-300 text-xs">
                  💡 The link should start with your domain and contain userId and username parameters
                </p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-white">
                  Pi Browser Username
                </label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLink()}
                  className="bg-black/40 border-purple-500/50 text-white placeholder:text-gray-500"
                />
              </div>

              <Button
                onClick={handleLink}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                {loading ? "Linking..." : "Link Account with Username"}
              </Button>

              <div className="text-sm text-gray-300 space-y-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="font-semibold text-blue-300">How to find your username:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Open Pi Browser</li>
                  <li>Go to Arcade Dashboard</li>
                  <li>Your username is shown at the top</li>
                </ol>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={() => router.push("/arcade")}
            variant="ghost"
            className="w-full mt-4 text-gray-400 hover:text-white"
          >
            ← Back to Arcade
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
