"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TriviaTournamentPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to category selection page
    router.replace("/arcade/trivia")
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="text-white">Loading categories...</p>
    </div>
  )
}
