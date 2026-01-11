export interface BusinessPackage {
  name: string
  setupFee: number
  listingFeeUSD: number // Changed to USD value
  transactionFeePercent: number
  hasPromo: boolean
  promoCode?: string // Added promo code tracking
  paidSetupFee: boolean // Track if setup fee was paid
}

export interface SaleRecord {
  id: string
  productId: string
  productTitle: string
  businessId: string
  saleAmount: number
  listingFee: number
  transactionFee: number
  netProfit: number
  soldAt: number
}

export interface SellerBalance {
  sellerId: string
  availableBalance: number // Net earnings available for withdrawal
  pendingBalance: number // Orders not yet delivered
  totalEarnings: number // Lifetime earnings
  totalWithdrawn: number // Total amount withdrawn
  lastUpdated: number
}

export class BusinessFeesManager {
  private static PACKAGES_KEY = "business_packages"
  private static SALES_HISTORY_KEY = "sales_history"
  private static SELLER_BALANCES_KEY = "seller_balances" // New key for seller balances
  private static APP_WALLET_KEY = "app_platform_wallet" // New key for platform earnings

  private static isBrowser(): boolean {
    return typeof window !== "undefined" && typeof localStorage !== "undefined"
  }

  static getBusinessPackage(businessId: string): BusinessPackage {
    if (!this.isBrowser()) {
      return {
        name: "No Setup Fee Package",
        setupFee: 0,
        listingFeeUSD: 0.5, // Default to higher fee if no setup fee paid
        transactionFeePercent: 5,
        hasPromo: false,
        paidSetupFee: false,
      }
    }

    const packagesData = localStorage.getItem(this.PACKAGES_KEY)
    const packages = packagesData ? JSON.parse(packagesData) : {}

    return (
      packages[businessId] || {
        name: "No Setup Fee Package",
        setupFee: 0,
        listingFeeUSD: 0.5,
        transactionFeePercent: 5,
        hasPromo: false,
        paidSetupFee: false,
      }
    )
  }

  static setBusinessPackage(businessId: string, packageData: BusinessPackage): void {
    if (!this.isBrowser()) return

    const packagesData = localStorage.getItem(this.PACKAGES_KEY)
    const packages = packagesData ? JSON.parse(packagesData) : {}

    packages[businessId] = packageData
    localStorage.setItem(this.PACKAGES_KEY, JSON.stringify(packages))
  }

  static calculateListingFee(businessId: string, piPrice: number): number {
    const pkg = this.getBusinessPackage(businessId)

    if (pkg.hasPromo) {
      return 0 // Owner account - completely free
    }

    if (pkg.promoCode === "QUADSTATE") {
      return 0.0001 // QUADSTATE promo - nominal test fee
    }

    // Convert USD fee to Pi
    const listingFeeUSD = pkg.listingFeeUSD
    return piPrice > 0 ? listingFeeUSD / piPrice : 0
  }

  static calculateTransactionFee(businessId: string, saleAmount: number): number {
    const pkg = this.getBusinessPackage(businessId)

    if (pkg.hasPromo) {
      return 0 // Owner account - no fees
    }

    if (pkg.promoCode === "QUADSTATE") {
      return saleAmount * 0.0001 // QUADSTATE promo - 0.01% fee
    }

    return (saleAmount * pkg.transactionFeePercent) / 100
  }

  static getSellerBalance(sellerId: string): SellerBalance {
    if (!this.isBrowser()) {
      return {
        sellerId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        lastUpdated: Date.now(),
      }
    }

    const balancesData = localStorage.getItem(this.SELLER_BALANCES_KEY)
    const balances = balancesData ? JSON.parse(balancesData) : {}

    return (
      balances[sellerId] || {
        sellerId,
        availableBalance: 0,
        pendingBalance: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        lastUpdated: Date.now(),
      }
    )
  }

  static updateSellerBalance(sellerId: string, amount: number, status: "pending" | "available"): void {
    if (!this.isBrowser()) return

    const balance = this.getSellerBalance(sellerId)

    if (status === "pending") {
      balance.pendingBalance += amount
    } else {
      balance.availableBalance += amount
      balance.totalEarnings += amount
    }

    balance.lastUpdated = Date.now()

    const balancesData = localStorage.getItem(this.SELLER_BALANCES_KEY)
    const balances = balancesData ? JSON.parse(balancesData) : {}
    balances[sellerId] = balance
    localStorage.setItem(this.SELLER_BALANCES_KEY, JSON.stringify(balances))
  }

  static releasePendingFunds(sellerId: string, amount: number): void {
    if (!this.isBrowser()) return

    const balance = this.getSellerBalance(sellerId)
    balance.pendingBalance = Math.max(0, balance.pendingBalance - amount)
    balance.availableBalance += amount
    balance.lastUpdated = Date.now()

    const balancesData = localStorage.getItem(this.SELLER_BALANCES_KEY)
    const balances = balancesData ? JSON.parse(balancesData) : {}
    balances[sellerId] = balance
    localStorage.setItem(this.SELLER_BALANCES_KEY, JSON.stringify(balances))
  }

  static recordPlatformEarnings(amount: number, source: string): void {
    if (!this.isBrowser()) return

    const walletData = localStorage.getItem(this.APP_WALLET_KEY)
    const wallet = walletData ? JSON.parse(walletData) : { balance: 0, transactions: [] }

    wallet.balance += amount
    wallet.transactions.push({
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      source,
      timestamp: Date.now(),
    })

    localStorage.setItem(this.APP_WALLET_KEY, JSON.stringify(wallet))
  }

  static getPlatformWallet(): { balance: number; transactions: any[] } {
    if (!this.isBrowser()) return { balance: 0, transactions: [] }

    const walletData = localStorage.getItem(this.APP_WALLET_KEY)
    return walletData ? JSON.parse(walletData) : { balance: 0, transactions: [] }
  }

  static recordSale(
    businessId: string,
    productId: string,
    productTitle: string,
    saleAmount: number,
    transactionFee?: number,
  ): string {
    if (!this.isBrowser()) return ""

    const calculatedTransactionFee = transactionFee ?? this.calculateTransactionFee(businessId, saleAmount)
    const netProfit = saleAmount - calculatedTransactionFee

    const sale: SaleRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId,
      productTitle,
      businessId,
      saleAmount,
      listingFee: 0,
      transactionFee: calculatedTransactionFee,
      netProfit,
      soldAt: Date.now(),
    }

    const salesData = localStorage.getItem(this.SALES_HISTORY_KEY)
    const allSales = salesData ? JSON.parse(salesData) : []
    allSales.push(sale)
    localStorage.setItem(this.SALES_HISTORY_KEY, JSON.stringify(allSales))

    this.updateSellerBalance(businessId, netProfit, "pending")

    this.recordPlatformEarnings(calculatedTransactionFee, `Marketplace sale: ${productTitle}`)

    return sale.id
  }

  static getSalesHistory(businessId: string): SaleRecord[] {
    if (!this.isBrowser()) return []

    const salesData = localStorage.getItem(this.SALES_HISTORY_KEY)
    const allSales = salesData ? JSON.parse(salesData) : []
    return allSales.filter((sale: SaleRecord) => sale.businessId === businessId)
  }

  static getBusinessStats(businessId: string): {
    totalSales: number
    totalListingFees: number
    totalTransactionFees: number
    totalNetProfit: number
  } {
    const sales = this.getSalesHistory(businessId)
    return {
      totalSales: sales.reduce((sum, s) => sum + s.saleAmount, 0),
      totalListingFees: sales.reduce((sum, s) => sum + s.listingFee, 0),
      totalTransactionFees: sales.reduce((sum, s) => sum + s.transactionFee, 0),
      totalNetProfit: sales.reduce((sum, s) => sum + s.netProfit, 0),
    }
  }
}
