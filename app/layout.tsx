import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { PiSDKInit } from "@/components/pi-sdk-init"
import { GlobalErrorHandler } from "@/components/global-error-handler"
import { CurrencyProvider } from "@/contexts/currency-provider" // Fixed back to correct path
import { Footer } from "@/components/footer"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pi Ride - Traveling Made Easy – All in Pi",
  description: "Traveling Made Easy – All in Pi. Rides, Rentals, Transit & More – Pay with Pi, Book Anywhere.",
  generator: "Pi Ride",
  manifest: "/manifest.json",
  other: {
    "impact-site-verification": "a52738d3-8914-4c63-a97c-48de5677985d",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pi Ride",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#8b5cf6",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalErrorHandler />
        <CurrencyProvider>
          <PiSDKInit />
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
          <Toaster />
          <PWAInstallPrompt />
          <SpeedInsights />
        </CurrencyProvider>
      </body>
    </html>
  )
}
