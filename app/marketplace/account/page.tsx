"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarketplaceDB, type Order, type MarketplaceProduct, type Offer } from "@/lib/marketplace-db"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingBag,
  MessageSquare,
  Gift,
  AlertTriangle,
} from "@/lib/icons"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { RefundRequestDialog } from "@/components/refund-request-dialog"

export default function BuyerAccountPage() {
  const { user, isConnected, connect } = usePiWallet()
  const { toast } = useToast()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Record<string, MarketplaceProduct>>({})
  const [offers, setOffers] = useState<Offer[]>([])
  const [activeTab, setActiveTab] = useState("orders")
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null)

  useEffect(() => {
    if (!isConnected) {
      return
    }

    if (user) {
      loadBuyerData()
    }
  }, [user, isConnected])

  const loadBuyerData = () => {
    if (!user) return

    const buyerOrders = MarketplaceDB.getOrdersByBuyer(user.uid)
    setOrders(buyerOrders)

    const productMap: Record<string, MarketplaceProduct> = {}
    buyerOrders.forEach((order) => {
      const product = MarketplaceDB.getProduct(order.productId)
      if (product) {
        productMap[order.productId] = product
      }
    })
    setProducts(productMap)

    const buyerOffers = MarketplaceDB.getOffersByBuyer(user.uid)
    setOffers(buyerOffers)
  }

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "paid":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-500" />
      case "delivered":
        return <Package className="w-5 h-5 text-green-600" />
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getStatusBadge = (status: Order["status"]) => {
    const variants = {
      pending: "secondary",
      paid: "default",
      shipped: "default",
      delivered: "default",
      cancelled: "destructive",
    } as const

    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getOfferStatusBadge = (status: Offer["status"]) => {
    const variants = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      countered: "secondary",
      cancelled: "outline",
      expired: "outline",
    } as const

    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    )
  }

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account?\n\nClick OK to continue or Cancel to abort.")) {
      return
    }

    if (
      !confirm(
        "⚠️ FINAL WARNING ⚠️\n\nDeleting your account will permanently remove:\n• Personal information\n• Saved addresses\n• Preferences\n\nTransaction records will be retained for legal/tax compliance.\n\nThis action CANNOT be undone.\n\nClick OK to delete permanently.",
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.uid }),
      })

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted. Transaction records retained for legal compliance.",
        })
        // Disconnect wallet and redirect
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        throw new Error("Failed to delete account")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      })
    }
  }

  const canRequestRefund = (order: Order) => {
    // Can request refund if order is paid, shipped, or delivered
    // and no refund has been requested yet
    if (order.status === "cancelled") return false
    if (order.refundStatus && order.refundStatus !== "none") return false

    // Check if order is within refund window (e.g., 30 days)
    const daysSinceOrder = (Date.now() - order.createdAt) / (1000 * 60 * 60 * 24)
    if (daysSinceOrder > 30) return false

    return true
  }

  const handleRequestRefund = (order: Order) => {
    setSelectedOrderForRefund(order)
    setShowRefundDialog(true)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>Please connect your Pi wallet to view your orders and purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={connect}>Connect Wallet</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Track your orders, offers, and purchase history</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="offers">
              <Gift className="w-4 h-4 mr-2" />
              Offers ({offers.length})
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
                  <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                  <Link href="/marketplace">
                    <Button>Browse Marketplace</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
                const product = products[order.productId]
                if (!product) return null

                const refundRequest = order.refundRequestId
                  ? MarketplaceDB.getRefundRequest(order.refundRequestId)
                  : null

                return (
                  <Card key={order.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{product.title}</h3>
                              <p className="text-sm text-muted-foreground">Order #{order.id.slice(-8)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{order.amount}π</p>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            {getStatusIcon(order.status)}
                            <div className="flex-1">
                              <p className="font-medium capitalize">{order.status}</p>
                              <p className="text-muted-foreground">
                                {order.status === "pending" && "Payment processing..."}
                                {order.status === "paid" && "Order confirmed, preparing for shipment"}
                                {order.status === "shipped" &&
                                  order.trackingNumber &&
                                  `Tracking: ${order.trackingNumber}`}
                                {order.status === "delivered" && "Order delivered successfully"}
                                {order.status === "cancelled" && "Order cancelled"}
                              </p>
                            </div>
                          </div>

                          {order.shipping && (
                            <div className="flex items-center gap-2 text-sm">
                              <Truck className="w-4 h-4" />
                              <span>Shipping to your address • Est. delivery: {product.shipping.estimatedDays}</span>
                            </div>
                          )}

                          {order.pickup && (
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="w-4 h-4" />
                              <span>Pickup at: {product.pickup.address}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                            {order.updatedAt !== order.createdAt && (
                              <>
                                <span>•</span>
                                <span>Updated: {new Date(order.updatedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>

                          {refundRequest && (
                            <Alert
                              className={
                                refundRequest.status === "completed"
                                  ? "bg-green-500/10 border-green-500/20"
                                  : refundRequest.status === "rejected"
                                    ? "bg-red-500/10 border-red-500/20"
                                    : "bg-yellow-500/10 border-yellow-500/20"
                              }
                            >
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {refundRequest.status === "pending" && "Refund Request Pending"}
                                      {refundRequest.status === "approved" && "Refund Approved"}
                                      {refundRequest.status === "rejected" && "Refund Request Rejected"}
                                      {refundRequest.status === "completed" && "Refund Completed"}
                                    </p>
                                    {refundRequest.approvedAmount && (
                                      <p className="text-sm">Amount: {refundRequest.approvedAmount}π</p>
                                    )}
                                  </div>
                                  <Badge
                                    variant={
                                      refundRequest.status === "completed"
                                        ? "default"
                                        : refundRequest.status === "rejected"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className="capitalize"
                                  >
                                    {refundRequest.status}
                                  </Badge>
                                </div>
                                {refundRequest.sellerResponse && (
                                  <p className="text-sm mt-2 bg-background/50 p-2 rounded">
                                    <strong>Seller Response:</strong> {refundRequest.sellerResponse}
                                  </p>
                                )}
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => router.push(`/marketplace`)}>
                              View Product
                            </Button>
                            {order.status === "delivered" && (
                              <Button variant="outline" size="sm">
                                Write Review
                              </Button>
                            )}
                            {order.status === "shipped" && order.trackingNumber && (
                              <Button variant="outline" size="sm">
                                Track Shipment
                              </Button>
                            )}
                            {canRequestRefund(order) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRequestRefund(order)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                Request Refund
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            {offers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Offers Submitted</h3>
                  <p className="text-muted-foreground">Browse products that accept offers to get started</p>
                </CardContent>
              </Card>
            ) : (
              offers.map((offer) => {
                const product = MarketplaceDB.getProduct(offer.productId)
                if (!product) return null

                return (
                  <Card key={offer.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {product.images[0] ? (
                            <img
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{product.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Original Price: {product.price}π • Your Offer: {offer.amount}π
                              </p>
                            </div>
                            {getOfferStatusBadge(offer.status)}
                          </div>

                          {offer.message && (
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                              <p className="font-medium mb-1">Your Message:</p>
                              <p className="text-muted-foreground">{offer.message}</p>
                            </div>
                          )}

                          {offer.counterOffer && (
                            <Alert>
                              <AlertDescription>
                                <strong>Counter Offer:</strong> Seller offered {offer.counterOffer}π
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Submitted: {new Date(offer.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Expires: {new Date(offer.expiresAt).toLocaleDateString()}</span>
                          </div>

                          {offer.status === "accepted" && (
                            <Alert className="bg-green-500/10 border-green-500/20">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <AlertDescription>
                                Offer accepted! Payment will be processed automatically.
                              </AlertDescription>
                            </Alert>
                          )}

                          {offer.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  MarketplaceDB.updateOfferStatus(offer.id, "cancelled")
                                  loadBuyerData()
                                }}
                              >
                                Cancel Offer
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Messages Coming Soon</h3>
                <p className="text-muted-foreground">Direct messaging with sellers will be available soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="border-destructive/50 bg-destructive/5 mt-8 max-w-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleDeleteAccount} size="sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </main>

      {showRefundDialog && selectedOrderForRefund && products[selectedOrderForRefund.productId] && (
        <RefundRequestDialog
          order={selectedOrderForRefund}
          product={products[selectedOrderForRefund.productId]}
          isOpen={showRefundDialog}
          onClose={() => {
            setShowRefundDialog(false)
            setSelectedOrderForRefund(null)
          }}
          onSuccess={() => {
            loadBuyerData()
          }}
        />
      )}
    </div>
  )
}
