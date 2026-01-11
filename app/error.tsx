"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset?: () => void
}) {
  useEffect(() => {
    console.error("[v0] ===== APPLICATION ERROR =====")
    console.error("[v0] Error name:", error.name)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)
    console.error("[v0] Error digest:", error.digest)
    console.error("[v0] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)))
    console.error("[v0] ===============================")
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">{error.message || "An unexpected error occurred"}</p>
        {reset && (
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
        )}
        <Button onClick={() => window.location.href = "/"} variant="outline">
          Go to Homepage
        </Button>
      </div>
    </div>
  )
}
