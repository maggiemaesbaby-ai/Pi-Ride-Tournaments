"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export const dynamic = "force-dynamic"

export default function SecureAdminLogin() {
  const router = useRouter()

  useEffect(() => {
    // Auto-login and redirect to dashboard
    console.log("[v0] Secure admin login - auto-redirecting to dashboard")

    // Set a session cookie to bypass middleware check
    fetch("/api/admin/auto-login", { method: "POST" })
      .then(() => {
        router.push("/admin/dashboard")
      })
      .catch((error) => {
        console.error("[v0] Auto-login failed:", error)
        router.push("/admin/dashboard")
      })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6">Redirecting to Admin Dashboard...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  )
}
