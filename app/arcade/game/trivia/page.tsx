"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function TriviaGameRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log("[v0] IQ Arena game route - Redirecting to play page")

    // Get all the parameters from the tournament flow
    const entryId = searchParams.get("entryId")
    const tier = searchParams.get("tier")
    const userId = searchParams.get("userId")
    const isPWA = searchParams.get("pwa") === "true"

    console.log("[v0] IQ Arena redirect params:", {
      entryId,
      tier,
      userId,
      isPWA,
      allParams: Object.fromEntries(searchParams.entries()),
    })

    // Default to general-knowledge category
    const category = "general-knowledge"

    // Build the redirect URL with all parameters
    const params = new URLSearchParams()
    if (entryId) params.set("entryId", entryId)
    if (tier) params.set("tier", tier)
    if (userId) params.set("userId", userId)
    if (isPWA) params.set("pwa", "true")

    const redirectUrl = `/arcade/trivia/play/${category}?${params.toString()}`

    console.log("[v0] IQ Arena redirecting to:", redirectUrl)
    router.replace(redirectUrl)
  }, [router, searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto mb-4" />
        <div className="text-xl font-bold">Starting IQ Arena Tournament...</div>
        <div className="text-sm text-gray-400 mt-2">Preparing your game session</div>
      </div>
    </div>
  )
}
