"use client"

import { useState } from "react"
import { piSDK } from "@/lib/pi-sdk"
import { useToast } from "@/hooks/use-toast"

export function usePiWallet() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const connect = async () => {
    console.log("[v0] connect() called - current state:", { isConnecting, isConnected })

    if (isConnecting) {
      console.log("[v0] Already connecting, returning early")
      return Promise.resolve()
    }

    if (isConnected) {
      console.log("[v0] Already connected, returning early")
      return Promise.resolve()
    }

    console.log("[v0] Setting isConnecting to true")
    setIsConnecting(true)

    toast({
      title: "Opening Pi authentication...",
      description: "Please approve in the Pi dialog",
    })

    try {
      console.log("[v0] Calling piSDK.authenticate()...")
      const auth = await piSDK.authenticate(["username", "payments"]).catch((err) => {
        console.error("[v0] piSDK.authenticate() threw error:", err)
        throw err
      })
      console.log("[v0] piSDK.authenticate() completed successfully")

      if (auth.accessToken) {
        console.log("[v0] Storing access token for payment operations")
        localStorage.setItem("pi_access_token", auth.accessToken)
      } else {
        console.warn("[v0] No access token received - payments may not work")
      }

      setUser(auth.user)
      setIsConnected(true)

      if (typeof window !== "undefined" && auth.user?.uid) {
        localStorage.setItem("pi_uid", auth.user.uid)
        console.log("[v0] Stored Pi uid in localStorage:", auth.user.uid)

        try {
          const syncResponse = await fetch("/api/auth/sync-pi-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              piUid: auth.user.uid,
              piUsername: auth.user.username,
              walletAddress: auth.user.uid, // Using uid as wallet_address for arcade users
            }),
          })

          if (syncResponse.ok) {
            console.log("[v0] Pi user synced to database successfully")
          } else {
            console.warn("[v0] Failed to sync Pi user to database")
          }
        } catch (syncError) {
          console.error("[v0] Error syncing Pi user to database:", syncError)
        }
      }

      console.log("[v0] Pi wallet connected successfully:", auth.user.uid)

      toast({
        title: "Wallet connected!",
        description: `Welcome ${auth.user.uid}`,
      })

      return Promise.resolve()
    } catch (error: any) {
      console.error("[v0] Pi wallet connection failed:", error)
      console.error("[v0] Error details:", error.message, error.stack)

      let errorTitle = "Connection failed"
      let errorDescription = error.message || "Failed to connect Pi wallet"

      if (error.message?.includes("timed out")) {
        errorTitle = "URL Not Registered"
        errorDescription =
          "This URL is not registered in your Pi app settings. Please add it in Pi Developer Portal (pi://develop.pi)"
        console.error("[v0] TIMEOUT ERROR - This means the current URL is not registered with Pi Network")
        console.error("[v0] Current URL:", typeof window !== "undefined" ? window.location.href : "unknown")
        console.error("[v0] You need to register this URL in Pi Developer Portal at pi://develop.pi")
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        duration: 10000,
      })

      return Promise.reject(error)
    } finally {
      console.log("[v0] Setting isConnecting to false")
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setUser(null)
    localStorage.removeItem("pi_access_token")
    localStorage.removeItem("pi_uid")
    console.log("[v0] Pi wallet disconnected")
  }

  return {
    isConnected,
    isConnecting,
    user,
    connect,
    disconnect,
  }
}
