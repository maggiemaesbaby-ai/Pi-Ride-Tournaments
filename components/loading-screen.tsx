"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="relative">
          <Image
            src="/images/pi-ride-logo.png"
            alt="Pi Ride Logo"
            width={120}
            height={120}
            className="rounded-3xl animate-pulse"
          />
        </div>

        {/* Tagline with gradient */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent animate-pulse">
            Traveling Made Easy – All in Pi
          </h2>
          <p className="text-muted-foreground">Loading your journey...</p>
        </div>

        {/* Loading spinner */}
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  )
}
