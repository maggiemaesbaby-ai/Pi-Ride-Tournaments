"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MarketplaceDB, type MarketplaceProduct } from "@/lib/marketplace-db"
import { BusinessMapManager } from "@/lib/business-map-manager"
import { Store, MapPin, Phone, Mail, Globe, ArrowLeft, ShoppingBag } from "lucide-react"
import { ProductDetailsModal } from "@/components/product-details-modal"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { FurnitureShowroom } from "@/components/furniture-showroom" // Assuming FurnitureShowroom component exists

export default function ShopPage() {
  const params = useParams()
  const router = useRouter()
  const { user, connect } = usePiWallet()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<any>(null)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null)
  const [shopSettings, setShopSettings] = useState<any>(null)

  useEffect(() => {
    console.log("[v0] Shop page loading", { businessId })
    loadShopProducts()
  }, [businessId])

  const loadShopProducts = async () => {
    try {
      // Fetch products from the database API with businessId filter
      const response = await fetch(`/api/marketplace/products?businessId=${businessId}`)
      const data = await response.json()

      if (data.error) {
        console.error("[v0] Error loading shop products:", data.error)
        return
      }

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
        model3D: p.model_3d || "",
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

      console.log("[v0] Loaded shop products from database:", dbProducts.length)
      setProducts(dbProducts)

      if (dbProducts.length > 0) {
        // Create business object from product data
        const businessData = {
          id: businessId,
          businessId: businessId,
          businessName: dbProducts[0].businessName || "Shop",
          category: "Marketplace",
          address: "",
          city: dbProducts[0].city || "",
          state: dbProducts[0].state || "",
          coordinates: { lat: 0, lng: 0 },
          piWalletAddress: businessId,
          approved: true,
          createdAt: new Date().toISOString(),
        }

        console.log("[v0] Created business from products:", businessData)
        setBusiness(businessData)
      } else {
        // Try BusinessMapManager as fallback
        const businessData = BusinessMapManager.getBusiness(businessId)
        console.log("[v0] Business data from BusinessMapManager:", !!businessData, businessData)

        if (!businessData) {
          console.error("[v0] Business not found - ID:", businessId)
        }

        setBusiness(businessData)
      }

      const savedSettings = localStorage.getItem(`shop_settings_${businessId}`)
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        console.log("[v0] Loaded shop settings:", settings)
        setShopSettings(settings)
      }
    } catch (error) {
      console.error("[v0] Error fetching shop products:", error)
    }
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Shop Not Found</h1>
          <p className="text-muted-foreground mb-4">The shop with ID "{businessId}" could not be found.</p>
          <Button onClick={() => router.push("/marketplace")}>Back to Marketplace</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Shop Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-12">
        <div className="container mx-auto px-4">
          <Button variant="secondary" onClick={() => router.push("/marketplace")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-purple-600 text-4xl font-bold shadow-lg">
              π
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{business.businessName}</h1>
              <Badge variant="secondary" className="mb-4">
                {business.category}
              </Badge>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {business.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {business.address}, {business.city}, {business.state}
                    </span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{business.email}</span>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="underline">
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {business.description && <p className="mt-6 text-lg">{business.description}</p>}
        </div>
      </div>

      {/* Products */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Shop Products ({products.length})</h2>

        {products.length > 0 ? (
          shopSettings?.template === "showroom" ? (
            <FurnitureShowroom
              products={products}
              onSelectProduct={(product) => {
                MarketplaceDB.incrementViews(product.id)
                setSelectedProduct(product)
              }}
            />
          ) : (
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

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">{product.price}π</span>
                      <Badge variant="secondary">{product.condition}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card className="p-12 text-center">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
            <p className="text-muted-foreground">This shop hasn't listed any products yet. Check back soon!</p>
          </Card>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          user={user}
          onConnectWallet={connect}
        />
      )}
    </div>
  )
}
