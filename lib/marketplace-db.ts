export interface MarketplaceProduct {
  id: string
  businessId: string
  businessName: string
  title: string
  description: string
  price: number // in Pi
  priceUSD?: number // Added USD price storage
  images: string[]
  photos3D?: {
    front?: string
    side?: string
    top?: string
    angle45?: string
  }
  has3D?: boolean
  colorVariants?: ColorVariant[]
  selectedColor?: string
  category: string
  keywords: string[]
  location: "USA" | "International"
  city?: string
  state?: string
  country: string
  acceptsOffers: boolean
  offerRange?: {
    min: number
    max: number
  }
  stock: number
  condition: "New" | "Used" | "Refurbished"
  shipping: {
    available: boolean
    cost: number
    estimatedDays: string
    service?: string // Added delivery service field
  }
  pickup: {
    available: boolean
    address: string
  }
  createdAt: number
  updatedAt: number
  views: number
  sales: number
}

export interface Offer {
  id: string
  productId: string
  buyerId: string
  buyerUsername: string
  sellerId: string
  amount: number // in Pi
  message?: string
  status: "pending" | "accepted" | "rejected" | "countered" | "cancelled" | "expired"
  counterOffer?: number
  createdAt: number
  expiresAt: number
}

export interface Order {
  id: string
  productId: string
  buyerId: string
  sellerId: string
  amount: number
  platformFee: number // Fee kept by the app
  sellerEarnings: number // Amount seller receives
  shipping: boolean
  pickup: boolean
  shippingAddress?: {
    id: string
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
    isDefault: boolean
  }
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  trackingNumber?: string
  createdAt: number
  updatedAt: number
  buyerNotified?: boolean
  sellerNotified?: boolean
  adminNotified?: boolean
  refundStatus?: "none" | "requested" | "approved" | "rejected" | "completed"
  refundRequestId?: string
}

export interface RefundRequest {
  id: string
  orderId: string
  productId: string
  buyerId: string
  sellerId: string
  requestedAmount: number // Amount buyer wants refunded
  reason: string
  description: string // Detailed explanation from buyer
  images?: string[] // Optional photos of damaged/wrong items
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled"
  sellerResponse?: string
  approvedAmount?: number // May differ from requested if partial refund
  createdAt: number
  updatedAt: number
  resolvedAt?: number
}

export interface ColorVariant {
  name: string
  hex: string
  photos3D?: {
    front?: string
    side?: string
    top?: string
    angle45?: string
  }
}

export class MarketplaceDB {
  private static PRODUCTS_KEY = "marketplace_products"
  private static OFFERS_KEY = "marketplace_offers"
  private static ORDERS_KEY = "marketplace_orders"
  private static PROTECTED_LISTINGS_KEY = "marketplace_protected_listings"
  private static PRODUCTS_BACKUP_KEY = "marketplace_products_backup"
  private static REFUND_REQUESTS_KEY = "marketplace_refund_requests"

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  private static backupProducts(products: MarketplaceProduct[]): void {
    if (!this.isBrowser() || products.length === 0) return
    try {
      localStorage.setItem(this.PRODUCTS_BACKUP_KEY, JSON.stringify(products))
      console.log("[v0] MarketplaceDB - Backed up", products.length, "products")
    } catch (error) {
      console.error("[v0] MarketplaceDB - Backup failed:", error)
    }
  }

  private static restoreFromBackup(): MarketplaceProduct[] {
    if (!this.isBrowser()) return []
    try {
      const backupData = localStorage.getItem(this.PRODUCTS_BACKUP_KEY)
      if (backupData) {
        const products = JSON.parse(backupData)
        console.log("[v0] MarketplaceDB - Restored", products.length, "products from backup")
        return products
      }
    } catch (error) {
      console.error("[v0] MarketplaceDB - Restore from backup failed:", error)
    }
    return []
  }

  private static initializeDefaultProducts(businessId?: string): MarketplaceProduct[] {
    console.log("[v0] MarketplaceDB - Initializing default products with businessId:", businessId)
    const defaultProducts: MarketplaceProduct[] = [
      {
        id: `prod_${Date.now()}_default1`,
        businessId: businessId || "default_business", // Use provided businessId or fallback
        businessName: "Pi Ride Marketplace",
        title: "test",
        description:
          "This is a protected test listing that demonstrates the marketplace functionality with 3D viewing capability.",
        price: 1,
        images: ["/generic-product-display.png"],
        photos3D: {
          front: undefined,
          side: undefined,
          top: undefined,
          angle45: undefined,
        },
        has3D: true,
        category: "Electronics",
        keywords: ["test", "sample", "demo", "3d"],
        location: "USA",
        country: "USA",
        acceptsOffers: true,
        offerRange: { min: 0.5, max: 1.5 },
        stock: 10,
        condition: "New",
        shipping: {
          available: true,
          cost: 0.1,
          estimatedDays: "3-5",
        },
        pickup: {
          available: true,
          address: "Sample Location",
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        views: 0,
        sales: 0,
      },
    ]

    const protectedTitles = ["test"]
    localStorage.setItem(this.PROTECTED_LISTINGS_KEY, JSON.stringify(protectedTitles))

    return defaultProducts
  }

  // Product Management
  static addProduct(product: Omit<MarketplaceProduct, "id" | "createdAt" | "updatedAt" | "views" | "sales">): string {
    if (!this.isBrowser()) return ""

    const products = this.getAllProducts()
    const newProduct: MarketplaceProduct = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      views: 0,
      sales: 0,
    }
    products.push(newProduct)
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products))
    this.backupProducts(products)

    if (product.title.toLowerCase() === "test") {
      const protectedData = localStorage.getItem(this.PROTECTED_LISTINGS_KEY)
      const protectedTitles = protectedData ? JSON.parse(protectedData) : []
      if (!protectedTitles.includes("test")) {
        protectedTitles.push("test")
        localStorage.setItem(this.PROTECTED_LISTINGS_KEY, JSON.stringify(protectedTitles))
      }
    }

    return newProduct.id
  }

  static getAllProducts(ownerBusinessId?: string): MarketplaceProduct[] {
    if (!this.isBrowser()) return []

    console.log("[v0] MarketplaceDB.getAllProducts - Checking localStorage")
    const data = localStorage.getItem(this.PRODUCTS_KEY)
    console.log("[v0] MarketplaceDB.getAllProducts - Raw data:", data ? "Found" : "null")

    if (!data) {
      console.log("[v0] MarketplaceDB.getAllProducts - No products found, attempting recovery")

      let products = this.restoreFromBackup()

      if (products.length === 0) {
        products = this.initializeDefaultProducts(ownerBusinessId)
      }

      if (products.length > 0) {
        localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products))
        console.log("[v0] MarketplaceDB.getAllProducts - Restored/Initialized", products.length, "products")
      }

      return products
    }

    const products = JSON.parse(data)
    console.log("[v0] MarketplaceDB.getAllProducts - Parsed products count:", products.length)

    if (products.length > 0) {
      this.backupProducts(products)
    }

    return products
  }

  static getProduct(id: string): MarketplaceProduct | null {
    const products = this.getAllProducts()
    return products.find((p) => p.id === id) || null
  }

  static getProductsByBusiness(businessId: string): MarketplaceProduct[] {
    const allProducts = this.getAllProducts(businessId)
    console.log("[v0] MarketplaceDB.getProductsByBusiness - businessId:", businessId)
    console.log("[v0] MarketplaceDB.getProductsByBusiness - Total products:", allProducts.length)
    const filtered = allProducts.filter((p) => p.businessId === businessId)
    console.log("[v0] MarketplaceDB.getProductsByBusiness - Filtered products:", filtered.length)
    return filtered
  }

  static searchProducts(query: string): MarketplaceProduct[] {
    const products = this.getAllProducts()
    const lowerQuery = query.toLowerCase()
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.keywords.some((k) => k.toLowerCase().includes(lowerQuery)) ||
        p.category.toLowerCase().includes(lowerQuery),
    )
  }

  static filterProducts(filters: {
    location?: "USA" | "International"
    business?: string
    category?: string
    minPrice?: number
    maxPrice?: number
  }): MarketplaceProduct[] {
    let products = this.getAllProducts()

    if (filters.location) {
      products = products.filter((p) => p.location === filters.location)
    }
    if (filters.business) {
      products = products.filter((p) => p.businessId === filters.business)
    }
    if (filters.category) {
      products = products.filter((p) => p.category === filters.category)
    }
    if (filters.minPrice !== undefined) {
      products = products.filter((p) => p.price >= filters.minPrice!)
    }
    if (filters.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= filters.maxPrice!)
    }

    return products
  }

  static updateProduct(id: string, updates: Partial<MarketplaceProduct>): boolean {
    if (!this.isBrowser()) return false

    const products = this.getAllProducts()
    const index = products.findIndex((p) => p.id === id)
    if (index === -1) return false

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: Date.now(),
    }
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products))
    this.backupProducts(products)
    return true
  }

  static incrementViews(id: string): void {
    const product = this.getProduct(id)
    if (product) {
      this.updateProduct(id, { views: product.views + 1 })
    }
  }

  static deleteProduct(id: string): boolean {
    if (!this.isBrowser()) return false

    const product = this.getProduct(id)
    if (product && this.isProtectedListing(product.title)) {
      console.log(`[v0] Product "${product.title}" is protected and cannot be deleted`)
      return false
    }

    const products = this.getAllProducts()
    const filtered = products.filter((p) => p.id !== id)
    if (filtered.length === products.length) return false
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(filtered))
    this.backupProducts(filtered)
    return true
  }

  // Offer Management
  static createOffer(offer: Omit<Offer, "id" | "createdAt" | "expiresAt" | "status">): string {
    if (!this.isBrowser()) return ""

    const offers = this.getAllOffers()
    const newOffer: Offer = {
      ...offer,
      id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + 48 * 60 * 60 * 1000, // 48 hours
    }
    offers.push(newOffer)
    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))
    return newOffer.id
  }

  static getAllOffers(): Offer[] {
    if (!this.isBrowser()) return []

    const data = localStorage.getItem(this.OFFERS_KEY)
    return data ? JSON.parse(data) : []
  }

  static getOffer(id: string): Offer | null {
    const offers = this.getAllOffers()
    return offers.find((o) => o.id === id) || null
  }

  static getOffersByBuyer(buyerId: string): Offer[] {
    return this.getAllOffers().filter((o) => o.buyerId === buyerId)
  }

  static getOffersBySeller(sellerId: string): Offer[] {
    return this.getAllOffers().filter((o) => o.sellerId === sellerId)
  }

  static updateOfferStatus(id: string, status: Offer["status"], counterOffer?: number): boolean {
    if (!this.isBrowser()) return false

    const offers = this.getAllOffers()
    const index = offers.findIndex((o) => o.id === id)
    if (index === -1) return false

    offers[index].status = status
    if (counterOffer !== undefined) {
      offers[index].counterOffer = counterOffer
    }
    localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))
    return true
  }

  static checkExpiredOffers(): void {
    if (!this.isBrowser()) return

    const offers = this.getAllOffers()
    const now = Date.now()
    let updated = false

    offers.forEach((offer) => {
      if (offer.status === "pending" && offer.expiresAt < now) {
        offer.status = "expired"
        updated = true
      }
    })

    if (updated) {
      localStorage.setItem(this.OFFERS_KEY, JSON.stringify(offers))
    }
  }

  // Order Management
  static createOrder(
    order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status" | "platformFee" | "sellerEarnings">,
  ): string {
    if (!this.isBrowser()) return ""

    const orders = this.getAllOrders()

    // Import business fee manager to get seller's fee structure
    const { BusinessFeesManager } = require("./business-fees")
    const platformFee = BusinessFeesManager.calculateTransactionFee(order.sellerId, order.amount)
    const sellerEarnings = order.amount - platformFee

    const newOrder: Order = {
      ...order,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "paid",
      platformFee,
      sellerEarnings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    orders.push(newOrder)
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders))

    // Record the sale with fees in seller's sales history
    BusinessFeesManager.recordSale(
      order.sellerId,
      order.productId,
      "Product Sale", // Will be updated with actual product title
      order.amount,
      platformFee,
    )

    // Increment product sales count
    const product = this.getProduct(order.productId)
    if (product) {
      this.updateProduct(order.productId, {
        sales: product.sales + 1,
        stock: Math.max(0, product.stock - 1),
      })
    }

    return newOrder.id
  }

  static getAllOrders(): Order[] {
    if (!this.isBrowser()) return []

    const data = localStorage.getItem(this.ORDERS_KEY)
    return data ? JSON.parse(data) : []
  }

  static getOrder(id: string): Order | null {
    const orders = this.getAllOrders()
    return orders.find((o) => o.id === id) || null
  }

  static getOrdersByBuyer(buyerId: string): Order[] {
    return this.getAllOrders().filter((o) => o.buyerId === buyerId)
  }

  static getOrdersBySeller(sellerId: string): Order[] {
    return this.getAllOrders().filter((o) => o.sellerId === sellerId)
  }

  static updateOrderStatus(id: string, status: Order["status"], trackingNumber?: string): boolean {
    if (!this.isBrowser()) return false

    const orders = this.getAllOrders()
    const index = orders.findIndex((o) => o.id === id)
    if (index === -1) return false

    orders[index].status = status
    orders[index].updatedAt = Date.now()
    if (trackingNumber) {
      orders[index].trackingNumber = trackingNumber
    }
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders))
    return true
  }

  static updateOrder(id: string, updates: Partial<Omit<Order, "id" | "createdAt">>): boolean {
    if (!this.isBrowser()) return false

    const orders = this.getAllOrders()
    const index = orders.findIndex((o) => o.id === id)
    if (index === -1) return false

    orders[index] = {
      ...orders[index],
      ...updates,
      updatedAt: Date.now(),
    }
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders))
    return true
  }

  // Refund Request Management
  static createRefundRequest(request: Omit<RefundRequest, "id" | "createdAt" | "updatedAt" | "status">): string {
    if (!this.isBrowser()) return ""

    const requests = this.getAllRefundRequests()
    const newRequest: RefundRequest = {
      ...request,
      id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    requests.push(newRequest)
    localStorage.setItem(this.REFUND_REQUESTS_KEY, JSON.stringify(requests))

    // Update order refund status
    this.updateOrder(request.orderId, {
      refundStatus: "requested",
      refundRequestId: newRequest.id,
    })

    return newRequest.id
  }

  static getAllRefundRequests(): RefundRequest[] {
    if (!this.isBrowser()) return []
    const data = localStorage.getItem(this.REFUND_REQUESTS_KEY)
    return data ? JSON.parse(data) : []
  }

  static getRefundRequest(id: string): RefundRequest | null {
    const requests = this.getAllRefundRequests()
    return requests.find((r) => r.id === id) || null
  }

  static getRefundRequestsByBuyer(buyerId: string): RefundRequest[] {
    return this.getAllRefundRequests().filter((r) => r.buyerId === buyerId)
  }

  static getRefundRequestsBySeller(sellerId: string): RefundRequest[] {
    return this.getAllRefundRequests().filter((r) => r.sellerId === sellerId)
  }

  static getRefundRequestByOrder(orderId: string): RefundRequest | null {
    const requests = this.getAllRefundRequests()
    return requests.find((r) => r.orderId === orderId) || null
  }

  static updateRefundRequest(id: string, updates: Partial<Omit<RefundRequest, "id" | "createdAt">>): boolean {
    if (!this.isBrowser()) return false

    const requests = this.getAllRefundRequests()
    const index = requests.findIndex((r) => r.id === id)
    if (index === -1) return false

    requests[index] = {
      ...requests[index],
      ...updates,
      updatedAt: Date.now(),
    }

    if (updates.status === "approved" || updates.status === "rejected" || updates.status === "completed") {
      requests[index].resolvedAt = Date.now()
    }

    localStorage.setItem(this.REFUND_REQUESTS_KEY, JSON.stringify(requests))

    // Update order refund status
    const order = this.getOrder(requests[index].orderId)
    if (order) {
      let orderRefundStatus: Order["refundStatus"] = "requested"
      if (updates.status === "approved") orderRefundStatus = "approved"
      if (updates.status === "rejected") orderRefundStatus = "rejected"
      if (updates.status === "completed") orderRefundStatus = "completed"
      if (updates.status === "cancelled") orderRefundStatus = "none"

      this.updateOrder(requests[index].orderId, { refundStatus: orderRefundStatus })
    }

    return true
  }

  static isProtectedListing(title: string): boolean {
    if (!this.isBrowser()) return false
    const data = localStorage.getItem(this.PROTECTED_LISTINGS_KEY)
    const protectedTitles = data ? JSON.parse(data) : []
    return protectedTitles.includes(title.toLowerCase())
  }
}
