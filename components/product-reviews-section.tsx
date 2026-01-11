"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp } from "@/lib/icons"
import { SellerTrustDB, type Review } from "@/lib/seller-trust-db"
import { formatDistanceToNow } from "date-fns"

interface ProductReviewsSectionProps {
  productId: string
  sellerId: string
}

export function ProductReviewsSection({ productId, sellerId }: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [sellerTrust, setSellerTrust] = useState<any>(null)

  useEffect(() => {
    const productReviews = SellerTrustDB.getReviewsByProduct(productId)
    const trust = SellerTrustDB.getSellerTrust(sellerId)
    setReviews(productReviews)
    setSellerTrust(trust)
  }, [productId, sellerId])

  const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  )

  if (reviews.length === 0 && !sellerTrust) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No reviews yet. Be the first to review!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {sellerTrust && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Seller Ratings</h3>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <div>
                  <div className="flex items-center gap-1">
                    <StarDisplay rating={Math.round(sellerTrust.averageRating)} />
                    <span className="font-medium">{sellerTrust.averageRating.toFixed(1)}</span>
                  </div>
                  <p className="text-muted-foreground">{sellerTrust.totalReviews} reviews</p>
                </div>
                <div className="border-l pl-4">
                  <p className="font-medium">Shipping: {sellerTrust.averageShippingRating.toFixed(1)} ⭐</p>
                  <p className="text-muted-foreground">{sellerTrust.successfulDeliveries} deliveries</p>
                </div>
              </div>
            </div>
            <Badge variant={sellerTrust.escrowRequired ? "outline" : "default"}>
              {sellerTrust.escrowRequired ? "🆕 New Seller" : "✓ Trusted"}
            </Badge>
          </div>
        </Card>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Customer Reviews ({reviews.length})</h3>
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{review.buyerUsername}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                  </p>
                </div>
                {review.verified && (
                  <Badge variant="secondary" className="text-xs">
                    ✓ Verified Purchase
                  </Badge>
                )}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Overall:</span>
                  <StarDisplay rating={review.overallRating} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Shipping:</span>
                  <StarDisplay rating={review.shippingRating} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Quality:</span>
                  <StarDisplay rating={review.productQuality} />
                </div>
              </div>

              {review.description && <p className="text-sm mb-3">{review.description}</p>}

              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsUp className="w-4 h-4" />
                <span>Helpful ({review.helpful})</span>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
