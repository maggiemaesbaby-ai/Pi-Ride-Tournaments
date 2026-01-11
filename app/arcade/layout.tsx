import type React from "react"

import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <PWAInstallPrompt />
    </>
  )
}
