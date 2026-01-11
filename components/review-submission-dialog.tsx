"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "@/lib/icons"
import { SellerTrustDB } from "@/lib/seller-trust-db"
import { useToast } from "@/hooks/use-toast"

interface ReviewSubmissionDialogProps {
  orderId: string
  productId: string
  productTitle: string
  sellerId: string
  buyerId: string
  buyerUsername: string
  onClose: () => void
}

export function ReviewSubmissionDialog({
  orderId,
  productId,
  productTitle,
  sellerId,
  buyerId,
  buyerUsername,
  onClose,
}: ReviewSubmissionDialogProps) {
  const { toast } = useToast()
  const [overallRating, setOverallRating] = useState(0)
  const [shippingRating, setShippingRating] = useState(0)
  const [productQuality, setProductQuality] = useState(0)
  const [description, setDescription] = useState("")
  const [hoveredOverall, setHoveredOverall] = useState(0)
  const [hoveredShipping, setHoveredShipping] = useState(0)
  const [hoveredQuality, setHoveredQuality] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (overallRating === 0 || shippingRating === 0 || productQuality === 0) {
      toast({
        title: "Missing Ratings",
        description: "Please provide all ratings before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const reviewId = SellerTrustDB.addReview({
      orderId,
      productId,
      productTitle,
      sellerId,
      buyerId,
      buyerUsername,
      overallRating,
      shippingRating,
      productQuality,
      description,
    })

    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback.",
    })

    onClose()
  }

  const StarRating = ({
    rating,
    hovered,
    onRate,
    onHover,
    label,
  }: {
    rating: number
    hovered: number
    onRate: (r: number) => void
    onHover: (r: number) => void
    label: string
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hovered || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Your Purchase</DialogTitle>
          <p className="text-sm text-muted-foreground">{productTitle}</p>
        </DialogHeader>

        <div className="space-y-6">
          <StarRating
            rating={overallRating}
            hovered={hoveredOverall}
            onRate={setOverallRating}
            onHover={setHoveredOverall}
            label="Overall Experience"
          />

          <StarRating
            rating={shippingRating}
            hovered={hoveredShipping}
            onRate={setShippingRating}
            onHover={setHoveredShipping}
            label="Shipping Speed & Service"
          />

          <StarRating
            rating={productQuality}
            hovered={hoveredQuality}
            onRate={setProductQuality}
            onHover={setHoveredQuality}
            label="Product Quality & Accuracy"
          />

          <div>
            <Label>Your Review (Optional)</Label>
            <Textarea
              placeholder="Share your experience with this purchase..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
