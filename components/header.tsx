"use client"

import { useState, useEffect } from "react"
import { Menu, X, BarChart3, Users, Car, Store, ShoppingBag, Shield, Share2, Download } from "@/lib/icons"
import Link from "next/link"
import Image from "next/image"
import { useCurrency } from "@/contexts/currency-provider"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { Badge } from "@/components/ui/badge"
import { NotificationBell } from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { paymentMode, setPaymentMode } = useCurrency()
  const { user } = usePiWallet()

  const { toast } = useToast()

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch("/api/admin/check-session")
        const data = await response.json()
        setIsAdmin(data.authenticated)
      } catch (error) {
        setIsAdmin(false)
      }
    }

    checkAdminSession()
  }, [])

  const handleShare = async () => {
    const shareData = {
      title: "Pi Ride - Traveling Made Easy",
      text: "Check out Pi Ride: Rides, Rentals, Transit & More – All in Pi!",
      url: window.location.origin,
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData)
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing Pi Ride.",
        })
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            return
          }
          if (error.message.includes("Permission denied")) {
            try {
              await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
              toast({
                title: "Link copied!",
                description: "Share link copied to clipboard.",
              })
            } catch {
              return
            }
            return
          }
        }
        console.error("[v0] Share failed:", error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard.",
        })
      } catch (error) {
        console.error("[v0] Copy failed:", error)
      }
    }
  }

  const handleInstallPrompt = async () => {
    const installUrl = window.location.origin
    const installText = `Install Pi Ride App: ${installUrl}\n\nSteps:\n1. Open this link in your browser\n2. Tap the Share or Menu button\n3. Select "Add to Home Screen"\n4. Tap "Add" to install`

    try {
      await navigator.clipboard.writeText(installText)
      toast({
        title: "Installation Link Copied!",
        description: "Paste this link to share the app or follow the instructions to install on your device.",
        duration: 6000,
      })
    } catch (error) {
      toast({
        title: "Add Pi Ride to Home Screen",
        description: "Tap your browser's menu button and select 'Add to Home Screen' or 'Install App'.",
        duration: 5000,
      })
    }
  }

  return (
    <header className="border-b bg-gradient-to-r from-purple-900/95 via-blue-900/95 to-purple-900/95 sticky top-0 z-50 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/pi-ride-logo.png" alt="Pi Ride" width={40} height={40} className="rounded-lg" />
            <span className="font-bold text-xl">Pi Ride</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Link>
            <Link
              href="/drive-for-pi"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <Car className="w-4 h-4" />
              Drive for Pi
            </Link>
            <Link
              href="/business-dashboard"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <Store className="w-4 h-4" />
              Shop Owners
            </Link>
            <Link
              href="/driver-dashboard"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Driver Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/referrals"
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <Users className="w-4 h-4" />
              Referrals
            </Link>
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-purple-600 font-bold">Administrator</span>
                <Badge className="bg-gradient-to-r from-purple-600 to-amber-600 text-white text-xs">Admin</Badge>
              </Link>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-xl">π</span>
              <span className="text-sm font-semibold text-primary">Pi Payments Only</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-50 dark:from-purple-900 dark:via-blue-900 dark:to-cyan-900">
            <nav className="flex flex-col gap-4">
              <Link
                href="/marketplace"
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag className="w-4 h-4" />
                Marketplace
              </Link>
              <Link
                href="/drive-for-pi"
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Car className="w-4 h-4" />
                Drive for Pi
              </Link>
              <Link
                href="/business-dashboard"
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Store className="w-4 h-4" />
                Shop Owners
              </Link>
              <Link
                href="/driver-dashboard"
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 className="w-4 h-4" />
                Driver Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/referrals"
                className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="w-4 h-4" />
                Referrals
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 text-sm font-medium p-3 bg-gradient-to-r from-purple-600/10 to-amber-600/10 rounded-lg border-2 border-purple-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-600 font-bold">Administrator</span>
                  <Badge className="bg-gradient-to-r from-purple-600 to-amber-600 text-white text-xs ml-auto">
                    Admin
                  </Badge>
                </Link>
              )}
              <Button
                variant="outline"
                onClick={handleInstallPrompt}
                className="gap-2 w-full bg-gradient-to-r from-purple-600/10 to-pink-500/10 border-purple-200"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span className="text-purple-600 font-semibold">Install Pi Ride Icon</span>
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
                <span className="text-xl">π</span>
                <span className="text-sm font-semibold text-primary">Pi Payments Only</span>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
