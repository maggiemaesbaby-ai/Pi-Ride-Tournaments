"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export const dynamic = "force-dynamic"

export default function AdminLogin() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to homepage - this route is now disabled
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6">Redirecting...</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  )
}
