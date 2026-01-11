export interface SellerTrustScore {
  sellerId: string
  sellerName: string
  // Trust metrics
  totalSales: number
  successfulDeliveries: number
  disputes: number
  activeDisputes: number
  // Shipping ratings
  averageShippingRating: number
  shippingRatingsCount: number
  poorShippingRatings: number // Count of ratings below 3 stars
  // Review metrics
  averageRating: number
  totalReviews: number
  // Trust status
  trustStatus: "new" | "trusted" | "flagged" | "suspended"
  escrowRequired: boolean
  // Timestamps
  firstSaleDate: number
  lastSaleDate: number
  lastReviewDate: number
  createdAt: number
  updatedAt: number
}

export interface Review {
  id: string
  orderId: string
  productId: string
  productTitle: string
  sellerId: string
  buyerId: string
  buyerUsername: string
  // Ratings
  overallRating: number // 1-5 stars
  shippingRating: number // 1-5 stars for shipping speed
  productQuality: number // 1-5 stars
  description: string // Review text
  // Photos
  photos?: string[]
  // Status
  verified: boolean // Verified purchase
  helpful: number // Helpful votes
  createdAt: number
}

export interface Dispute {
  id: string
  orderId: string
  productId: string
  sellerId: string
  buyerId: string
  buyerUsername: string
  reason: "not_received" | "not_as_described" | "damaged" | "wrong_item" | "other"
  description: string
  evidence?: string[] // Photo URLs
  status: "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "resolved_partial" | "closed"
  resolution?: string
  refundAmount?: number
  createdAt: number
  updatedAt: number
  resolvedAt?: number
  resolvedBy?: string // admin username
}

export class SellerTrustDB {
  private static TRUST_KEY = "seller_trust_scores"
  private static REVIEWS_KEY = "product_reviews"
  private static DISPUTES_KEY = "order_disputes"

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  // Seller Trust Score Management
  static getSellerTrust(sellerId: string): SellerTrustScore | null {
    if (!this.isBrowser()) return null
    const scores = this.getAllTrustScores()
    return scores.find((s) => s.sellerId === sellerId) || null
  }

  static getAllTrustScores(): SellerTrustScore[] {
    if (!this.isBrowser()) return []
    const data = localStorage.getItem(this.TRUST_KEY)
    return data ? JSON.parse(data) : []
  }

  static initializeSellerTrust(sellerId: string, sellerName: string): SellerTrustScore {
    const existing = this.getSellerTrust(sellerId)
    if (existing) return existing

    const newTrust: SellerTrustScore = {
      sellerId,
      sellerName,
      totalSales: 0,
      successfulDeliveries: 0,
      disputes: 0,
      activeDisputes: 0,
      averageShippingRating: 0,
      shippingRatingsCount: 0,
      poorShippingRatings: 0,
      averageRating: 0,
      totalReviews: 0,
      trustStatus: "new",
      escrowRequired: true, // NEW SELLERS START WITH ESCROW
      firstSaleDate: Date.now(),
      lastSaleDate: Date.now(),
      lastReviewDate: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    const scores = this.getAllTrustScores()
    scores.push(newTrust)
    localStorage.setItem(this.TRUST_KEY, JSON.stringify(scores))
    return newTrust
  }

  static recordSale(sellerId: string): void {
    if (!this.isBrowser()) return
    const scores = this.getAllTrustScores()
    const index = scores.findIndex((s) => s.sellerId === sellerId)
    if (index === -1) return

    scores[index].totalSales++
    scores[index].lastSaleDate = Date.now()
    scores[index].updatedAt = Date.now()
    localStorage.setItem(this.TRUST_KEY, JSON.stringify(scores))
  }

  static recordSuccessfulDelivery(sellerId: string): void {
    if (!this.isBrowser()) return
    const scores = this.getAllTrustScores()
    const index = scores.findIndex((s) => s.sellerId === sellerId)
    if (index === -1) return

    scores[index].successfulDeliveries++

    // KEY LOGIC: After first successful delivery, disable escrow if no disputes/poor ratings
    if (
      scores[index].successfulDeliveries === 1 &&
      scores[index].disputes === 0 &&
      scores[index].poorShippingRatings === 0
    ) {
      scores[index].escrowRequired = false
      scores[index].trustStatus = "trusted"
      console.log("[v0] Seller graduated to instant payment!", { sellerId })
    }

    scores[index].updatedAt = Date.now()
    localStorage.setItem(this.TRUST_KEY, JSON.stringify(scores))
  }

  static addReview(review: Omit<Review, "id" | "createdAt" | "verified" | "helpful">): string {
    if (!this.isBrowser()) return ""

    const reviews = this.getAllReviews()
    const newReview: Review = {
      ...review,
      id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      verified: true,
      helpful: 0,
      createdAt: Date.now(),
    }
    reviews.push(newReview)
    localStorage.setItem(this.REVIEWS_KEY, JSON.stringify(reviews))

    // Update seller trust score with new review
    this.updateTrustScoreWithReview(review.sellerId, newReview)

    return newReview.id
  }

  private static updateTrustScoreWithReview(sellerId: string, review: Review): void {
    const scores = this.getAllTrustScores()
    const index = scores.findIndex((s) => s.sellerId === sellerId)
    if (index === -1) return

    // Update review averages
    const currentTotal = scores[index].averageRating * scores[index].totalReviews
    scores[index].totalReviews++
    scores[index].averageRating = (currentTotal + review.overallRating) / scores[index].totalReviews

    // Update shipping rating averages
    const currentShippingTotal = scores[index].averageShippingRating * scores[index].shippingRatingsCount
    scores[index].shippingRatingsCount++
    scores[index].averageShippingRating =
      (currentShippingTotal + review.shippingRating) / scores[index].shippingRatingsCount

    // Check for poor shipping rating (< 3 stars)
    if (review.shippingRating < 3) {
      scores[index].poorShippingRatings++

      // KEY LOGIC: 2 poor shipping ratings = back to escrow
      if (scores[index].poorShippingRatings >= 2) {
        scores[index].escrowRequired = true
        scores[index].trustStatus = "flagged"
        console.log("[v0] Seller flagged for poor shipping ratings - escrow re-enabled", { sellerId })
      }
    }

    scores[index].lastReviewDate = Date.now()
    scores[index].updatedAt = Date.now()
    localStorage.setItem(this.TRUST_KEY, JSON.stringify(scores))
  }

  static getAllReviews(): Review[] {
    if (!this.isBrowser()) return []
    const data = localStorage.getItem(this.REVIEWS_KEY)
    return data ? JSON.parse(data) : []
  }

  static getReviewsByProduct(productId: string): Review[] {
    return this.getAllReviews().filter((r) => r.productId === productId)
  }

  static getReviewsBySeller(sellerId: string): Review[] {
    return this.getAllReviews().filter((r) => r.sellerId === sellerId)
  }

  // Dispute Management
  static createDispute(dispute: Omit<Dispute, "id" | "createdAt" | "updatedAt" | "status">): string {
    if (!this.isBrowser()) return ""

    const disputes = this.getAllDisputes()
    const newDispute: Dispute = {
      ...dispute,
      id: `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "open",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    disputes.push(newDispute)
    localStorage.setItem(this.DISPUTES_KEY, JSON.stringify(disputes))

    // Update seller trust score
    this.flagSellerForDispute(dispute.sellerId)

    return newDispute.id
  }

  private static flagSellerForDispute(sellerId: string): void {
    const scores = this.getAllTrustScores()
    const index = scores.findIndex((s) => s.sellerId === sellerId)
    if (index === -1) return

    scores[index].disputes++
    scores[index].activeDisputes++

    // KEY LOGIC: Any dispute = back to escrow
    scores[index].escrowRequired = true
    scores[index].trustStatus = "flagged"
    console.log("[v0] Seller flagged for dispute - escrow re-enabled", { sellerId })

    scores[index].updatedAt = Date.now()
    localStorage.setItem(this.TRUST_KEY, JSON.stringify(scores))
  }

  static resolveDispute(
    disputeId: string,
    resolution: string,
    status: Dispute["status"],
    refundAmount?: number,
    resolvedBy?: string,
  ): boolean {
    if (!this.isBrowser()) return false

    const disputes = this.getAllDisputes()
    const index = disputes.findIndex((d) => d.id === disputeId)
    if (index === -1) return false

    disputes[index].status = status
    disputes[index].resolution = resolution
    disputes[index].refundAmount = refundAmount
    disputes[index].resolvedBy = resolvedBy
    disputes[index].resolvedAt = Date.now()
    disputes[index].updatedAt = Date.now()
    localStorage.setItem(this.DISPUTES_KEY, JSON.stringify(disputes))

    // Update seller trust score
    const scores = this.getAllTrustScores()
    const sellerIndex = scores.findIndex((s) => s.sellerId === disputes[index].sellerId)
    if (sellerIndex !== -1) {
      scores[sellerIndex].activeDisputes--
      scores[sellerIndex].updatedAt = Date.now()
      localStorage.setItem(this.TRUST_KEY, JSON.stringify(scores))
    }

    return true
  }

  static getAllDisputes(): Dispute[] {
    if (!this.isBrowser()) return []
    const data = localStorage.getItem(this.DISPUTES_KEY)
    return data ? JSON.parse(data) : []
  }

  static getDisputesByBuyer(buyerId: string): Dispute[] {
    return this.getAllDisputes().filter((d) => d.buyerId === buyerId)
  }

  static getDisputesBySeller(sellerId: string): Dispute[] {
    return this.getAllDisputes().filter((d) => d.sellerId === sellerId)
  }

  static getActiveDisputes(): Dispute[] {
    return this.getAllDisputes().filter((d) => d.status === "open" || d.status === "under_review")
  }

  // Helper: Check if escrow required for seller
  static isEscrowRequired(sellerId: string): boolean {
    const trust = this.getSellerTrust(sellerId)
    if (!trust) {
      // New seller - escrow required
      return true
    }
    return trust.escrowRequired
  }

  // Helper: Get seller trust badge
  static getTrustBadge(sellerId: string): {
    label: string
    variant: "default" | "secondary" | "destructive" | "outline"
    icon: string
  } {
    const trust = this.getSellerTrust(sellerId)
    if (!trust) {
      return { label: "New Seller", variant: "secondary", icon: "🆕" }
    }

    switch (trust.trustStatus) {
      case "trusted":
        return { label: "Trusted Seller", variant: "default", icon: "✓" }
      case "flagged":
        return { label: "Under Review", variant: "outline", icon: "⚠" }
      case "suspended":
        return { label: "Suspended", variant: "destructive", icon: "⛔" }
      default:
        return { label: "New Seller", variant: "secondary", icon: "🆕" }
    }
  }
}
