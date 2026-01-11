"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Share2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isLinked, setIsLinked] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only show prompt if user is linked
      const userId = localStorage.getItem("pwa_user_id")
      if (userId) {
        setIsLinked(true)
        setShowPrompt(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)

    const userId = localStorage.getItem("pwa_user_id")
    if (userId) {
      setIsLinked(true)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)

      let instructions = ""
      if (isIOS) {
        instructions =
          "1. Tap the Share button (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' to confirm\n\nYour account data will be saved!"
      } else if (isAndroid) {
        instructions =
          "1. Tap the menu (three dots)\n2. Select 'Add to Home Screen'\n3. Tap 'Add' to confirm\n\nYour account data will be saved!"
      } else {
        instructions = "Use your browser's menu to add this page to your home screen. Your account data will be saved!"
      }

      toast({
        title: "Add to Home Screen",
        description: instructions,
        duration: 8000,
      })
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      toast({
        title: "App installed!",
        description: "Pi Arcade has been added to your home screen with your account linked.",
      })
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleShare = async () => {
    const userId = localStorage.getItem("pwa_user_id")
    const username = localStorage.getItem("pwa_username")

    let shareUrl = window.location.origin
    if (userId && username) {
      shareUrl = `${window.location.origin}/pwa?userId=${userId}&username=${encodeURIComponent(username)}`
    }

    const shareData = {
      title: "Pi Arcade Legends",
      text: isLinked
        ? "Play Pi Arcade with your linked account!"
        : "Check out Pi Arcade Legends: Compete in retro arcade tournaments!",
      url: shareUrl,
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData)
        toast({
          title: "Shared successfully!",
          description: isLinked ? "Your personal PWA link has been shared." : "Thanks for sharing Pi Arcade.",
        })
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("[v0] Share failed:", error)
          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
          toast({
            title: "Link copied!",
            description: "Share link has been copied to clipboard.",
          })
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast({
          title: "Link copied!",
          description: "Share link has been copied to clipboard.",
        })
      } catch (error) {
        console.error("[v0] Copy failed:", error)
      }
    }
  }

  if (!showPrompt || !isLinked) return null

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 shadow-lg z-50 border-2 border-purple-500/30 bg-black/90 backdrop-blur">
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 p-1 hover:bg-purple-500/20 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          🎮
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-white">Add to Home Screen</h3>
          <p className="text-sm text-gray-300">Save with your account linked for instant access</p>
        </div>
      </div>

      <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
        <p className="text-xs text-green-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Your account is linked and will be saved
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleInstall}
          className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
        >
          <Download className="w-4 h-4" />
          Add to Home Screen
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="gap-2 border-purple-500/30 hover:bg-purple-500/10 bg-transparent"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
