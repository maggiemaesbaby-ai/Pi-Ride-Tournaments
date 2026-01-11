"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketplaceDB, type RefundRequest, type Order, type MarketplaceProduct } from "@/lib/marketplace-db"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, XCircle, Clock, DollarSign } from "@/lib/icons"
import { BusinessFeesManager } from "@/lib/business-fees"

interface SellerRefundManagerProps {
  sellerId: string
}

export function SellerRefundManager({ sellerId }: SellerRefundManagerProps) {
  const { toast } = useToast()
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [products, setProducts] = useState<Record<string, MarketplaceProduct>>({})
  const [orders, setOrders] = useState<Record<string, Order>>({})
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null)
  const [sellerResponse, setSellerResponse] = useState("")
  const [approvedAmount, setApprovedAmount] = useState("")

  useEffect(() => {
    loadRefundRequests()
  }, [sellerId])

  const loadRefundRequests = () => {
    const requests = MarketplaceDB.getRefundRequestsBySeller(sellerId)
    setRefundRequests(requests)

    const productMap: Record<string, MarketplaceProduct> = {}
    const orderMap: Record<string, Order> = {}

    requests.forEach((request) => {
      const product = MarketplaceDB.getProduct(request.productId)
      if (product) productMap[request.productId] = product

      const order = MarketplaceDB.getOrder(request.orderId)
      if (order) orderMap[request.orderId] = order
    })

    setProducts(productMap)
    setOrders(orderMap)
  }

  const handleApprove = async (request: RefundRequest, amount?: number) => {
    const refundAmount = amount || request.requestedAmount

    if (!sellerResponse.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a response to the buyer",
        variant: "destructive",
      })
      return
    }

    try {
      // Process the refund through Pi payment system
      // In a real implementation, this would use the Pi SDK to send Pi back to the buyer
      await window.Pi.createPayment(
        {
          amount: refundAmount,
          memo: `Refund for order #${request.orderId.slice(-8)}`,
          metadata: {
            type: "refund",
            orderId: request.orderId,
            refundRequestId: request.id,
          },
        },
        {
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            // Update refund request status
            MarketplaceDB.updateRefundRequest(request.id, {
              status: "completed",
              sellerResponse,
              approvedAmount: refundAmount,
            })

            // Deduct from seller's balance
            BusinessFeesManager.updateSellerBalance(sellerId, -refundAmount, "available")

            toast({
              title: "Refund Approved",
              description: `Refunded ${refundAmount}π to the buyer`,
            })

            loadRefundRequests()
            setSelectedRequest(null)
            setSellerResponse("")
            setApprovedAmount("")
          },
          onCancel: () => {
            toast({
              title: "Refund Cancelled",
              description: "Refund payment was cancelled",
            })
          },
          onError: (error: any) => {
            console.error("[v0] Refund payment error:", error)
            toast({
              title: "Refund Failed",
              description: "Failed to process refund payment",
              variant: "destructive",
            })
          },
        },
      )
    } catch (error) {
      console.error("[v0] Error processing refund:", error)
      toast({
        title: "Error",
        description: "Failed to process refund. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReject = (request: RefundRequest) => {
    if (!sellerResponse.trim()) {
      toast({
        title: "Response Required",
        description: "Please provide a reason for rejecting the refund",
        variant: "destructive",
      })
      return
    }

    MarketplaceDB.updateRefundRequest(request.id, {
      status: "rejected",
      sellerResponse,
    })

    toast({
      title: "Refund Rejected",
      description: "The buyer has been notified of your decision",
    })

    loadRefundRequests()
    setSelectedRequest(null)
    setSellerResponse("")
  }

  const getStatusIcon = (status: RefundRequest["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />
      case "approved":
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "rejected":
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const pendingRequests = refundRequests.filter((r) => r.status === "pending")
  const resolvedRequests = refundRequests.filter((r) => r.status !== "pending")

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Refund Requests</h3>
        <p className="text-muted-foreground">Review and manage customer refund requests</p>
      </div>

      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </h4>

          {pendingRequests.map((request) => {
            const product = products[request.productId]
            const order = orders[request.orderId]
            if (!product || !order) return null

            return (
              <Card key={request.id} className="border-yellow-500/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{request.orderId.slice(-8)} - {product.title}
                      </CardTitle>
                      <CardDescription>Requested {new Date(request.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge className="bg-yellow-500">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Amount</p>
                      <p className="text-lg font-semibold">{order.amount}π</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested Refund</p>
                      <p className="text-lg font-semibold text-yellow-600">{request.requestedAmount}π</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Reason:</p>
                    <p className="text-sm bg-muted p-3 rounded">{request.reason}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Description:</p>
                    <p className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">{request.description}</p>
                  </div>

                  {selectedRequest?.id === request.id ? (
                    <div className="space-y-4 border-t pt-4">
                      <div>
                        <Label>Your Response to Buyer</Label>
                        <Textarea
                          value={sellerResponse}
                          onChange={(e) => setSellerResponse(e.target.value)}
                          placeholder="Explain your decision to the buyer..."
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label>Approved Amount (leave blank for full refund)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(e.target.value)}
                          placeholder={request.requestedAmount.toString()}
                          max={request.requestedAmount}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            handleApprove(request, approvedAmount ? Number.parseFloat(approvedAmount) : undefined)
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Refund
                        </Button>
                        <Button onClick={() => handleReject(request)} variant="destructive" className="flex-1">
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Request
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(null)
                            setSellerResponse("")
                            setApprovedAmount("")
                          }}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => setSelectedRequest(request)} className="flex-1">
                        Review Request
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {resolvedRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Resolved Requests ({resolvedRequests.length})</h4>

          {resolvedRequests.map((request) => {
            const product = products[request.productId]
            if (!product) return null

            return (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(request.status)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{product.title}</p>
                          <p className="text-sm text-muted-foreground">Order #{request.orderId.slice(-8)}</p>
                        </div>
                        <Badge
                          variant={
                            request.status === "completed"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">Requested:</span> {request.requestedAmount}π
                        </p>
                        {request.approvedAmount && (
                          <p>
                            <span className="text-muted-foreground">Refunded:</span>{" "}
                            <span className="font-semibold">{request.approvedAmount}π</span>
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Resolved {request.resolvedAt ? new Date(request.resolvedAt).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {refundRequests.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Refund Requests</h3>
            <p className="text-muted-foreground">Refund requests from buyers will appear here</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
