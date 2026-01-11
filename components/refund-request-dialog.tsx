"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarketplaceDB, type Order, type MarketplaceProduct } from "@/lib/marketplace-db"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "@/lib/icons"

interface RefundRequestDialogProps {
  order: Order
  product: MarketplaceProduct
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const REFUND_REASONS = [
  "Item not as described",
  "Item damaged during shipping",
  "Wrong item received",
  "Defective or not working",
  "Changed my mind",
  "Better price found elsewhere",
  "No longer needed",
  "Other",
]

export function RefundRequestDialog({ order, product, isOpen, onClose, onSuccess }: RefundRequestDialogProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [requestedAmount, setRequestedAmount] = useState(order.amount.toString())
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for the refund request",
        variant: "destructive",
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please provide details about why you're requesting a refund",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(requestedAmount)
    if (isNaN(amount) || amount <= 0 || amount > order.amount) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid amount between 0 and ${order.amount}π`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const refundId = MarketplaceDB.createRefundRequest({
        orderId: order.id,
        productId: order.productId,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        requestedAmount: amount,
        reason,
        description,
      })

      if (refundId) {
        toast({
          title: "Refund Request Submitted",
          description: "The seller will review your request and respond within 48 hours",
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Failed to create refund request")
      }
    } catch (error) {
      console.error("[v0] Error submitting refund request:", error)
      toast({
        title: "Submission Failed",
        description: "Failed to submit refund request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
          <DialogDescription>
            Submit a refund request for order #{order.id.slice(-8)} - {product.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-background rounded overflow-hidden flex-shrink-0">
                <img
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{product.title}</h4>
                <p className="text-sm text-muted-foreground">Order Amount: {order.amount}π</p>
                <p className="text-sm text-muted-foreground">
                  Order Date: {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="refund-amount">Refund Amount (π)</Label>
            <Input
              id="refund-amount"
              type="number"
              step="0.01"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              placeholder="Enter refund amount"
              max={order.amount}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum refund amount: {order.amount}π. Enter a partial amount if you only want a partial refund.
            </p>
          </div>

          <div>
            <Label htmlFor="refund-reason">Reason for Refund</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REFUND_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="refund-description">Detailed Description</Label>
            <Textarea
              id="refund-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about why you're requesting this refund..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include any relevant details such as condition of the item, problems encountered, etc.
            </p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Refund Policy</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Seller will review your request within 48 hours</li>
                <li>Refunds may be full or partial based on the situation</li>
                <li>You may be asked to return the item for a full refund</li>
                <li>Refunds are processed within 3-5 business days after approval</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Submitting..." : "Submit Refund Request"}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
