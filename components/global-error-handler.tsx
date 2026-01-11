"use client"

import { useEffect } from "react"

export function GlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("[v0] ===== GLOBAL ERROR EVENT =====")
      console.error("[v0] Error message:", event.message)
      console.error("[v0] Error filename:", event.filename)
      console.error("[v0] Error line:", event.lineno)
      console.error("[v0] Error column:", event.colno)
      console.error("[v0] Error object:", event.error)
      console.error("[v0] Error stack:", event.error?.stack)
      console.error("[v0] ==================================")
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[v0] ===== UNHANDLED PROMISE REJECTION =====")
      console.error("[v0] Reason:", event.reason)
      console.error("[v0] Promise:", event.promise)
      if (event.reason instanceof Error) {
        console.error("[v0] Error name:", event.reason.name)
        console.error("[v0] Error message:", event.reason.message)
        console.error("[v0] Error stack:", event.reason.stack)
      }
      console.error("[v0] ==========================================")
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    console.log("[v0] Global error handlers installed")

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}
