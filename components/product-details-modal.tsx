"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MarketplaceDB, type MarketplaceProduct } from "@/lib/marketplace-db"
import { MapPin, Package, Truck, Store, Sparkles } from "@/lib/icons"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ShippingAddressDialog, type ShippingAddress } from "@/components/shipping-address-dialog"
import { BusinessMapManager } from "@/lib/business-map-manager"
import { PiVolatilityDisclaimer } from "@/components/pi-volatility-disclaimer"
import { usePiWallet } from "@/hooks/use-pi-wallet"

interface ProductDetailsModalProps {
  product: MarketplaceProduct
  onClose: () => void
  onConnectWallet: () => void
}

export function ProductDetailsModal({ product, onClose, onConnectWallet }: ProductDetailsModalProps) {
  const { user } = usePiWallet()
  const { toast } = useToast()
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offerAmount, setOfferAmount] = useState("")
  const [offerMessage, setOfferMessage] = useState("")
  const [processingPayment, setProcessingPayment] = useState(false)
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<ShippingAddress | null>(null)
  const [showShippingDialog, setShowShippingDialog] = useState(false)
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null)
  const currentUserId = user?.uid || authenticatedUser?.uid

  const currentUser = authenticatedUser || user

  const processPayment = async (shippingAddress: ShippingAddress | null = null) => {
    if (typeof window === "undefined" || !window.Pi || typeof window.Pi.createPayment !== "function") {
      toast({
        title: "Pi Browser Required",
        description: "Please open this app in the Pi Browser to make payments.",
        variant: "destructive",
      })
      setProcessingPayment(false)
      return
    }

    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please connect your Pi wallet first.",
      })
      onConnectWallet()
      setProcessingPayment(false)
      return
    }

    setProcessingPayment(true)

    try {
      let sellerEmail = ""
      try {
        const business = BusinessMapManager.getBusiness(product.businessId)
        sellerEmail = business?.email || ""
      } catch (businessError) {
        sellerEmail = process.env.NEXT_PUBLIC_PARTNER_APPLICATIONS_EMAIL || ""
      }

      const paymentData = {
        amount: product.price * quantity,
        memo: `Purchase: ${product.title} x ${quantity}`,
        metadata: {
          productId: product.id,
          buyerId: currentUser.uid,
          sellerId: product.businessId,
          type: "marketplace_purchase",
          quantity: quantity,
          shippingAddress: shippingAddress || null,
        },
      }

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("[v0] MARKETPLACE - Payment approval starting:", paymentId)

          try {
            const approveResponse = await fetch("/api/pi/approve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId }),
            })

            const approveData = await approveResponse.json()
            console.log("[v0] MARKETPLACE - Server approval response:", approveData)

            if (!approveResponse.ok) {
              console.error("[v0] MARKETPLACE - Server approval failed:", approveData)
              toast({
                title: "Payment Approval Failed",
                description: approveData.error || "Could not approve payment",
                variant: "destructive",
              })
              return
            }

            console.log("[v0] MARKETPLACE - Payment approved successfully")
            toast({
              title: "Payment Approved",
              description: "Waiting for blockchain confirmation...",
            })
          } catch (error) {
            console.error("[v0] MARKETPLACE - Error in approval:", error)
            toast({
              title: "Payment Error",
              description: "Could not process payment approval",
              variant: "destructive",
            })
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("[v0] MARKETPLACE - Payment completion starting:", { paymentId, txid })

          try {
            // Step 1: Complete payment with Pi Network (like asteroids does)
            const completeResponse = await fetch("/api/pi/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentId, txid }),
            })

            const completeData = await completeResponse.json()
            console.log("[v0] MARKETPLACE - Server completion response:", completeData)

            if (!completeResponse.ok) {
              console.error("[v0] MARKETPLACE - Server completion failed:", completeData)
              toast({
                title: "Payment Completion Failed",
                description: completeData.error || "Could not complete payment",
                variant: "destructive",
              })
              setProcessingPayment(false)
              return
            }

            console.log("[v0] MARKETPLACE - Payment completed successfully with Pi Network")

            const isTestMode = currentUser?.uid === product.businessId
            const purchaseHeaders: Record<string, string> = {
              "Content-Type": "application/json",
            }
            if (isTestMode) {
              purchaseHeaders["x-test-mode"] = "true"
              console.log("[v0] MARKETPLACE - Test mode enabled for self-purchase")
            }

            // Step 2: Create marketplace order in our database
            const purchaseResponse = await fetch("/api/marketplace/purchase", {
              method: "POST",
              headers: purchaseHeaders,
              body: JSON.stringify({
                productId: product.id,
                buyerId: currentUser.uid,
                sellerId: product.businessId,
                amount: product.price * quantity,
                paymentId,
                txid,
                shipping: product.shipping.available && !!shippingAddress,
                pickup: product.pickup.available && !shippingAddress,
                shippingAddress: shippingAddress || undefined,
                quantity: quantity,
              }),
            })

            if (!purchaseResponse.ok) {
              const errorData = await purchaseResponse.json()
              console.error("[v0] MARKETPLACE - Purchase API error:", errorData)
              toast({
                title: "Order Creation Failed",
                description:
                  errorData.error ||
                  "Your payment was processed but we couldn't create the order. Please contact support.",
                variant: "destructive",
              })
              setProcessingPayment(false)
              return
            }

            const purchaseData = await purchaseResponse.json()
            console.log("[v0] MARKETPLACE - Order created:", purchaseData.orderId)

            // Step 3: Send notifications
            try {
              await fetch("/api/send-order-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: purchaseData.orderId,
                  product: product,
                  sellerName: purchaseData.sellerName,
                  buyerUsername: currentUser.username,
                  quantity,
                }),
              })
            } catch (notifError) {
              console.error("[v0] MARKETPLACE - Notification error (non-critical):", notifError)
            }

            const testModeMessage = isTestMode ? " (Test Mode - Self Purchase)" : ""
            toast({
              title: "Purchase Complete!",
              description: `Your order from ${purchaseData.sellerName || "the seller"} has been confirmed.${testModeMessage} Check your dashboard for details.`,
              duration: 5000,
            })

            setProcessingPayment(false)
            onClose()

            setTimeout(() => {
              router.push("/marketplace/buyer/dashboard")
            }, 500)
          } catch (error: any) {
            console.error("[v0] MARKETPLACE - Purchase completion error:", error)
            toast({
              title: "Purchase Failed",
              description:
                error.message || "An unexpected error occurred. Please contact support if your payment was processed.",
              variant: "destructive",
            })
            setProcessingPayment(false)
          }
        },

        onCancel: (paymentId: string) => {
          console.log("[v0] MARKETPLACE - Payment cancelled:", paymentId)
          toast({
            title: "Payment Cancelled",
            description: "You can try again when ready.",
          })
          setProcessingPayment(false)
        },

        onError: (error: Error, payment: any) => {
          console.error("[v0] MARKETPLACE - Payment error:", error, payment)
          toast({
            title: "Payment Failed",
            description: error.message || "An error occurred during payment.",
            variant: "destructive",
          })
          setProcessingPayment(false)
        },

        onIncomplete: (paymentId: string, txid: string) => {
          console.log("[v0] MARKETPLACE - Payment incomplete/expired:", { paymentId, txid })
          toast({
            title: "Payment Timed Out",
            description: "The Pi Network payment expired. Please try again - your balance wasn't affected.",
            variant: "destructive",
          })
          setProcessingPayment(false)
        },
      }

      console.log("[v0] MARKETPLACE - Creating Pi payment:", paymentData)
      window.Pi.createPayment(paymentData, paymentCallbacks)
    } catch (error: any) {
      console.error("[v0] MARKETPLACE - Payment initiation error:", error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      })
      setProcessingPayment(false)
    }
  }

  const handleBuyNow = async () => {
    setProcessingPayment(true)

    if (!currentUser) {
      if (typeof window !== "undefined" && window.Pi) {
        try {
          toast({
            title: "Connecting Pi Wallet",
            description: "Please approve the connection in Pi Browser...",
          })

          const authResult = await window.Pi.authenticate(["username", "payments"], (payment: any) => {})

          await fetch("/api/user/create-or-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              uid: authResult.user.uid,
              username: authResult.user.username,
            }),
          })

          setAuthenticatedUser(authResult.user)

          toast({
            title: "Wallet Connected",
            description: "Processing your purchase...",
          })

          if (product.shipping.available) {
            setShowShippingDialog(true)
            setProcessingPayment(false)
          } else {
            await processPayment(null)
          }
          return
        } catch (error) {
          toast({
            title: "Connection Failed",
            description: error instanceof Error ? error.message : "Could not connect to Pi wallet.",
            variant: "destructive",
          })
          setProcessingPayment(false)
          return
        }
      } else {
        toast({
          title: "Connect Wallet",
          description: "Please connect your Pi wallet to make a purchase.",
        })
        onConnectWallet()
        setProcessingPayment(false)
        return
      }
    }

    if (product.shipping.available) {
      setShowShippingDialog(true)
      setProcessingPayment(false)
    } else {
      await processPayment(null)
    }
  }

  const handleSubmitOffer = () => {
    if (!currentUser) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your Pi wallet to send an offer.",
      })
      onConnectWallet()
      return
    }

    if (!product.acceptsOffers) {
      toast({
        title: "Offers Not Accepted",
        description: "This seller does not accept offers on this item.",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(offerAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid offer amount.",
        variant: "destructive",
      })
      return
    }

    if (product.offerRange && amount < product.offerRange.min) {
      toast({
        title: "Offer Too Low",
        description: `The minimum acceptable offer is ${product.offerRange.min}π.`,
        variant: "destructive",
      })
      return
    }

    try {
      const offerId = MarketplaceDB.createOffer({
        productId: product.id,
        buyerId: currentUser.uid,
        buyerUsername: currentUser.username,
        sellerId: product.businessId,
        amount,
        message: offerMessage,
      })

      toast({
        title: "Offer Submitted!",
        description: "The seller will be notified. Your offer expires in 48 hours.",
        duration: 5000,
      })

      setShowOfferForm(false)
      setOfferAmount("")
      setOfferMessage("")
      onClose()
    } catch (error) {
      toast({
        title: "Offer Failed",
        description: "Failed to submit offer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  const handleAddressSelected = async (address: ShippingAddress) => {
    setSelectedShippingAddress(address)
    setShowShippingDialog(false)
    setProcessingPayment(true)

    toast({
      title: "Starting Payment",
      description: "Connecting to Pi Network for payment...",
    })

    await processPayment(address)
  }

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="w-screen h-screen max-w-none p-0 m-0 flex flex-col gap-0 rounded-none border-none bg-background">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-modal-close
            className="absolute top-4 left-4 z-[100] bg-background/80 hover:bg-background backdrop-blur-sm"
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </Button>

          <div className="flex-1 overflow-y-auto w-full pt-16 pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {product.photos3D && (
                    <div className="flex gap-2 mb-4">
                      <Button variant="default" size="sm">
                        2D Images
                      </Button>
                      <Button variant="outline" size="sm">
                        3D View
                      </Button>
                      {product.model3D && (
                        <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                          <Sparkles className="w-3 h-3" />
                          Premium 3D
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="relative bg-muted rounded-lg overflow-hidden aspect-square md:aspect-[4/3]">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[currentImageIndex] || "/placeholder.svg"}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                        {product.images.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="15 18 9 12 15 6" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                            >
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {product.images && product.images.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 ${
                            idx === currentImageIndex ? "border-primary" : "border-transparent"
                          }`}
                        >
                          <img
                            src={img || "/placeholder.svg"}
                            alt={`${product.title} ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-2xl font-bold text-balance">{product.title}</h2>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-2xl font-bold text-primary whitespace-nowrap">{product.price}π</div>
                        <PiVolatilityDisclaimer />
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-pretty">{product.description}</p>
                  </div>

                  {product.category && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{product.category}</Badge>
                      {product.condition && <Badge variant="outline">{product.condition}</Badge>}
                      {product.stock > 0 && product.stock <= 5 && (
                        <Badge variant="destructive">Only {product.stock} left!</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="quantity" className="text-sm font-medium">
                        Quantity:
                      </label>
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-12 text-center text-sm">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{product.stock} in stock</div>
                  </div>

                  {(product.shipping.available || product.pickup.available) && (
                    <div className="space-y-2 pt-2">
                      <h3 className="font-semibold text-sm">Fulfillment Options:</h3>
                      {product.shipping.available && (
                        <div className="flex items-start gap-2 text-sm">
                          <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Shipping Available</div>
                            {product.shipping.cost && product.shipping.cost > 0 ? (
                              <div className="text-muted-foreground">Cost: {product.shipping.cost}π</div>
                            ) : (
                              <div className="text-muted-foreground">Free shipping</div>
                            )}
                            {product.shipping.estimatedDays && (
                              <div className="text-muted-foreground">
                                Estimated delivery: {product.shipping.estimatedDays} days
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {product.pickup.available && (
                        <div className="flex items-start gap-2 text-sm">
                          <Store className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">Local Pickup Available</div>
                            {product.pickup.location && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {product.pickup.location}
                              </div>
                            )}
                            {product.pickup.instructions && (
                              <div className="text-muted-foreground text-xs mt-1">{product.pickup.instructions}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {showOfferForm && (
                    <div className="space-y-3 border rounded-lg p-4">
                      <h3 className="font-semibold">Make an Offer</h3>
                      {product.offerRange && (
                        <p className="text-sm text-muted-foreground">
                          Acceptable range: {product.offerRange.min}π - {product.offerRange.max}π
                        </p>
                      )}
                      <div>
                        <label htmlFor="offerAmount" className="text-sm font-medium">
                          Offer Amount (π)
                        </label>
                        <input
                          id="offerAmount"
                          type="number"
                          value={offerAmount}
                          onChange={(e) => setOfferAmount(e.target.value)}
                          placeholder="Enter your offer"
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label htmlFor="offerMessage" className="text-sm font-medium">
                          Message (Optional)
                        </label>
                        <textarea
                          id="offerMessage"
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          placeholder="Add a message to the seller..."
                          className="w-full mt-1 px-3 py-2 border rounded-md"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSubmitOffer} className="flex-1">
                          Send Offer
                        </Button>
                        <Button onClick={() => setShowOfferForm(false)} variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {product.stock > 0 && (
            <div className="border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 flex gap-2 bg-background fixed bottom-0 left-0 right-0 z-50">
              <Button
                onClick={handleBuyNow}
                className="flex-1"
                size="lg"
                disabled={processingPayment || product.stock <= 0}
                type="button"
              >
                {processingPayment ? "Processing..." : "Buy It Now"}
              </Button>
              {product.acceptsOffers && (
                <Button
                  onClick={() => setShowOfferForm(true)}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={processingPayment}
                  type="button"
                >
                  Send Offer
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showShippingDialog && (
        <ShippingAddressDialog
          open={showShippingDialog}
          userId={currentUser?.uid || ""}
          onClose={() => {
            setShowShippingDialog(false)
            setProcessingPayment(false)
          }}
          onSelectAddress={handleAddressSelected}
        />
      )}
    </>
  )
}
