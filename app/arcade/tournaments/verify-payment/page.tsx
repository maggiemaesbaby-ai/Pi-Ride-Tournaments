"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function VerifyPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"checking" | "verified" | "failed">("checking")
  const [message, setMessage] = useState("Verifying your payment...")
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    const paymentId = searchParams.get("paymentId")
    const gameId = searchParams.get("gameId")
    const tierId = searchParams.get("tierId")

    console.log("[v0] VERIFY PAYMENT PAGE - Payment ID:", paymentId)
    console.log("[v0] VERIFY PAYMENT PAGE - Game ID:", gameId)
    console.log("[v0] VERIFY PAYMENT PAGE - Tier ID:", tierId)

    if (!paymentId || !gameId || !tierId) {
      setStatus("failed")
      setMessage("Missing payment information")
      return
    }

    const storedIntent = localStorage.getItem("piPaymentIntent")
    let userId: string | null = null
    let entryFee = 0

    if (storedIntent) {
      try {
        const intent = JSON.parse(storedIntent)
        userId = intent.userId
        entryFee = intent.amount
        console.log("[v0] VERIFY PAYMENT PAGE - Found payment intent:", intent)
      } catch (e) {
        console.error("[v0] VERIFY PAYMENT PAGE - Error parsing payment intent:", e)
      }
    }

    // Fallback to pwa_user_id if no intent
    if (!userId) {
      userId = localStorage.getItem("pwa_user_id")
      console.log("[v0] VERIFY PAYMENT PAGE - Using pwa_user_id:", userId)
    }

    if (!userId) {
      setStatus("failed")
      setMessage("User ID not found. Please try again.")
      return
    }

    const checkPayment = async () => {
      try {
        console.log("[v0] VERIFY PAYMENT PAGE - Checking payment attempt:", attempts + 1)

        const checkResponse = await fetch(`/api/pi/check-payment?paymentId=${paymentId}`)
        const checkData = await checkResponse.json()
        console.log("[v0] VERIFY PAYMENT PAGE - Check response:", checkData)

        if (checkData.completed && checkData.txid) {
          console.log("[v0] VERIFY PAYMENT PAGE - Payment completed! Creating entry...")
          setMessage("Payment verified! Creating your tournament entry...")

          const joinResponse = await fetch("/api/arcade/tournament/join-wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              gameId,
              tierId,
              paymentId,
              txid: checkData.txid,
              entryFee,
              platform: window.matchMedia("(display-mode: standalone)").matches ? "pwa" : "browser",
            }),
          })

          const joinData = await joinResponse.json()
          console.log("[v0] VERIFY PAYMENT PAGE - Join response:", joinData)

          if (joinData.success && joinData.entryId) {
            setStatus("verified")
            setMessage("Payment verified and entry created!")

            localStorage.removeItem("piPaymentIntent")
            localStorage.removeItem("piPaymentId")

            setTimeout(() => {
              router.push(
                `/arcade/tournaments/${gameId}?entryId=${joinData.entryId}&tierId=${tierId}&showPlatformChoice=true`,
              )
            }, 1500)
          } else {
            throw new Error(joinData.error || "Failed to create entry")
          }
        } else if (checkData.status?.developer_approved === false) {
          setStatus("failed")
          setMessage("Payment was cancelled or failed. Please try again.")
        } else {
          // Payment still pending, continue checking
          setAttempts((prev) => prev + 1)
        }
      } catch (error) {
        console.error("[v0] VERIFY PAYMENT PAGE - Error:", error)
        setAttempts((prev) => prev + 1)
      }
    }

    // Check immediately
    checkPayment()

    // Then check every 3 seconds for up to 2 minutes (40 attempts)
    const interval = setInterval(() => {
      if (attempts < 40) {
        checkPayment()
      } else {
        clearInterval(interval)
        setStatus("failed")
        setMessage("Payment verification timeout. Please try again or contact support.")
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [searchParams, router, attempts])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border-2 border-purple-500 rounded-lg p-8 text-center space-y-6">
        {status === "checking" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Verifying Payment</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400">Attempt {attempts + 1} of 40</p>
            <p className="text-xs text-gray-500">This usually takes 5-15 seconds...</p>
          </>
        )}

        {status === "verified" && (
          <>
            <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-400">Success!</h2>
            <p className="text-gray-300">{message}</p>
            <p className="text-sm text-gray-400">Redirecting...</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-400">Verification Failed</h2>
            <p className="text-gray-300">{message}</p>
            <Button
              onClick={() => router.push("/arcade")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Return to Arcade
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
