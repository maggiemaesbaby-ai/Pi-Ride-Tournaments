"use client"

import { Header } from "@/components/header"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  Car,
  MapPin,
  Clock,
  Share2,
  Bell,
  Trophy,
  ArrowUpFromLine,
  ArrowDownToLine,
} from "@/lib/icons"
import { useEffect, useState } from "react"
import { MarketplaceDB, type Order } from "@/lib/marketplace-db"
import { useToast } from "@/hooks/use-toast"
import { WaitlistDashboard } from "@/components/waitlist-dashboard"
import { TournamentHistory } from "@/components/tournament-history"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { piSDK } from "@/lib/pi-sdk"

interface Ride {
  id: string
  date: string
  from: string
  to: string
  distance: string
  cost: number
  status: string
  driverName?: string
}

export default function DashboardPage() {
  const { user, connect, isConnected } = usePiWallet()
  const [orders, setOrders] = useState<Order[]>([])
  const [rides, setRides] = useState<Ride[]>([])
  const [productTitles, setProductTitles] = useState<Record<string, string>>({})
  const [hasWaitlistNotifications, setHasWaitlistNotifications] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("orders")

  const [walletBalance, setWalletBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [showCashout, setShowCashout] = useState(false)
  const [amount, setAmount] = useState("")
  const [cashoutAmount, setCashoutAmount] = useState("")
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab) {
        setActiveTab(tab)
      }
    }
  }, [])

  useEffect(() => {
    if (user?.uid) {
      setUserId(user.uid)

      const userOrders = MarketplaceDB.getOrdersByBuyer(user.uid)
      setOrders(userOrders)

      const titles: Record<string, string> = {}
      userOrders.forEach((order) => {
        const product = MarketplaceDB.getProduct(order.productId)
        if (product) {
          titles[order.productId] = product.title
        }
      })
      setProductTitles(titles)

      const rideHistory = localStorage.getItem(`ride_history_${user.uid}`)
      if (rideHistory) {
        setRides(JSON.parse(rideHistory))
      }

      fetchWalletBalance()

      console.log("[v0] Buyer dashboard - loaded orders:", userOrders.length, "rides:", rides.length)
    }
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return

    const checkNotifications = async () => {
      try {
        const response = await fetch(`/api/rides/waitlist/check-notifications?piUserId=${user.uid}`)
        const data = await response.json()

        if (data.success) {
          setHasWaitlistNotifications(data.hasNotifications)
          setNotificationCount(data.count)
        }
      } catch (error) {
        console.error("[v0] Failed to check waitlist notifications:", error)
      }
    }

    checkNotifications()
    const interval = setInterval(checkNotifications, 60000)

    return () => clearInterval(interval)
  }, [user?.uid])

  const fetchWalletBalance = async () => {
    if (!user?.uid) return

    try {
      const response = await fetch(`/api/arcade/user/balance?userId=${user.uid}`)
      const data = await response.json()
      if (data.success) {
        setWalletBalance(data.balance)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch wallet balance:", error)
    }
  }

  const handleAddFunds = async () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Please enter a valid amount")
      return
    }

    const numAmount = Number(amount)
    if (numAmount < 1) {
      alert("Minimum add funds is 1π")
      return
    }

    setProcessing(true)
    try {
      const payment = piSDK.createPayment(
        {
          amount: numAmount,
          memo: `Add ${numAmount}π to dashboard wallet`,
          metadata: { type: "add_funds", userId: user.uid },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            const response = await fetch("/api/arcade/user/add-funds", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user.uid, amount: numAmount, piPaymentId: paymentId }),
            })
            const data = await response.json()
            if (!response.ok) {
              throw new Error(data.error)
            }
          },
          onReadyForServerCompletion: async () => {
            toast({
              title: "Funds added successfully!",
              description: `${numAmount}π added to your wallet`,
            })
            fetchWalletBalance()
            setShowAddFunds(false)
            setAmount("")
          },
          onCancel: () => {
            toast({ title: "Payment cancelled", variant: "destructive" })
          },
          onError: (error: any) => {
            toast({ title: "Payment failed", description: error.message, variant: "destructive" })
          },
        },
      )
    } catch (error: any) {
      console.error("[v0] Add funds error:", error)
      alert("Failed to add funds. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  const handleCashout = async () => {
    console.log("[v0] Cashout button clicked")

    const walletAddress = userId || user?.uid || localStorage.getItem("pi_uid")
    console.log("[v0] Wallet address:", walletAddress)

    if (!walletAddress) {
      toast({
        title: "Connection required",
        description: "Please connect your Pi wallet first",
        variant: "destructive",
      })
      await connect()
      return
    }

    const amount = Number(cashoutAmount)
    console.log("[v0] Cashout amount:", amount, "Balance:", walletBalance)

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (amount > walletBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this cashout",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    console.log("[v0] Creating Pi payment for cashout using piSDK...")

    try {
      if (!piSDK.isPiBrowserAvailable()) {
        console.warn("[v0] Pi Browser not available")
        toast({
          title: "Pi Browser Required",
          description:
            "Please open this app in the Pi Browser to cash out. This feature requires the Pi Network payment system.",
          variant: "destructive",
        })
        setProcessing(false)
        return
      }

      if (typeof window === "undefined" || !window.Pi) {
        console.error("[v0] window.Pi is not available")
        toast({
          title: "Pi SDK Not Available",
          description: "The Pi Network SDK is not loaded. Please try reopening the app in Pi Browser.",
          variant: "destructive",
        })
        setProcessing(false)
        return
      }

      console.log("[v0] Calling piSDK.createPayment with params:", {
        amount,
        memo: `Cashout ${amount}π from dashboard wallet`,
        metadata: { type: "cashout", userId: walletAddress, amount },
      })

      const payment = piSDK.createPayment(
        {
          amount: amount,
          memo: `Cashout ${amount}π from dashboard wallet`,
          metadata: { type: "cashout", userId: walletAddress, amount: amount },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log("[v0] ✅ Payment ready for approval, paymentId:", paymentId)

            if (!paymentId) {
              console.error("[v0] Payment ID is undefined!")
              toast({
                title: "Payment Error",
                description: "Pi payment ID was not generated",
                variant: "destructive",
              })
              setProcessing(false)
              return
            }

            try {
              console.log("[v0] Sending cashout request to API...")
              const response = await fetch("/api/arcade/user/cashout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: walletAddress,
                  amount: amount,
                  piPaymentId: paymentId,
                  userWalletAddress: walletAddress,
                }),
              })
              const data = await response.json()
              console.log("[v0] Cashout approval response:", data)

              if (!response.ok) {
                toast({
                  title: "Cashout failed",
                  description: data.error || "Failed to process cashout",
                  variant: "destructive",
                })
                setProcessing(false)
                throw new Error(data.error || "Cashout failed")
              }
            } catch (error: any) {
              console.error("[v0] API error:", error)
              toast({
                title: "Cashout failed",
                description: error.message || "Failed to process cashout",
                variant: "destructive",
              })
              setProcessing(false)
              throw error
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log("[v0] ✅ Payment completed, txid:", txid)
            toast({
              title: "Cashout successful!",
              description: `${amount}π has been sent to your Pi wallet`,
            })
            setCashoutAmount("")
            setShowCashout(false)
            fetchWalletBalance()
            setProcessing(false)
          },
          onCancel: (paymentId: string) => {
            console.log("[v0] ❌ Payment cancelled")
            toast({
              title: "Cashout cancelled",
              description: "The withdrawal was cancelled",
              variant: "destructive",
            })
            setProcessing(false)
          },
          onError: (error: any, payment: any) => {
            console.error("[v0] ❌ Cashout payment error:", error, payment)
            toast({
              title: "Cashout failed",
              description: error.message || "Payment failed",
              variant: "destructive",
            })
            setProcessing(false)
          },
        },
      )
      console.log("[v0] Pi payment object created:", payment)
    } catch (error: any) {
      console.error("[v0] ❌ Cashout exception:", error)
      toast({
        title: "Cashout failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
      setProcessing(false)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: "Pi Ride - Traveling Made Easy",
      text: "Check out Pi Ride: Rides, Rentals, Transit & More – All in Pi!",
      url: typeof window !== "undefined" ? window.location.origin : "https://piride.app",
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData)
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing Pi Ride.",
        })
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        // Fall back to clipboard
        try {
          await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
          toast({
            title: "Link copied!",
            description: "Share link copied to clipboard.",
          })
        } catch {
          toast({
            title: "Share failed",
            description: "Please try again",
            variant: "destructive",
          })
        }
      }
    } else {
      // No share API - use clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard.",
        })
      } catch {
        toast({
          title: "Copy failed",
          description: "Please try again",
          variant: "destructive",
        })
      }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="text-center p-8">
            <CardHeader>
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
              <CardDescription>
                Connect your Pi wallet to view your purchase history, ride history, and manage your orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => connect()} size="lg" className="w-full sm:w-auto pointer-events-auto">
                Connect Pi Wallet
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <Badge variant="outline" className="text-sm mt-2">
              {user.uid || "Pi User"}
            </Badge>
          </div>
          <Button variant="outline" onClick={handleShare} className="gap-2 bg-transparent">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-2 border-purple-300 dark:border-purple-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Dashboard Wallet Balance</p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-400">{walletBalance.toFixed(2)}π</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddFunds(true)} className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <ArrowUpFromLine className="w-4 h-4" />
                  Add Pi
                </Button>
                <Button onClick={() => setShowCashout(true)} variant="outline" className="gap-2">
                  <ArrowDownToLine className="w-4 h-4" />
                  Cash Out
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Daily withdrawal limit: $750 USD</p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="rides">
              <Car className="w-4 h-4 mr-2" />
              Rides ({rides.length})
            </TabsTrigger>
            <TabsTrigger value="tournaments">
              <Trophy className="w-4 h-4 mr-2" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="waitlist" className="relative">
              <Bell
                className={`w-4 h-4 mr-2 ${hasWaitlistNotifications ? "text-green-600 dark:text-green-400" : ""}`}
              />
              Waitlist
              {hasWaitlistNotifications && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4 mt-6">
            {orders.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-4">Start shopping in the marketplace!</p>
                <Button asChild>
                  <a href="/marketplace">Browse Marketplace</a>
                </Button>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{productTitles[order.productId] || "Product"}</CardTitle>
                        <CardDescription>Order #{order.id.slice(0, 8)}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "shipped"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {order.status === "delivered" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {order.status === "shipped" && <Truck className="w-3 h-3 mr-1" />}
                        {order.status === "paid" && <Package className="w-3 h-3 mr-1" />}
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-medium">π {order.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ordered:</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      {order.trackingNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tracking:</span>
                          <span className="font-mono text-xs">{order.trackingNumber}</span>
                        </div>
                      )}
                      {order.shippingAddress && (
                        <div className="pt-2 mt-2 border-t">
                          <p className="text-muted-foreground mb-1">Shipping to:</p>
                          <p className="text-sm">
                            {order.shippingAddress.fullName}
                            <br />
                            {order.shippingAddress.addressLine1}
                            {order.shippingAddress.addressLine2 && (
                              <>
                                <br />
                                {order.shippingAddress.addressLine2}
                              </>
                            )}
                            <br />
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rides" className="space-y-4 mt-6">
            {rides.length === 0 ? (
              <Card className="p-12 text-center">
                <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Rides Yet</h3>
                <p className="text-muted-foreground mb-4">Book your first ride to see your history here!</p>
                <Button asChild>
                  <a href="/">Book a Ride</a>
                </Button>
              </Card>
            ) : (
              rides.map((ride) => (
                <Card key={ride.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Car className="w-5 h-5" />
                          {ride.from} → {ride.to}
                        </CardTitle>
                        <CardDescription>Ride #{ride.id.slice(0, 8)}</CardDescription>
                      </div>
                      <Badge variant={ride.status === "completed" ? "default" : "secondary"}>{ride.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Distance:
                        </span>
                        <span>{ride.distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">π {ride.cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Date:
                        </span>
                        <span>{new Date(ride.date).toLocaleDateString()}</span>
                      </div>
                      {ride.driverName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Driver:</span>
                          <span>{ride.driverName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-4 mt-6">
            <TournamentHistory userId={user.uid} />
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-4 mt-6">
            <WaitlistDashboard />
          </TabsContent>
        </Tabs>

        {showAddFunds && (
          <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
            <DialogContent className="bg-gradient-to-br from-purple-900 to-blue-900 text-white border-purple-500">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add Pi to Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount" className="text-white/80">
                    Amount (π)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddFunds}
                    disabled={processing}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {processing ? "Processing..." : "Add Funds"}
                  </Button>
                  <Button onClick={() => setShowAddFunds(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {showCashout && (
          <Dialog open={showCashout} onOpenChange={setShowCashout}>
            <DialogContent className="bg-gradient-to-br from-purple-900 to-blue-900 text-white border-purple-500">
              <DialogHeader>
                <DialogTitle className="text-2xl">Cash Out to Pi Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cashout-amount" className="text-white/80">
                    Amount (π) - Max $750/day
                  </Label>
                  <Input
                    id="cashout-amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <p className="text-xs text-white/60 mt-1">Available: {walletBalance.toFixed(2)}π</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCashout}
                    disabled={processing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processing ? "Processing..." : "Cash Out"}
                  </Button>
                  <Button onClick={() => setShowCashout(false)} variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
