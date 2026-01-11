"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MarketplaceDB, type MarketplaceProduct } from "@/lib/marketplace-db"
import { Search, MapPin, ShoppingBag } from "@/lib/icons"
import Link from "next/link"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function MarketplacePage() {
  const { user, connectWallet } = usePiWallet()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null)
  const [locationFilter, setLocationFilter] = useState<"all" | "USA" | "International">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [businessFilter, setBusinessFilter] = useState<string>("all")
  const [pendingOffers, setPendingOffers] = useState(0)

  useEffect(() => {
    loadProducts()
    if (user) {
      checkPendingOffers()
    }

    const handleProductAdded = () => {
      console.log("[v0] Marketplace received product-added event, reloading...")
      loadProducts()
    }

    window.addEventListener("marketplace-product-added", handleProductAdded)

    return () => {
      window.removeEventListener("marketplace-product-added", handleProductAdded)
    }
  }, [user])

  const loadProducts = async () => {
    console.log("[v0] ========== MARKETPLACE - LOADING ALL PRODUCTS ==========")
    try {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const url = `/api/marketplace/products?_t=${timestamp}&_r=${random}`
      console.log("[v0] Fetching from:", url)

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("[v0] Response status:", response.status)

      const data = await response.json()

      if (data.error) {
        console.error("[v0] ❌ Error loading products:", data.error)
        return
      }

      console.log("[v0] ✓ Total products from database:", data.products.length)

      const dbProducts = data.products.map((p: any) => ({
        id: p.id,
        businessId: p.business_id,
        businessName: p.business_name,
        title: p.title,
        description: p.description,
        price: Number.parseFloat(p.price),
        priceUSD: Number.parseFloat(p.price_usd) || 0,
        images: p.images || [],
        photos3D: p.photos_3d || {},
        has3D: p.has_3d || false,
        colorVariants: p.color_variants || [],
        category: p.category,
        keywords: p.keywords || [],
        location: p.location || "",
        city: p.city || "",
        state: p.state || "",
        country: p.country || "",
        shippingRegions: p.shipping_regions || [],
        acceptsOffers: p.accepts_offers || false,
        offerRange: p.offer_range || null,
        stock: p.stock,
        condition: p.condition || "New",
        shipping: p.shipping || { available: false, cost: 0, estimatedDays: 0, service: "" },
        pickup: p.pickup || { available: false, address: "" },
        sales: p.sales || 0,
        views: p.views || 0,
        rating: 0,
        reviews: [],
      }))

      console.log("[v0] ✓ Products mapped and ready to display:", dbProducts.length)
      setProducts(dbProducts)
      console.log("[v0] ========== MARKETPLACE - LOADING COMPLETE ==========")
    } catch (error) {
      console.error("[v0] ❌ Error fetching products:", error)
    }
  }

  const checkPendingOffers = () => {
    if (!user) return
    const offers = MarketplaceDB.getOffersByBuyer(user.uid)
    const pending = offers.filter((o) => o.status === "accepted").length
    setPendingOffers(pending)
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      loadProducts()
      return
    }
    const results = MarketplaceDB.searchProducts(searchQuery)
    setProducts(results)
  }

  const applyFilters = () => {
    const filters: any = {}
    if (locationFilter !== "all") filters.location = locationFilter
    if (categoryFilter !== "all") filters.category = categoryFilter
    if (businessFilter !== "all") filters.business = businessFilter

    const filtered = MarketplaceDB.filterProducts(filters)
    setProducts(filtered)
  }

  const uniqueCategories = Array.from(new Set(MarketplaceDB.getAllProducts().map((p) => p.category)))
  const uniqueBusinesses = Array.from(
    new Set(MarketplaceDB.getAllProducts().map((p) => ({ id: p.businessId, name: p.businessName }))),
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-4 border-b-2 border-purple-500">
        <div className="container mx-auto px-4 flex gap-3 justify-center">
          <Link href="/marketplace" className="flex-1 max-w-xs">
            <Button
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl border-2 border-purple-400"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Marketplace
            </Button>
          </Link>
          <Link href="/arcade" className="flex-1 max-w-xs">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl border-2 border-cyan-300"
            >
              🕹️ Pi Arcade Legends
            </Button>
          </Link>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shopping Made Easy, All in Pi</h1>
          <p className="text-xl mb-6">Discover amazing products from Pi Network businesses worldwide</p>
          {user && (
            <Link href="/marketplace/account">
              <Button variant="secondary" size="lg" className="relative">
                My Account
                {pendingOffers > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    {pendingOffers}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search for products, keywords, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Select
              value={locationFilter}
              onValueChange={(v: any) => {
                setLocationFilter(v)
                applyFilters()
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="International">International</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v)
                applyFilters()
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={businessFilter}
              onValueChange={(v) => {
                setBusinessFilter(v)
                applyFilters()
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Businesses</SelectItem>
                {uniqueBusinesses.map((business) => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                MarketplaceDB.incrementViews(product.id)
                setSelectedProduct(product)
              }}
            >
              <CardContent className="p-4">
                {/* Main Product Image */}
                <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                  {product.images[0] ? (
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <h3 className="font-semibold line-clamp-2 mb-2">{product.title}</h3>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-primary">{product.price}π</span>
                  <Badge variant="secondary">{product.condition}</Badge>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3 mr-1" />
                  {product.location === "USA" ? `${product.city}, ${product.state}` : product.country}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1">{product.businessName}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          user={user}
          onConnectWallet={connectWallet}
        />
      )}
    </div>
  )
}
