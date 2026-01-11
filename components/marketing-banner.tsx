"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Share2, Car, Download, Smartphone } from "@/lib/icons"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function MarketingBanner() {
  const shareText = "Try Pi Ride: Traveling Made Easy – All in Pi."
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    return ""
  }
  const { toast } = useToast()
  const [showInstallDialog, setShowInstallDialog] = useState(false)

  const handleShareAndInstall = async () => {
    const shareUrl = getShareUrl()

    console.log("[v0] Share URL:", shareUrl) // Debug log

    // Try native Web Share API first (works on mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Pi Ride - Traveling Made Easy",
          text: shareText,
          url: shareUrl, // This will be the actual site URL
        })

        toast({
          title: "Thanks for sharing!",
          description: "Now tap the share button in your browser to add Pi Ride to your home screen.",
        })

        setTimeout(() => {
          setShowInstallDialog(true)
        }, 1500)

        return
      } catch (error) {
        console.log("[v0] Web Share cancelled or unavailable")
      }
    }

    // Fallback: Copy URL only
    try {
      await navigator.clipboard.writeText(shareUrl) // Only URL, no text
      toast({
        title: "Link copied!",
        description: `${shareUrl} has been copied to your clipboard.`,
      })
      setShowInstallDialog(true)
    } catch (error) {
      console.error("[v0] Copy to clipboard failed:", error)
      toast({
        title: "Share Pi Ride",
        description: `Visit: ${shareUrl}`,
      })
      setShowInstallDialog(true)
    }
  }

  const getDeviceInstructions = () => {
    const shareUrl = getShareUrl()
    const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : ""
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/.test(userAgent)

    if (isIOS) {
      return {
        device: "iPhone/iPad",
        steps: [
          "1. Open Safari browser and go to the link you copied",
          "2. Tap the Share button (⬆) at the bottom of the screen",
          "3. Scroll down and tap 'Add to Home Screen'",
          "4. Tap 'Add' in the top right corner",
          "5. Pi Ride icon will appear on your home screen!",
        ],
      }
    } else if (isAndroid) {
      return {
        device: "Android",
        steps: [
          "1. Open Chrome or your browser and go to the link you copied",
          "2. Tap the three dots menu (⋮) at the top right",
          "3. Select 'Add to Home screen' or 'Install App'",
          "4. Tap 'Add' or 'Install' to confirm",
          "5. Pi Ride icon will appear on your home screen!",
        ],
      }
    } else {
      return {
        device: "Desktop/Other",
        steps: [
          "1. Copy this link and open it on your mobile device:",
          `   ${shareUrl}`,
          "2. Follow the instructions for your device (iPhone or Android)",
          "3. Add Pi Ride to your home screen for quick access",
        ],
      }
    }
  }

  const instructions = getDeviceInstructions()

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-primary p-8 md:p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/abstract-road-pattern.jpg')] bg-cover bg-center" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <Image src="/images/pi-ride-logo.png" alt="Pi Ride Logo" width={80} height={80} className="rounded-2xl" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Car className="w-8 h-8" />
                <h3 className="text-2xl md:text-3xl font-bold">Traveling Made Easy – All in Pi</h3>
              </div>
              <p className="text-white/90 text-lg">Rides, Rentals, Transit & More – Pay with Pi, Book Anywhere.</p>
            </div>
          </div>

          <Button size="lg" variant="secondary" onClick={handleShareAndInstall} className="gap-2 whitespace-nowrap">
            <Share2 className="w-5 h-5" />
            <Download className="w-4 h-4" />
            Share Pi Ride / Install
          </Button>
        </div>
      </div>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Install Pi Ride App
            </DialogTitle>
            <DialogDescription>Add Pi Ride to your home screen for quick and easy access!</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Instructions for {instructions.device}:
              </h4>
              <ol className="space-y-2 text-sm">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">App Link:</p>
              <p className="text-xs text-muted-foreground break-all">{getShareUrl()}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
