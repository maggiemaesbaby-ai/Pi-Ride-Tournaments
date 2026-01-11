"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Users, Coins } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { usePiWallet } from "@/hooks/use-pi-wallet"

interface TournamentTier {
  id: string
  name: string
  players: number
  entry: number
  payouts: Record<string, number>
  icon: string
  color: string
  border: string
}

interface Category {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

const TRIVIA_CATEGORIES: Record<string, Category> = {
  "general-knowledge": {
    id: "general-knowledge",
    name: "General Knowledge",
    icon: "🌍",
    color: "from-blue-500 to-cyan-600",
    description: "Test your knowledge across all topics",
  },
  science: {
    id: "science",
    name: "Science & Nature",
    icon: "🔬",
    color: "from-green-500 to-emerald-600",
    description: "Biology, Chemistry, Physics & more",
  },
  history: {
    id: "history",
    name: "History",
    icon: "📜",
    color: "from-amber-500 to-orange-600",
    description: "Ancient civilizations to modern times",
  },
  entertainment: {
    id: "entertainment",
    name: "Entertainment",
    icon: "🎬",
    color: "from-purple-500 to-pink-600",
    description: "Movies, TV, Music & Pop Culture",
  },
  sports: {
    id: "sports",
    name: "Sports",
    icon: "⚽",
    color: "from-red-500 to-rose-600",
    description: "From football to Formula 1",
  },
  geography: {
    id: "geography",
    name: "Geography",
    icon: "🗺️",
    color: "from-teal-500 to-cyan-600",
    description: "Countries, capitals & landmarks",
  },
}

const TOURNAMENT_TIERS: TournamentTier[] = [
  {
    id: "tier-0",
    name: "Newbie Practice",
    players: 10,
    entry: 0.1,
    payouts: { 1: 0.3, 2: 0.2, 3: 0.1, 4: 0.1, 5: 0.1 },
    icon: "🌱",
    color: "from-green-400 via-emerald-500 to-teal-500",
    border: "border-green-300",
  },
  {
    id: "tier-1",
    name: "Rookie Arena",
    players: 7,
    entry: 1.0,
    payouts: { 1: 3.0, 2: 2.0, 3: 1.0 },
    icon: "🥉",
    color: "from-orange-400 via-amber-500 to-yellow-500",
    border: "border-orange-400",
  },
  {
    id: "tier-2",
    name: "Silver Circuit",
    players: 7,
    entry: 5.0,
    payouts: { 1: 15.0, 2: 10.0, 3: 5.0 },
    icon: "🥈",
    color: "from-slate-400 via-gray-300 to-zinc-400",
    border: "border-gray-300",
  },
  {
    id: "tier-3",
    name: "Gold Championship",
    players: 7,
    entry: 10.0,
    payouts: { 1: 30.0, 2: 20.0, 3: 10.0, 4: 3.0, 5: 2.0 },
    icon: "🥇",
    color: "from-yellow-300 via-amber-400 to-orange-400",
    border: "border-yellow-300",
  },
  {
    id: "tier-4",
    name: "Elite Masters",
    players: 5,
    entry: 15.0,
    payouts: { 1: 30.0, 2: 20.0, 3: 15.0, 4: 5.0 },
    icon: "💎",
    color: "from-cyan-400 via-blue-500 to-indigo-600",
    border: "border-blue-300",
  },
  {
    id: "tier-5",
    name: "Champion's Duel",
    players: 3,
    entry: 20.0,
    payouts: { 1: 45.0, 2: 10.0 },
    icon: "👑",
    color: "from-fuchsia-400 via-purple-500 to-pink-600",
    border: "border-pink-300",
  },
]

export default function TriviaCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const categoryId = params.categoryId as string

  const { user, connect } = usePiWallet()

  const category = TRIVIA_CATEGORIES[categoryId]

  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<TournamentTier | null>(null)
  const [isPWA, setIsPWA] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    const pwaUser = localStorage.getItem("pwa_user_id")
    setIsPWA(!!pwaUser)
  }, [])

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => router.push("/arcade/trivia")}>Back to Categories</Button>
        </div>
      </div>
    )
  }

  const handleJoinTournament = (tier: TournamentTier) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Pi Wallet first",
        variant: "destructive",
      })
      connect()
      return
    }
    setSelectedTier(tier)
    setShowPaymentMethodModal(true)
  }

  const handlePaymentMethodSelect = async (method: "balance" | "pi") => {
    if (!selectedTier || !user) return

    setShowPaymentMethodModal(false)

    if (method === "balance") {
      router.push(`/arcade/tournaments/trivia/${selectedTier.id}?categoryId=${categoryId}&method=balance`)
      return
    }

    console.log("[v0] TRIVIA - Starting Pi Wallet payment", {
      category: categoryId,
      tier: selectedTier.name,
      amount: selectedTier.entry,
      user: user.uid,
    })

    setProcessingPayment(true)

    try {
      const piSDK = (window as any).Pi
      if (!piSDK) {
        throw new Error("Pi SDK not available")
      }

      const paymentData = {
        amount: selectedTier.entry,
        memo: `${category.name} Trivia - ${selectedTier.name} Tier`,
        metadata: {
          service: "arcade",
          gameId: `trivia-${categoryId}`,
          gameName: category.name,
          tier: selectedTier.id,
          tierName: selectedTier.name,
          userId: user.uid,
          userEmail: user.username,
          platform: isPWA ? "pwa" : "browser",
          timestamp: Date.now(),
        },
      }

      let entryIdFromCallback: string | undefined

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[v0] TRIVIA - Payment approval callback", { paymentId })

          try {
            const response = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            const data = await response.json()
            console.log("[v0] TRIVIA - Approval response", data)

            if (!response.ok) {
              throw new Error(data.error || "Payment approval failed")
            }

            const entryResponse = await fetch("/api/arcade/tournament/join-wallet", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: user.uid,
                gameId: `trivia-${categoryId}`,
                tier: selectedTier.id,
                amount: selectedTier.entry,
                paymentId,
                platform: isPWA ? "pwa" : "browser",
              }),
            })

            const entryData = await entryResponse.json()
            console.log("[v0] TRIVIA - Entry response", entryData)

            if (entryResponse.ok && entryData.entry?.id) {
              entryIdFromCallback = entryData.entry.id
            }
          } catch (error: any) {
            console.error("[v0] TRIVIA - Approval error", error)
            toast({
              title: "Payment Approval Failed",
              description: error.message,
              variant: "destructive",
            })
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[v0] TRIVIA - Payment completion callback", { paymentId, txid })

          try {
            const response = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || "Payment completion failed")
            }

            toast({
              title: "Tournament Entry Confirmed!",
              description: `You've joined the ${selectedTier.name} tier tournament!`,
            })

            setProcessingPayment(false)

            if (entryIdFromCallback) {
              router.push(`/arcade/trivia/play/${categoryId}?entryId=${entryIdFromCallback}&tier=${selectedTier.id}`)
            } else {
              router.push("/arcade/dashboard")
            }
          } catch (error: any) {
            console.error("[v0] TRIVIA - Completion error", error)
            toast({
              title: "Payment Completion Failed",
              description: error.message || "An error occurred during payment",
              variant: "destructive",
            })
            setProcessingPayment(false)
          }
        },

        onCancel: (paymentId: string) => {
          console.log("[v0] TRIVIA - Payment cancelled", { paymentId })
          toast({
            title: "Payment Cancelled",
            description: "You cancelled the payment",
          })
          setProcessingPayment(false)
        },

        onError: (error: any, payment: any) => {
          console.error("[v0] TRIVIA - Payment error", { error, payment })
          toast({
            title: "Payment Error",
            description: error.message || "An error occurred during payment",
            variant: "destructive",
          })
          setProcessingPayment(false)
        },
      }

      console.log("[v0] TRIVIA - Creating Pi payment", paymentData)
      const payment = await piSDK.createPayment(paymentData, paymentCallbacks)
      console.log("[v0] TRIVIA - Pi payment created", payment)
    } catch (error: any) {
      console.error("[v0] TRIVIA - Payment creation error", error)
      toast({
        title: "Payment Failed",
        description: error.message || "Could not initiate payment",
        variant: "destructive",
      })
      setProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.push("/arcade/trivia")}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-5xl">{category.icon}</span>
              <h1
                className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]`}
              >
                {category.name}
              </h1>
            </div>
            <p className="text-gray-300 text-lg">{category.description}</p>
            <p className="text-gray-400 text-sm mt-1">Select Your Arena • Connect Wallet to Play</p>
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Choose Your Arena
        </h2>

        <div className="grid gap-6 px-0 sm:grid-cols-1 md:grid-cols-2 max-w-full mx-auto">
          {TOURNAMENT_TIERS.map((tier) => {
            const totalPayout = Object.values(tier.payouts).reduce((a, b) => a + b, 0)

            return (
              <Card
                key={tier.id}
                className={`relative overflow-hidden rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[12px] ${tier.border} animate-border-glow hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_50px_rgba(168,85,247,0.6)]`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${tier.color} animate-rolling-gradient opacity-95`}
                />

                <CardContent className="p-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-6xl animate-float drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
                          {tier.icon}
                        </span>
                        <div>
                          <h3 className="text-4xl font-black text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                            {tier.name}
                          </h3>
                          <div className="flex gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className="bg-black/50 backdrop-blur-sm text-white border-2 border-white/50 text-base py-1 px-3 font-bold"
                            >
                              <Users className="h-4 w-4 mr-1" />
                              {tier.players} Players
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="bg-black/50 backdrop-blur-sm text-white border-2 border-white/50 text-base py-1 px-3 font-bold"
                            >
                              <Coins className="h-4 w-4 mr-1" />
                              {tier.entry}π Entry
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-black/50 backdrop-blur-sm rounded-xl p-5 min-w-[220px] border-4 border-white/40 shadow-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Trophy className="h-5 w-5 text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                        <span className="font-black text-white text-lg">Payouts</span>
                      </div>
                      <div className="space-y-2 text-base">
                        {Object.entries(tier.payouts).map(([place, amount]) => (
                          <div key={place} className="flex justify-between text-white font-bold">
                            <span>#{place}:</span>
                            <span className="font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                              {amount}π
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleJoinTournament(tier)}
                      size="lg"
                      className="bg-white/25 backdrop-blur-sm hover:bg-white/40 text-white font-black text-2xl py-7 px-10 min-w-[200px] border-4 border-white/60 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 hover:ring-8 hover:ring-white/50 hover:scale-105"
                    >
                      Connect Wallet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="mt-8 bg-gradient-to-br from-purple-900/50 to-slate-900/50 border-purple-500/30">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">Tournament Rules</h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <h3 className="font-bold text-white mb-2">⏱️ Time Pressure</h3>
                <p className="text-sm">Answer quickly! Faster correct answers earn more points.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">🎯 Accuracy Matters</h3>
                <p className="text-sm">Wrong answers cost you points. Think before you click!</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">🏆 Automatic Payouts</h3>
                <p className="text-sm">Winners receive Pi automatically when the tournament ends.</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">📊 Leaderboard</h3>
                <p className="text-sm">Track your ranking in real-time during the tournament.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPaymentMethodModal && selectedTier && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-purple-900 rounded-lg p-8 max-w-md w-full border-2 border-purple-500 shadow-2xl">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">Choose Payment Method</h3>
            <div className="text-white text-center mb-6">
              <p className="mb-2">Tournament: {selectedTier.name}</p>
              <p className="mb-1">Category: {category.name}</p>
              <p className="text-3xl font-bold text-yellow-400">{selectedTier.entry} π</p>
            </div>
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4"
                onClick={() => handlePaymentMethodSelect("balance")}
                disabled={processingPayment}
              >
                Pay with Pi Balance
              </Button>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4"
                onClick={() => handlePaymentMethodSelect("pi")}
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : "Pay with Pi Wallet"}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 border-gray-500 text-gray-300 hover:bg-gray-800 bg-transparent"
              onClick={() => setShowPaymentMethodModal(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {processingPayment && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]">
          <div className="bg-gradient-to-br from-purple-900 to-slate-900 rounded-lg p-8 text-center border-2 border-purple-500">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto mb-4" />
            <p className="text-white text-lg font-bold">Processing Payment...</p>
            <p className="text-gray-400 text-sm mt-2">Please complete the payment in Pi Wallet</p>
          </div>
        </div>
      )}
    </div>
  )
}
