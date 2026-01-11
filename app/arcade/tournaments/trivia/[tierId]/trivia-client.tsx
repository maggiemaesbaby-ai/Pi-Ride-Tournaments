"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Coins, Zap } from "@/lib/icons"
import { fetchBalance } from "@/lib/fetch-balance"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { usePWADetection } from "@/hooks/use-pwa-detection"
import { useSWRConfig } from "swr"
import { piSDK } from "@/lib/pi-sdk"

interface TournamentTier {
  id: string
  name: string
  entry: number
  color: string
}

const TOURNAMENT_TIERS: Record<string, TournamentTier> = {
  "tier-0": {
    id: "tier-0",
    name: "Newbie Practice",
    entry: 0.1,
    color: "from-green-400 via-emerald-500 to-teal-500",
  },
  "tier-1": {
    id: "tier-1",
    name: "Rookie Arena",
    entry: 1.0,
    color: "from-orange-400 via-amber-500 to-yellow-500",
  },
  "tier-2": {
    id: "tier-2",
    name: "Silver Circuit",
    entry: 5.0,
    color: "from-slate-400 via-gray-300 to-zinc-400",
  },
  "tier-3": {
    id: "tier-3",
    name: "Gold Championship",
    entry: 10.0,
    color: "from-yellow-300 via-amber-400 to-orange-400",
  },
  "tier-4": {
    id: "tier-4",
    name: "Elite Masters",
    entry: 15.0,
    color: "from-cyan-400 via-blue-500 to-indigo-600",
  },
  "tier-5": {
    id: "tier-5",
    name: "Champion's Duel",
    entry: 20.0,
    color: "from-fuchsia-400 via-purple-500 to-pink-600",
  },
}

interface TriviaClientProps {
  tierId: string
  categoryId?: string
}

export default function TriviaClient({ tierId, categoryId }: TriviaClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, connect, isConnected, isLoading: piWalletLoading } = usePiWallet()
  const { toast } = useToast()
  const { isPWA } = usePWADetection()
  const { mutate } = useSWRConfig()

  const [userBalance, setUserBalance] = useState<number | undefined>(undefined)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [selectedTier, setSelectedTier] = useState<TournamentTier | null>(null)
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [showBalanceConfirmation, setShowBalanceConfirmation] = useState(false)
  const [showPlatformChoice, setShowPlatformChoice] = useState(false)
  const [showPWALink, setShowPWALink] = useState(false)
  const [pwaLinkUrl, setPWALinkUrl] = useState("")
  const [balanceProcessing, setBalanceProcessing] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [chosenPlatform, setChosenPlatform] = useState<"browser" | "pwa" | null>(null)
  const [pwaUserId, setPwaUserId] = useState<string | null>(null)
  const [platformChoiceCompleted, setPlatformChoiceCompleted] = useState<Set<string>>(new Set())
  const isCreatingPayment = useRef(false)

  const isProcessingEntry = useRef(false)

  const currentPaymentId = useRef<string | null>(null)

  console.log("[v0] 🧠 IQ Arena TriviaClient rendered")

  // Initialize tier
  useEffect(() => {
    const tier = TOURNAMENT_TIERS[tierId]
    if (tier) {
      setSelectedTier(tier)
    } else {
      console.error("[v0] Invalid tier ID:", tierId)
      router.push("/arcade")
    }
  }, [tierId, router])

  // Load balance when payment modal opens - EXACT COPY from Asteroids
  useEffect(() => {
    if (!showPaymentMethodModal) return

    const getUserId = () => {
      if (typeof window !== "undefined") {
        const storedId = localStorage.getItem("pwa_user_id")
        if (storedId) return storedId
      }
      if (user?.uid) return user.uid
      if (pwaUserId) return pwaUserId
      return null
    }

    const userId = getUserId()
    if (!userId) {
      setLoadingBalance(false)
      setUserBalance(undefined)
      return
    }

    setLoadingBalance(true)
    fetchBalance(userId)
      .then((balance) => {
        console.log("[v0] ✅ Balance loaded:", balance, "π")
        setUserBalance(balance)
      })
      .catch((error) => {
        console.error("[v0] ❌ Balance error:", error)
        setUserBalance(0)
      })
      .finally(() => setLoadingBalance(false))
  }, [showPaymentMethodModal, user?.uid, pwaUserId, isPWA])

  // Check for PWA user
  useEffect(() => {
    const pwaParam = searchParams?.get("pwa")
    const isStandalone = typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches

    if (pwaParam === "true" || isStandalone) {
      const userIdFromUrl = searchParams?.get("userId")
      const storedUserId = typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null

      if (userIdFromUrl) {
        setPwaUserId(userIdFromUrl)
        if (typeof window !== "undefined") {
          localStorage.setItem("pwa_user_id", userIdFromUrl)
        }
      } else if (storedUserId) {
        setPwaUserId(storedUserId)
      }
    }
  }, [searchParams])

  // Load completed platform choices from localStorage
  useEffect(() => {
    const completed = localStorage.getItem("platform_choices_completed")
    if (completed) {
      setPlatformChoiceCompleted(new Set(JSON.parse(completed)))
    }
  }, [])

  const handleEnterTournament = async () => {
    console.log("[v0] Enter tournament clicked")

    if (showPaymentMethodModal) {
      console.log("[v0] Payment modal already open, ignoring")
      return
    }

    if (!isPWA && !isConnected) {
      console.log("[v0] Browser mode - need wallet connection")
      await connect()
      return
    }

    setShowPaymentMethodModal(true)
  }

  const handlePayWithPiWallet = async (tier?: TournamentTier) => {
    const tierToUse = tier || selectedTier
    if (!tierToUse) {
      console.error("[v0] IQ Arena - No tier selected for Pi Wallet payment")
      toast({
        title: "Error",
        description: "Please select a tournament tier",
        variant: "destructive",
      })
      return
    }

    const effectiveUserId =
      user?.uid || pwaUserId || (typeof window !== "undefined" ? localStorage.getItem("pwa_user_id") : null)

    if (!effectiveUserId) {
      console.error("[v0] IQ Arena - No user ID found for Pi Wallet payment")
      toast({
        title: "Authentication Required",
        description: "Please connect your Pi Wallet or ensure PWA account is linked",
        variant: "destructive",
      })
      return
    }

    if (isCreatingPayment.current) {
      toast({
        title: "Payment in Progress",
        description: "Please wait for the current payment to complete.",
        variant: "destructive",
      })
      return
    }

    console.log("[v0] IQ Arena - handlePayWithPiWallet called", {
      tier: tierToUse.name,
      amount: tierToUse.entry,
      userId: effectiveUserId,
      isPWA,
      chosenPlatform: chosenPlatform,
    })

    try {
      const paymentData = {
        amount: tierToUse.entry,
        memo: `IQ Arena - ${tierToUse.name}`,
        metadata: {
          service: "arcade",
          gameId: categoryId ? `trivia-${categoryId}` : "trivia",
          tier: tierToUse.id,
          userId: effectiveUserId,
          timestamp: Date.now(),
          platform: chosenPlatform || (isPWA ? "pwa" : "browser"),
        },
      }

      let currentPaymentIdForCallbacks: string | undefined
      let approvalCallbackFired = false

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            approvalCallbackFired = true

            if (currentPaymentIdForCallbacks === paymentId) {
              console.log("[v0] IQ Arena - Approval already processed, skipping")
              return
            }
            currentPaymentIdForCallbacks = paymentId
            currentPaymentId.current = paymentId

            console.log("[v0] IQ Arena - ===== PAYMENT APPROVAL STARTING =====")
            console.log("[v0] IQ Arena - Payment ID:", paymentId)

            console.log("[v0] IQ Arena - Calling server approval endpoint...")
            const response = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            const data = await response.json()
            console.log("[v0] IQ Arena - Server approval response:", {
              ok: response.ok,
              status: response.status,
              data,
            })

            if (!response.ok) {
              console.error("[v0] IQ Arena - Server approval failed:", data)
              toast({
                title: "Payment Approval Failed",
                description: data.error || "Could not approve payment",
                variant: "destructive",
              })
              return
            }

            console.log("[v0] IQ Arena - ===== PAYMENT APPROVED SUCCESSFULLY =====")
          } catch (error) {
            console.error("[v0] IQ Arena - Error in onReadyForServerApproval:", error)
            toast({
              title: "Payment Error",
              description: "Could not process payment approval",
              variant: "destructive",
            })
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            console.log("[v0] IQ Arena - ===== PAYMENT COMPLETION STARTING =====")
            console.log("[v0] IQ Arena - Payment ID:", paymentId)
            console.log("[v0] IQ Arena - Transaction ID:", txid)

            const response = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            const data = await response.json()
            console.log("[v0] IQ Arena - Server completion response:", data)

            if (!response.ok) {
              console.error("[v0] IQ Arena - Server completion failed:", data)
              toast({
                title: "Payment Completion Failed",
                description: data.error || "Could not complete payment",
                variant: "destructive",
              })
              return
            }

            console.log("[v0] IQ Arena - ===== PAYMENT COMPLETED SUCCESSFULLY =====")

            if (data.entryId) {
              setCurrentEntryId(data.entryId)
              console.log("[v0] IQ Arena - Entry ID captured from response:", data.entryId)

              const entryData = {
                entryId: data.entryId,
                gameId: "trivia",
                tierId: tierToUse.id,
                tierName: tierToUse.name,
                categoryId: categoryId || "general-knowledge",
                platform: null,
                played: false,
                userId: effectiveUserId, // Added userId for score submission
              }

              const localStorageEntries = JSON.parse(localStorage.getItem("active_tournament_entries") || "{}")
              localStorageEntries[tierToUse.id] = entryData
              localStorage.setItem("active_tournament_entries", JSON.stringify(localStorageEntries))
              console.log("[v0] IQ Arena - Stored entry in localStorage:", entryData)

              if (isPWA) {
                console.log("[v0] IQ Arena - Storing PWA tournament entry for game page:", entryData)
                localStorage.setItem("pwa_tournament_entry_trivia", JSON.stringify({ ...entryData, platform: "pwa" }))
              }

              toast({
                title: "Payment Successful!",
                description: `You've successfully paid ${tierToUse.entry} π using Pi Wallet.`,
              })

              setShowPaymentMethodModal(false)

              if (!isPWA) {
                console.log("[v0] IQ Arena - Pi Browser - showing platform choice modal")
                setTimeout(() => {
                  setShowPlatformChoice(true)
                }, 500)
              } else {
                console.log("[v0] IQ Arena - PWA mode - navigating to game immediately with entry:", data.entryId)
                setTimeout(() => {
                  router.push(
                    `/arcade/trivia/play/${categoryId || "general-knowledge"}?pwa=true&entryId=${data.entryId}&tier=${tierToUse.id}`,
                  )
                }, 500)
              }
            }
          } catch (error: any) {
            console.error("[v0] IQ Arena - Error in completion:", error)
            toast({
              title: "Completion Error",
              description: error.message || "An error occurred during payment completion",
              variant: "destructive",
            })
          }
        },

        onCancel: () => {
          console.log("[v0] IQ Arena - Payment cancelled by user")
          isCreatingPayment.current = false
          currentPaymentId.current = null
        },

        onError: (error: Error) => {
          console.error("[v0] IQ Arena - Payment error:", error)
          isCreatingPayment.current = false
          currentPaymentId.current = null
          toast({
            title: "Payment Error",
            description: error.message || "An error occurred during payment",
            variant: "destructive",
          })
        },
      }

      console.log("[v0] IQ Arena - Creating Pi payment:", paymentData)
      try {
        isCreatingPayment.current = true
        currentPaymentIdForCallbacks = null
        currentPaymentId.current = null

        piSDK.createPayment(paymentData, paymentCallbacks)
        console.log("[v0] IQ Arena - Payment creation initiated")
      } catch (error) {
        console.error("[v0] IQ Arena - Payment creation failed:", error)
        isCreatingPayment.current = false
        currentPaymentId.current = null
        toast({
          title: "Payment Error",
          description: "Failed to initiate payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[v0] IQ Arena - Error in handlePayWithPiWallet:", error)
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
      isCreatingPayment.current = false
    }
  }

  const handlePaymentMethodSelect = (method: "balance" | "pi") => {
    setShowPaymentMethodModal(false)
    if (method === "balance") {
      setShowBalanceConfirmation(true)
    } else if (method === "pi") {
      handlePayWithPiWallet()
    }
  }

  const handleConfirmBalancePayment = async () => {
    if (isProcessingEntry.current) {
      console.log("[v0] Already processing entry, ignoring")
      return
    }

    isProcessingEntry.current = true
    setBalanceProcessing(true)
    setShowBalanceConfirmation(false)

    try {
      const effectiveUserId = localStorage.getItem("pwa_user_id") || user?.uid

      if (!effectiveUserId) {
        throw new Error("No user ID available")
      }

      console.log("[v0] Creating tournament entry...")
      const response = await fetch("/api/arcade/tournament/join-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: "trivia",
          tierId: selectedTier?.id,
          userId: effectiveUserId,
          entryFee: selectedTier?.entry,
          platform: isPWA ? "pwa" : "browser",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Payment failed")
      }

      const data = await response.json()
      console.log("[v0] Tournament entry created:", data.entryId)

      const entryData = {
        entryId: data.entryId,
        gameId: "trivia",
        tierId: selectedTier?.id,
        tierName: selectedTier?.name,
        categoryId: categoryId || "general-knowledge",
        platform: isPWA ? "pwa" : null,
        played: false,
        userId: effectiveUserId, // Added userId for score submission
      }

      const localStorageEntries = JSON.parse(localStorage.getItem("active_tournament_entries") || "{}")
      localStorageEntries[selectedTier?.id || ""] = entryData
      localStorage.setItem("active_tournament_entries", JSON.stringify(localStorageEntries))
      console.log("[v0] IQ Arena - Stored entry in localStorage:", entryData)

      if (isPWA) {
        localStorage.setItem("pwa_tournament_entry_trivia", JSON.stringify(entryData))
        console.log("[v0] IQ Arena - Stored PWA tournament entry for game page:", entryData)
      }

      setUserBalance(data.newBalance)
      setCurrentEntryId(data.entryId)

      // Revalidate active entries
      mutate("/api/arcade/tournament/active-entries")

      toast({
        title: "Payment Successful!",
        description: "Tournament entry confirmed.",
      })

      if (!isPWA) {
        setTimeout(() => {
          setShowPlatformChoice(true)
        }, 500)
      } else {
        setTimeout(() => {
          router.push(
            `/arcade/trivia/play/${categoryId || "general-knowledge"}?pwa=true&entryId=${data.entryId}&tierId=${selectedTier?.id}`,
          )
        }, 500)
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setBalanceProcessing(false)
      isProcessingEntry.current = false
    }
  }

  const handlePlayInPiBrowser = () => {
    const newCompleted = new Set(platformChoiceCompleted)
    if (currentEntryId) {
      newCompleted.add(currentEntryId)
      localStorage.setItem("platform_choices_completed", JSON.stringify(Array.from(newCompleted)))
      setPlatformChoiceCompleted(newCompleted)

      // Update localStorage entry with platform
      const entriesJson = localStorage.getItem("active_tournament_entries")
      if (entriesJson) {
        const entries = JSON.parse(entriesJson)
        for (const tierId in entries) {
          if (entries[tierId].entryId === currentEntryId) {
            entries[tierId].platform = "browser"
            localStorage.setItem("active_tournament_entries", JSON.stringify(entries))
            break
          }
        }
      }
    }

    setShowPlatformChoice(false)
    router.push(
      `/arcade/trivia/play/${categoryId || "general-knowledge"}?entryId=${currentEntryId}&tierId=${selectedTier?.id}`,
    )
  }

  const handlePlayOnPWA = async () => {
    console.log("[v0] 🎮 IQ Arena - Play on PWA clicked")
    console.log("[v0] Current entry ID:", currentEntryId)

    try {
      const updateResponse = await fetch("/api/arcade/tournament/update-platform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: currentEntryId,
          platform: "pwa",
        }),
      })

      const updateData = await updateResponse.json()
      console.log("[v0] IQ Arena - Platform update response:", updateData)

      if (!updateResponse.ok) {
        console.error("[v0] IQ Arena - Failed to update platform:", updateData.error)
        throw new Error(updateData.error || "Failed to update platform")
      }

      console.log("[v0] ✅ IQ Arena - Entry platform updated to PWA successfully!")
    } catch (error) {
      console.error("[v0] ❌ IQ Arena - Error updating platform:", error)
      toast({
        title: "Error",
        description: "Failed to update tournament platform. Please try again.",
        variant: "destructive",
      })
      return
    }

    const newCompleted = new Set(platformChoiceCompleted)
    if (currentEntryId) {
      newCompleted.add(currentEntryId)
      localStorage.setItem("platform_choices_completed", JSON.stringify(Array.from(newCompleted)))
      setPlatformChoiceCompleted(newCompleted)

      // Update localStorage entry with platform
      const entriesJson = localStorage.getItem("active_tournament_entries")
      if (entriesJson) {
        const entries = JSON.parse(entriesJson)
        for (const tierId in entries) {
          if (entries[tierId].entryId === currentEntryId) {
            entries[tierId].platform = "pwa"
            localStorage.setItem("active_tournament_entries", JSON.stringify(entries))
            localStorage.setItem("pwa_tournament_entry_trivia", JSON.stringify({ ...entries[tierId], platform: "pwa" }))
            break
          }
        }
      }
    }

    const effectiveUserId = localStorage.getItem("pwa_user_id") || user?.uid
    const effectiveUsername = localStorage.getItem("pwa_username") || user?.username
    const baseUrl = window.location.origin
    const pwaUrl = `${baseUrl}/arcade/trivia/play/${categoryId || "general-knowledge"}?pwa=true&entryId=${currentEntryId}&userId=${effectiveUserId}&username=${effectiveUsername}&tierId=${selectedTier?.id}`

    navigator.clipboard.writeText(pwaUrl)
    toast({
      title: "Link Copied!",
      description: "PWA link copied to clipboard",
    })

    setPWALinkUrl(pwaUrl)
    setShowPlatformChoice(false)
    setTimeout(() => setShowPWALink(true), 100)
  }

  if (!selectedTier) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl">Loading Tournament...</div>
        </div>
      </div>
    )
  }

  const buttonText = !isPWA && !isConnected ? "Connect Wallet" : "Enter Arena!"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={() => router.push("/arcade/trivia")} variant="ghost" size="icon" className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold text-cyan-400">{selectedTier.name}</h1>
        </div>

        {/* Tournament Card */}
        <Card className={`bg-gradient-to-br ${selectedTier.color} border-4 border-white/30 mb-6`}>
          <CardContent className="p-8 text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">🧠 Ready to Test Your IQ?</h2>
            <div className="space-y-2 text-white/90 text-lg mb-6">
              <div className="text-xl font-semibold">18 Questions • 2 Minutes</div>
              <div>Timed event - Fastest time breaks all ties!</div>
              <div className="text-2xl font-bold mt-4">Entry Fee: {selectedTier.entry} π</div>
            </div>
            <Button
              onClick={handleEnterTournament}
              className="bg-white text-purple-900 hover:bg-white/90 font-bold px-12 py-6 text-xl"
              size="lg"
            >
              {buttonText} <Zap className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Modal - EXACT COPY from Asteroids */}
      {showPaymentMethodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">Choose Payment Method</h2>

              {loadingBalance ? (
                <div className="mb-6 text-center">Loading balance...</div>
              ) : userBalance !== undefined ? (
                <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-center text-white">
                  <div className="text-sm font-medium opacity-80">Your Balance</div>
                  <div className="text-3xl font-bold">{userBalance.toFixed(2)} π</div>
                </div>
              ) : null}

              <div className="space-y-4">
                {userBalance !== undefined && (
                  <Button
                    onClick={() => handlePaymentMethodSelect("balance")}
                    className="w-full justify-center gap-2"
                    disabled={userBalance < selectedTier.entry}
                  >
                    <Coins className="h-5 w-5" />
                    Pay with Pi Balance
                  </Button>
                )}

                {!isPWA && (
                  <Button
                    onClick={() => handlePaymentMethodSelect("pi")}
                    className="w-full justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    Pay with Pi Wallet
                  </Button>
                )}
              </div>

              <Button onClick={() => setShowPaymentMethodModal(false)} variant="outline" className="w-full mt-4">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Balance Confirmation Modal - EXACT COPY from Asteroids */}
      {showBalanceConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">Confirm Balance Payment</h2>
              <p className="text-center mb-6">
                Are you sure you want to pay <span className="font-bold">{selectedTier.entry} π</span> using your
                balance for the {selectedTier.name} tournament?
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button onClick={() => setShowBalanceConfirmation(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleConfirmBalancePayment} disabled={balanceProcessing}>
                  {balanceProcessing ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Choice Modal - EXACT COPY from Asteroids */}
      {showPlatformChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">How do you want to play?</h2>
              <div className="space-y-4">
                <Button onClick={handlePlayInPiBrowser} className="w-full">
                  Play in Pi Browser
                </Button>
                <Button onClick={handlePlayOnPWA} className="w-full bg-purple-600 hover:bg-purple-700">
                  Play on PWA
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PWA Link Modal - EXACT COPY from Asteroids */}
      {showPWALink && pwaLinkUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h2 className="mb-4 text-center text-2xl font-bold">PWA Link Copied!</h2>
              <div className="mb-4 text-center text-sm">Open this link in the Pi Browser PWA to play:</div>
              <div className="mb-6 break-all rounded bg-gray-100 p-3 text-xs">{pwaLinkUrl}</div>
              <Button onClick={() => setShowPWALink(false)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
