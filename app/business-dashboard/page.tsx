"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { useCurrency } from "@/contexts/currency-provider"
import { MarketplaceDB, type MarketplaceProduct } from "@/lib/marketplace-db"
import {
  Store,
  Plus,
  Edit,
  Trash2,
  Copy,
  DollarSign,
  Package,
  TrendingUp,
  ArrowLeft,
  Shield,
  MapPin,
  Truck,
  AlertTriangle, // Import AlertTriangle
  Wallet, // Import Wallet icon
} from "@/lib/icons"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { BusinessFeesManager } from "@/lib/business-fees"
import { SoldOutDialog } from "@/components/sold-out-dialog" // Import SoldOutDialog
import { ProductDetailsModal } from "@/components/product-details-modal" // Import ProductDetailsModal
import { BusinessMapManager } from "@/lib/business-map-manager" // Import BusinessMapManager
import { Header } from "@/components/header" // Assuming Header component is needed for the full layout
import { ShopOwnerBalanceDashboard } from "@/components/shop-owner-balance-dashboard"
import { SellerRefundManager } from "@/components/seller-refund-manager"
import { ReturnRateWarningBanner } from "@/components/return-rate-warning-banner"

// Import the Pi SDK
// const piSDK = typeof window !== "undefined" && (window as any).Pi ? (window as any).Pi : null

// Define the owner wallet address (replace with your actual Pi wallet address or load from env)
const OWNER_WALLET_ADDRESS = process.env.NEXT_PUBLIC_OWNER_WALLET_ADDRESS || "YOUR_PI_WALLET_ADDRESS_HERE"

// Helper function to check if a user is the owner
const isOwner = (userId?: string): boolean => {
  return userId === OWNER_WALLET_ADDRESS
}

const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing & Fashion",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Health & Beauty",
  "Automotive",
  "Jewelry & Accessories",
  "Food & Beverage",
  "Art & Collectibles",
  "Tools & Hardware",
  "Pet Supplies",
  "Office Supplies",
  "Musical Instruments",
  "Furniture",
  "Baby & Kids",
  "Produce & Groceries",
]

const SHOP_TEMPLATES = [
  { id: "modern", name: "Modern Storefront", description: "Clean, minimalist design" },
  { id: "grocery", name: "Grocery Store", description: "Perfect for produce & food items" },
  { id: "boutique", name: "Boutique Shop", description: "Elegant fashion showcase" },
  { id: "showroom", name: "Furniture Showroom", description: "3D product display" },
]

const SHIPPING_COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Austria",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Poland",
  "Czech Republic",
  "Portugal",
  "Greece",
  "Ireland",
  "Australia",
  "New Zealand",
  "Japan",
  "South Korea",
  "Singapore",
  "Hong Kong",
  "Taiwan",
  "Philippines",
  "Malaysia",
  "Thailand",
  "Vietnam",
  "Indonesia",
  "India",
  "United Arab Emirates",
  "Saudi Arabia",
  "Turkey",
  "Israel",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Brazil",
  "Argentina",
  "Chile",
  "Mexico",
  "Colombia",
  "Peru",
]

// Dummy functions for payment flow simulation (replace with actual Pi SDK integration)
// In a real app, these would interact with your backend and Pi SDK
const savePaymentRecord = (record: any) => {
  console.log("[v0] Saving payment record:", record)
  // Simulate saving to a local store or backend
  return { ...record, id: `pay_${Date.now()}` }
}
const updatePaymentStatus = (userId: string, paymentId: string, status: string, txid?: string) => {
  console.log(`[v0] Updating payment ${paymentId} for user ${userId} to status: ${status}`, { txid })
  // Simulate updating payment status
}

const compressImage = (base64String: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      let width = img.width
      let height = img.height

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Compress to JPEG with 0.7 quality
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
      resolve(compressedBase64)
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = base64String
  })
}

// Define Order type (add this if not already defined elsewhere)
type Order = {
  id: string
  productId: string
  sellerId: string
  buyerId: string
  amount: number
  createdAt: string
  status: "paid" | "shipped" | "delivered" | "cancelled"
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    zipCode: string
    country: string
    phone: string
  } | null
  pickup: {
    address: string
    available: boolean
  } | null
  shipping?: {
    service: string
    estimatedDays: string
  }
  trackingNumber?: string
}

// Define NewProduct type for the product form state
type NewProduct = {
  title: string
  description: string
  priceUSD: string
  pricePi: string
  category: string
  keywords: string
  location: "USA" | "International"
  city: string
  state: string
  country: string
  shippingRegions: string[]
  acceptsOffers: boolean
  offerMin: string
  stock: string
  condition: "New" | "Used" | "Refurbished"
  shippingAvailable: boolean
  shippingCost: string
  shippingDays: string
  shippingService: "usps" | "ups" | "fedex" | "dhl" | "owner-delivery" | "other"
  shippingServiceOther: string
  pickupAvailable: boolean
  pickupAddress: string
  images: string[]
  photos3D: { front?: string; right?: string; top?: string; left?: string } // Updated field names
  colorVariants: Array<{ name: string; hex: string; photos3D?: any }>
  enable3D: boolean
  model3DUrl: string
}

export default function BusinessDashboardPage() {
  const { isConnected, connect, user: piUser, isConnecting } = usePiWallet()
  const { toast } = useToast()
  const { formatPriceWithUSD, piPrice } = useCurrency()

  console.log("[v0] Business Dashboard - piUser:", piUser)
  console.log("[v0] Business Dashboard - piUser.uid:", piUser?.uid)

  // CHANGE: Simplified owner check - just verify env var is configured
  // const userIsOwner = useMemo(() => {
  //   const ownerWallet = OWNER_WALLET_ADDRESS
  //   const hasOwnerConfigured = ownerWallet && ownerWallet !== "GJoqXsJ15u31MRNqjKzQKcjCNNnmjMvWQeWkK3iQF8A8Ykj"
  //   console.log("[v0] Admin button check - Owner wallet:", ownerWallet)
  //   console.log("[v0] Admin button check - Owner configured:", hasOwnerConfigured)
  //   return hasOwnerConfigured
  // }, [])
  // /** rest of code here **/

  // CHANGE: Always show admin button - removed complex check
  // const userIsOwner = true // REMOVED: Replaced with isOwner(piUser?.uid) check

  const userIsOwner = isOwner(piUser?.uid)

  console.log("[v0] Final userIsOwner:", userIsOwner)

  const router = useRouter()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [refundRequests, setRefundRequests] = useState<any[]>([]) // Added state for refund requests
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null)
  const [original3DImages, setOriginal3DImages] = useState<any>({})
  const [shopSettings, setShopSettings] = useState({
    name: "",
    template: "modern",
    displayMode: "standard" as "standard" | "3d",
  })
  const [productForm, setProductForm] = useState<NewProduct>({
    // Use NewProduct type
    title: "",
    description: "",
    priceUSD: "", // Changed from 'price' to 'priceUSD' to store USD value
    pricePi: "", // Added Pi price field that auto-calculates
    category: "",
    keywords: "",
    location: "USA" as "USA" | "International",
    city: "",
    state: "",
    country: "United States",
    shippingRegions: [] as string[], // Countries seller will ship to
    acceptsOffers: false,
    offerMin: "", // Removed offerMax, keeping only minimum offer
    stock: "1",
    condition: "New" as "New" | "Used" | "Refurbished",
    shippingAvailable: true,
    shippingCost: "0",
    shippingDays: "3-5", // Enhanced shipping days selection
    shippingService: "owner-delivery" as "usps" | "ups" | "fedex" | "dhl" | "owner-delivery" | "other", // Added delivery service selection
    shippingServiceOther: "", // Custom delivery service name
    pickupAvailable: false,
    pickupAddress: "",
    images: [] as string[],
    photos3D: {} as { front?: string; right?: string; top?: string; left?: string }, // Updated field names
    colorVariants: [] as Array<{ name: string; hex: string; photos3D?: any }>,
    enable3D: false, // Add enable3D option
    model3DUrl: "", // Store generated 3D model URL
  })
  const [businessPackage, setBusinessPackage] = useState<any>(null)
  const [salesHistory, setSalesHistory] = useState<any[]>([])
  const [showListingFeeDialog, setShowListingFeeDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false) // Renamed from showListingSuccessDialog
  const [pendingProduct, setPendingProduct] = useState<any>(null)
  const [listingPromoCode, setListingPromoCode] = useState("")
  const [listingPromoApplied, setListingPromoApplied] = useState(false)
  const [listedProductId, setListedProductId] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string[]>([])
  const [photos3DPreview, setPhotos3DPreview] = useState<any>({})
  const [newlyListedProduct, setNewlyListedProduct] = useState<any>(null) // Added to store details for success screen
  const [successProduct, setSuccessProduct] = useState<any>(null) // Added for success dialog

  const [isMounted, setIsMounted] = useState(false)

  const [calculatedListingFee, setCalculatedListingFee] = useState(0)

  const [soldOutProduct, setSoldOutProduct] = useState<MarketplaceProduct | null>(null)
  const [showSoldOutDialog, setShowSoldOutDialog] = useState(false)

  // Add state for payment related dialogs
  const [showListingPayment, setShowListingPayment] = useState(false)
  const [currentProductForPayment, setCurrentProductForPayment] = useState<string | null>(null)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null) // Added for tracking payment ID

  // State for product details modal
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  const [showBalanceDashboard, setShowBalanceDashboard] = useState(false)

  const handleDeleteBusinessAccount = async () => {
    if (
      !confirm("Are you sure you want to delete your business account?\n\nClick OK to continue or Cancel to abort.")
    ) {
      return
    }

    if (
      !confirm(
        "⚠️ FINAL WARNING ⚠️\n\nDeleting your business will:\n• Remove all products from marketplace\n• Close your storefront\n• Delete business information\n\nSales/tax records retained for legal compliance.\n\nThis action CANNOT be undone.\n\nClick OK to delete permanently.",
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/business/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: piUser?.uid }),
      })

      if (response.ok) {
        toast({
          title: "Business Account Deleted",
          description: "Your business account has been deleted. Sales records retained for compliance.",
        })
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      } else {
        throw new Error("Failed to delete account")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete business account. Please contact support.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    console.log("[v0] DIALOG STATE CHANGED:", {
      showListingFeeDialog,
      isMounted,
      pendingProduct: !!pendingProduct,
    })
  }, [showListingFeeDialog, isMounted, pendingProduct])

  useEffect(() => {
    if (isConnected && piUser) {
      // Use piUser
      const loadProducts = async () => {
        if (!piUser?.uid) return

        console.log("[v0] ========== LOADING PRODUCTS FOR DASHBOARD ==========")
        console.log("[v0] Business ID:", piUser.uid)

        try {
          const timestamp = Date.now()
          const random = Math.random().toString(36).substr(2, 9)
          const url = `/api/marketplace/products?businessId=${piUser.uid}&_t=${timestamp}&_r=${random}`
          console.log("[v0] Fetching from:", url)

          const response = await fetch(url, {
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          })

          console.log("[v0] Response status:", response.status, response.statusText)

          const data = await response.json()

          if (data.error) {
            console.error("[v0] ❌ Error from API:", data.error)
            return
          }

          console.log("[v0] ✓ Received products from API:", data.products.length)
          if (data.products.length > 0) {
            console.log("[v0] First product:", {
              id: data.products[0].id,
              title: data.products[0].title,
              status: data.products[0].status,
            })
          }

          // Map API response to MarketplaceProduct type
          const dbProducts = data.products.map((p: any) => ({
            id: p.id,
            businessId: p.business_id,
            businessName: p.business_name,
            title: p.title,
            description: p.description,
            price: Number.parseFloat(p.price),
            priceUSD: p.price_usd ? Number.parseFloat(p.price_usd) : 0,
            images: p.images || [],
            photos3D: p.photos_3d || {},
            has3D: p.has_3d || false,
            category: p.category,
            keywords: p.keywords || [],
            location: p.location || "",
            city: p.city || "",
            state: p.state || "",
            country: p.country || "",
            shippingRegions: p.shipping_regions || [],
            acceptsOffers: p.accepts_offers || false,
            offerRange: p.offer_range
              ? { min: Number.parseFloat(p.offer_range.min), max: Number.parseFloat(p.offer_range.max) }
              : undefined,
            stock: Number.parseInt(p.stock) || 1,
            condition: p.condition || "New",
            shipping: {
              available: p.shipping_available || false,
              cost: Number.parseFloat(p.shipping_cost || 0),
              estimatedDays: p.shipping_estimated_days || "3-5",
              service: p.shipping_service || "owner-delivery",
            },
            pickup: {
              available: p.pickup_available || false,
              address: p.pickup_address || "",
            },
            sales: p.sales || 0,
            views: p.views || 0,
            rating: p.rating || 0,
            reviews: p.reviews || [],
            colorVariants: p.color_variants || [],
            model3DUrl: p.model_3d_url || "",
          }))

          setProducts(dbProducts)
          console.log("[v0] ✓ Products state updated with", dbProducts.length, "products")
          console.log("[v0] ========== PRODUCT LOADING COMPLETE ==========")
        } catch (error) {
          console.error("[v0] ❌ Error loading products:", error)
        }
      }
      loadProducts()
      // </CHANGE>

      const salesData = BusinessFeesManager.getSalesHistory(piUser.uid)
      setSalesHistory(salesData || [])

      const savedSettings = BusinessMapManager.getBusiness(piUser.uid)
      if (savedSettings?.shopSettings) {
        setShopSettings(savedSettings.shopSettings)
      }

      const sellerOrders = MarketplaceDB.getOrdersBySeller(piUser.uid)
      setOrders(sellerOrders)

      // Fetch refund requests
      const refunds = MarketplaceDB.getRefundRequestsBySeller(piUser.uid)
      setRefundRequests(refunds)
    }
  }, [isConnected, piUser])

  useEffect(() => {
    if (piUser?.uid) {
      // Use piUser
      const businessProducts = MarketplaceDB.getProductsByBusiness(piUser.uid)
      const soldOut = businessProducts.find((p) => p.stock === 0 && p.sales > 0)

      if (soldOut && !showSoldOutDialog) {
        setSoldOutProduct(soldOut)
        setShowSoldOutDialog(true)

        // Send notification (assuming NotificationDB exists and is imported)
        // NotificationDB.createNotification({
        //   userId: piUser.uid, // Use piUser
        //   type: "system",
        //   title: "Product Sold Out",
        //   message: `"${soldOut.title}" is out of stock. Relist to continue sales!`,
        //   data: { productId: soldOut.id }
        // })
      }
    }
  }, [piUser, showSoldOutDialog]) // Depend on piUser and showSoldOutDialog

  const calculateSafeFee = () => {
    if (!piUser?.uid || !piPrice) return 0 // Use piUser
    try {
      const fee = BusinessFeesManager.calculateListingFee(piUser.uid, piPrice) // Use piUser
      return typeof fee === "number" && !isNaN(fee) ? fee : 0.0001
    } catch (error) {
      console.error("[v0] Error calculating listing fee:", error)
      return 0.0001 // Fallback to minimum fee
    }
  }

  const calculate3DFee = () => {
    if (!productForm.enable3D) return 0

    if (editingProduct) {
      const original3DCount = Object.keys(original3DImages || {}).filter((k) => original3DImages[k]).length
      const current3DCount = Object.keys(productForm.photos3D || {}).filter(
        (k) => productForm.photos3D[k as keyof typeof productForm.photos3D],
      ).length
      const new3DCount = current3DCount - original3DCount

      if (new3DCount <= 0) return 0 // No new images added

      const costPer3D = 0.05 // $0.05 per 3D image
      const totalUSD = new3DCount * costPer3D
      console.log(`[v0] Edit: ${new3DCount} new 3D images added, charging ${totalUSD} USD`)
      return piPrice > 0 ? totalUSD / piPrice : 0
    }

    // For new products, charge for all 3D images
    const uploaded3DCount = Object.keys(productForm.photos3D || {}).filter(
      (k) => productForm.photos3D[k as keyof typeof productForm.photos3D],
    ).length
    if (uploaded3DCount === 0) return 0

    const costPer3D = 0.05 // $0.05 per 3D image
    const totalUSD = uploaded3DCount * costPer3D
    return piPrice > 0 ? totalUSD / piPrice : 0
  }

  const getUserPackageSafely = () => {
    if (!piUser?.uid) return { paidSetupFee: false, listingFee: 0.5, transactionFee: 0.05 } // Use piUser
    try {
      const pkg = BusinessFeesManager.getBusinessPackage(piUser.uid) // Use piUser
      return pkg || { paidSetupFee: false, listingFee: 0.5, transactionFee: 0.05 }
    } catch (error) {
      console.error("[v0] Error getting business package:", error)
      return { paidSetupFee: false, listingFee: 0.5, transactionFee: 0.05 }
    }
  }

  const resetProductForm = () => {
    setProductForm({
      title: "",
      description: "",
      priceUSD: "",
      pricePi: "",
      category: "",
      keywords: "",
      location: "USA",
      city: "",
      state: "",
      country: "United States",
      shippingRegions: [] as string[], // Reset shipping regions
      acceptsOffers: false,
      offerMin: "",
      stock: "1",
      condition: "New",
      shippingAvailable: true,
      shippingCost: "0",
      shippingDays: "3-5",
      shippingService: "owner-delivery",
      shippingServiceOther: "",
      pickupAvailable: false,
      pickupAddress: "",
      images: [] as string[],
      photos3D: {} as { front?: string; right?: string; top?: string; left?: string }, // Updated field names
      colorVariants: [] as Array<{ name: string; hex: string; photos3D?: any }>,
      enable3D: false, // Reset enable3D
      model3DUrl: "", // Reset model3DUrl
    })
    setImagePreview([])
    setPhotos3DPreview({})
    setOriginal3DImages({})
  }

  // Modified handleImageUpload to include compression and validation
  const handleImageUpload = async (file: File, index: number) => {
    if (file && file.type.startsWith("image/")) {
      // Check file size (limit to 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          // Compress the image
          const compressed = await compressImage(base64String, 800)

          console.log(
            `[v0] Image ${index} compressed: ${(base64String.length / 1024).toFixed(1)}KB -> ${(compressed.length / 1024).toFixed(1)}KB`,
          )

          const newImages = [...productForm.images]
          newImages[index] = compressed
          setProductForm({ ...productForm, images: newImages })

          const newPreviews = [...imagePreview]
          newPreviews[index] = compressed
          setImagePreview(newPreviews)
        } catch (error) {
          console.error("[v0] Image compression error:", error)
          toast({
            title: "Compression Failed",
            description: "Failed to process image. Please try a different image.",
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Modified handle3DPhotoUpload to include compression and validation
  const handle3DPhotoUpload = async (file: File, view: "front" | "right" | "top" | "left") => {
    // Updated view type
    if (file && file.type.startsWith("image/")) {
      // Check file size (limit to 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          // Compress 3D images more<bos>aggressive (600px max width)
          const compressed = await compressImage(base64String, 600)

          console.log(
            `[v0] 3D image ${view} compressed: ${(base64String.length / 1024).toFixed(1)}KB -> ${(compressed.length / 1024).toFixed(1)}KB`,
          )

          setProductForm({
            ...productForm,
            photos3D: { ...productForm.photos3D, [view]: compressed },
          })
          setPhotos3DPreview({ ...photos3DPreview, [view]: compressed })

          toast({
            title: "3D Image Added",
            description: `${view} view uploaded successfully`,
          })
        } catch (error) {
          console.error("[v0] 3D image compression error:", error)
          toast({
            title: "Compression Failed",
            description: "Failed to process 3D image. Please try a different image.",
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  useEffect(() => {
    if (piUser?.uid) {
      // Use piUser
      loadProducts()
      loadShopSettings()
      const pkg = BusinessFeesManager.getBusinessPackage(piUser.uid) // Use piUser
      setBusinessPackage(pkg)
      const sales = BusinessFeesManager.getSalesHistory(piUser.uid) // Use piUser
      setSalesHistory(sales)
    }
  }, [piUser]) // Depend on piUser

  useEffect(() => {
    if (productForm.priceUSD && piPrice > 0) {
      const usdAmount = Number.parseFloat(productForm.priceUSD)
      if (!isNaN(usdAmount)) {
        const piAmount = (usdAmount / piPrice).toFixed(2)
        setProductForm((prev) => ({ ...prev, pricePi: piAmount }))
      }
    }
  }, [productForm.priceUSD, piPrice])

  const loadProducts = async () => {
    if (!piUser?.uid) return

    console.log("[v0] ========== LOADING PRODUCTS FOR DASHBOARD ==========")
    console.log("[v0] Business ID:", piUser.uid)

    try {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const url = `/api/marketplace/products?businessId=${piUser.uid}&_t=${timestamp}&_r=${random}`
      console.log("[v0] Fetching from:", url)

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("[v0] Response status:", response.status, response.statusText)

      const data = await response.json()

      if (data.error) {
        console.error("[v0] ❌ Error from API:", data.error)
        return
      }

      console.log("[v0] ✓ Received products from API:", data.products.length)
      if (data.products.length > 0) {
        console.log("[v0] First product:", {
          id: data.products[0].id,
          title: data.products[0].title,
          status: data.products[0].status,
        })
      }

      // Map API response to MarketplaceProduct type
      const dbProducts = data.products.map((p: any) => ({
        id: p.id,
        businessId: p.business_id,
        businessName: p.business_name,
        title: p.title,
        description: p.description,
        price: Number.parseFloat(p.price), // Assuming price is stored as string in DB
        priceUSD: p.price_usd ? Number.parseFloat(p.price_usd) : 0, // Assuming price_usd is stored
        images: p.images || [],
        photos3D: p.photos_3d || {}, // Assuming photos_3d is stored as JSON string or object
        has3D: p.has_3d || false,
        category: p.category,
        keywords: p.keywords || [], // Assuming keywords is an array
        location: p.location || "",
        city: p.city || "",
        state: p.state || "",
        country: p.country || "",
        shippingRegions: p.shipping_regions || [], // Assuming shipping_regions is an array
        acceptsOffers: p.accepts_offers || false,
        offerRange: p.offer_range
          ? { min: Number.parseFloat(p.offer_range.min), max: Number.parseFloat(p.offer_range.max) }
          : undefined,
        stock: Number.parseInt(p.stock) || 1, // Assuming stock is stored as string
        condition: p.condition || "New",
        shipping: {
          available: p.shipping_available || false,
          cost: Number.parseFloat(p.shipping_cost || 0),
          estimatedDays: p.shipping_estimated_days || "3-5",
          service: p.shipping_service || "owner-delivery",
        },
        pickup: {
          available: p.pickup_available || false,
          address: p.pickup_address || "",
        },
        sales: p.sales || 0,
        views: p.views || 0,
        rating: p.rating || 0,
        reviews: p.reviews || [], // Assuming reviews is an array
        colorVariants: p.color_variants || [], // Assuming color_variants is an array
        model3DUrl: p.model_3d_url || "", // Assuming model_3d_url is stored
      }))

      setProducts(dbProducts)
      console.log("[v0] ✓ Products state updated with", dbProducts.length, "products")
      console.log("[v0] ========== PRODUCT LOADING COMPLETE ==========")
      // </CHANGE>
    } catch (error) {
      console.error("[v0] ❌ Error loading products:", error)
    }
  }
  // </CHANGE>

  const loadShopSettings = () => {
    const saved = localStorage.getItem(`shop_settings_${piUser?.uid}`) // Use piUser
    if (saved) {
      setShopSettings(JSON.parse(saved))
    }
  }

  const saveShopSettings = () => {
    console.log("[v0] Save shop settings clicked", shopSettings)
    if (piUser?.uid) {
      // Use piUser
      localStorage.setItem(`shop_settings_${piUser.uid}`, JSON.stringify(shopSettings)) // Use piUser
      toast({
        title: "Shop Settings Saved",
        description: "Your shop configuration has been updated",
      })
    }
  }

  const handleAddProduct = async () => {
    console.log("[v0] Add Product clicked")

    if (editingProduct) {
      console.log("[v0] Editing product - saving changes directly (free)")
      try {
        await submitProductListing(productForm)
        toast({
          title: "Product Updated",
          description: "Your changes have been saved successfully!",
        })
        setEditingProduct(null)
        setShowProductForm(false)
        resetProductForm()
        await loadProducts()
        return
      } catch (error) {
        console.error("[v0] Error updating product:", error)
        toast({
          title: "Update Failed",
          description: "Failed to update product. Please try again.",
          variant: "destructive",
        })
        return
      }
    }

    // Validation
    if (!productForm.title.trim()) {
      toast({ title: "Title Required", description: "Please enter a product title", variant: "destructive" })
      return
    }
    if (!productForm.description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a product description",
        variant: "destructive",
      })
      return
    }
    if (!productForm.pricePi || Number.parseFloat(productForm.pricePi) <= 0) {
      toast({ title: "Price Required", description: "Please enter a valid Pi price", variant: "destructive" })
      return
    }
    if (!productForm.category) {
      toast({ title: "Category Required", description: "Please select a category", variant: "destructive" })
      return
    }

    // Check 3D image data size to prevent localStorage quota errors
    if (productForm.photos3D && Object.keys(productForm.photos3D).length > 0) {
      const photos3DStr = JSON.stringify(productForm.photos3D)
      const photos3DSizeKB = photos3DStr.length / 1024

      console.log(`[v0] 3D photos total size: ${photos3DSizeKB.toFixed(1)}KB`)

      // If 3D images alone are over 1.5MB, reject
      if (photos3DSizeKB > 1500) {
        toast({
          title: "3D Images Too Large",
          description: "Your 3D images are too large. Please reduce the number of views or use smaller images.",
          variant: "destructive",
        })
        return
      }
    }

    const base3DFee = calculate3DFee()
    let fee = 0.0001
    try {
      fee = calculateSafeFee() || 0.0001
      if (!listingPromoApplied) {
        fee += base3DFee // Add 3D generation fee
      }
    } catch (e) {
      console.error("[v0] Fee calc error:", e)
    }

    setCalculatedListingFee(fee)
    setPendingProduct(productForm)
    setShowProductForm(false)

    window.scrollTo({ top: 0, behavior: "smooth" })
    setTimeout(() => setShowListingFeeDialog(true), 150)
  }

  const applyListingPromoCode = () => {
    console.log("[v0] applyListingPromoCode called, code:", listingPromoCode)
    if (!listingPromoCode.trim()) {
      toast({ title: "Please enter a promo code", variant: "destructive" })
      return
    }

    const validCodes = ["FREELIST", "LAUNCH2025", "OWNER", "QUADSTATE"]
    const normalizedCode = listingPromoCode.toUpperCase().trim()

    if (validCodes.includes(normalizedCode)) {
      setListingPromoApplied(true)
      setCalculatedListingFee(0.001) // Fixed fee regardless of 3D images
      toast({
        title: "✓ Promo Code Applied!",
        description: "Your listing fee is now 0.001π (includes 3D generation)",
      })
      console.log("[v0] Promo code applied successfully:", normalizedCode)
    } else {
      toast({
        title: "Invalid Promo Code",
        description: "Please check your code and try again",
        variant: "destructive",
      })
      console.log("[v0] Invalid promo code:", normalizedCode)
    }
  }

  const submitProductListing = async (formData: typeof productForm) => {
    console.log("[v0] submitProductListing called")
    console.log("[v0] Form data:", formData)
    console.log("[v0] Current user ID:", piUser?.uid)
    console.log("[v0] 3D photos count:", Object.keys(formData.photos3D).length)

    try {
      if (!piUser?.uid) {
        // Use piUser
        toast({ title: "Authentication Error", description: "Please connect your Pi wallet.", variant: "destructive" })
        return // Don't throw to prevent red box
      }

      const existingBusiness = BusinessMapManager.getBusiness(piUser.uid)
      if (!existingBusiness) {
        console.log("[v0] Registering business in BusinessMapManager")
        BusinessMapManager.addBusinessToMap({
          id: piUser.uid,
          businessId: piUser.uid,
          businessName: shopSettings.name || piUser.username || "My Shop",
          category: formData.category,
          address: formData.pickupAddress || "",
          city: formData.city || "",
          state: formData.state || "",
          coordinates: { lat: 0, lng: 0 },
          piWalletAddress: piUser.uid,
          phone: "",
          email: "",
          website: "",
          description: "",
        })
      }

      const cleaned3DPhotos: any = {}
      if (formData.photos3D) {
        Object.keys(formData.photos3D).forEach((key) => {
          if (formData.photos3D[key]) {
            cleaned3DPhotos[key] = formData.photos3D[key]
          }
        })
      }

      // Calculate approximate size of product data
      const productDataStr = JSON.stringify({
        ...formData,
        photos3D: cleaned3DPhotos,
      })
      const dataSizeKB = (productDataStr.length / 1024).toFixed(1)
      console.log(`[v0] Product data size: ${dataSizeKB}KB`)

      // Warn if data is large
      if (productDataStr.length > 2 * 1024 * 1024) {
        // 2MB warning
        toast({
          title: "Large Upload Warning",
          description: "Your product has large images. This may cause storage issues.",
          variant: "destructive",
        })
      }

      console.log("[v0] Cleaned 3D photos:", Object.keys(cleaned3DPhotos))

      // Prepare data for API call
      const productApiData = {
        business_id: piUser.uid, // Use piUser
        business_name: shopSettings.name || piUser.username || "My Shop", // Use piUser
        title: formData.title,
        description: formData.description,
        price: Number.parseFloat(formData.pricePi),
        price_usd: Number.parseFloat(formData.priceUSD) || 0, // Assuming price_usd field in API
        images: formData.images.length > 0 ? formData.images : ["/diverse-products-still-life.png"],
        photos3D: cleaned3DPhotos,
        has_3d: Object.keys(cleaned3DPhotos).length >= 1,
        colorVariants: formData.colorVariants?.length > 0 ? formData.colorVariants : [], // Assuming color_variants array
        category: formData.category,
        keywords: formData.keywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean),
        location: formData.location,
        city: formData.city || "",
        state: formData.state || "",
        country: formData.country,
        shippingRegions: formData.shippingRegions,
        acceptsOffers: formData.acceptsOffers,
        offerRange: formData.acceptsOffers
          ? {
              min: Number.parseFloat(formData.offerMin) || 0,
              min_usd: (Number.parseFloat(formData.offerMin) || 0) * piPrice,
              max: Number.parseFloat(formData.pricePi),
              max_usd: Number.parseFloat(formData.priceUSD) || 0,
            }
          : undefined,
        stock: Number.parseInt(formData.stock) || 1,
        condition: formData.condition,
        shipping: {
          available: formData.shippingAvailable,
          cost: 0, // Shipping cost is now handled by product price
          estimatedDays: formData.shippingDays,
          service: formData.shippingService === "other" ? formData.shippingServiceOther : formData.shippingService,
        },
        pickup: {
          available: formData.pickupAvailable,
          address: formData.pickupAddress,
        },
        model3DUrl: formData.model3DUrl, // Assuming model_3d_url field
        paymentId: pendingPaymentId || null, // Pass the payment ID from the Pi payment
      }

      console.log("[v0] Prepared product data for API:", productApiData)

      if (editingProduct) {
        console.log("[v0] Updating existing product:", editingProduct.id)
        try {
          const response = await fetch("/api/marketplace/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: editingProduct.id,
              title: productApiData.title,
              description: productApiData.description,
              price: productApiData.price,
              price_usd: productApiData.price_usd,
              category: productApiData.category,
              images: productApiData.images,
              photos3D: productApiData.photos3D,
              has_3d: productApiData.has_3d,
              colorVariants: productApiData.colorVariants,
              keywords: productApiData.keywords,
              location: productApiData.location,
              city: productApiData.city,
              state: productApiData.state,
              country: productApiData.country,
              shippingRegions: productApiData.shippingRegions,
              acceptsOffers: productApiData.acceptsOffers,
              offerRange: productApiData.offerRange,
              stock: productApiData.stock,
              condition: productApiData.condition,
              shipping: productApiData.shipping,
              pickup: productApiData.pickup,
              model3DUrl: productApiData.model3DUrl,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || "Failed to update product")
          }

          toast({
            title: "✓ Product Updated",
            description: "Your product listing has been updated",
          })

          setEditingProduct(null)
          setShowProductForm(false)
          resetProductForm()
          await loadProducts()
        } catch (updateError) {
          console.error("[v0] Error during product update:", updateError)
          if (updateError instanceof Error && updateError.message.includes("quota")) {
            toast({
              title: "Storage Limit Exceeded",
              description: "Your 3D images are too large. Please use smaller images or fewer angles.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Update Failed",
              description: `Failed to update product: ${updateError instanceof Error ? updateError.message : "Unknown error"}`,
              variant: "destructive",
            })
          }
          throw updateError // Re-throw to show in the main catch block if needed
        }
      } else {
        console.log("[v0] Adding new product to marketplace")
        let response
        try {
          response = await fetch("/api/marketplace/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productApiData),
          })
        } catch (fetchError: any) {
          console.error("[v0] Network error creating product:", fetchError)
          toast({
            title: "Network Error",
            description: "Failed to connect to server. Please check your connection and try again.",
            variant: "destructive",
          })
          // Don't throw - just return to prevent red box
          return
        }

        let data
        try {
          data = await response.json()
        } catch (jsonError: any) {
          console.error("[v0] Error parsing response:", jsonError)
          toast({
            title: "Response Error",
            description: "Received invalid response from server. Please try again.",
            variant: "destructive",
          })
          return
        }

        if (!response.ok) {
          console.error("[v0] Server error creating product:", data.error)
          toast({
            title: "Server Error",
            description: data.error || "Failed to create product. Please try again.",
            variant: "destructive",
          })
          return
        }

        const productId = data.product?.id
        if (!productId) {
          console.error("[v0] No product ID returned from server")
          toast({
            title: "Creation Error",
            description: "Product was created but no ID was returned. Please refresh the page.",
            variant: "destructive",
          })
          return
        }

        console.log("[v0] Product added with ID:", productId)

        window.dispatchEvent(new CustomEvent("marketplace-product-added", { detail: { productId } }))

        // Force immediate state update with the new product
        const newProduct = {
          id: productId,
          businessId: piUser.uid,
          businessName: shopSettings.name || piUser.username || "My Shop",
          title: productApiData.title,
          description: productApiData.description,
          price: productApiData.price,
          priceUSD: productApiData.price_usd,
          images: productApiData.images,
          photos3D: productApiData.photos3D || {},
          has3D: productApiData.has_3d,
          category: productApiData.category,
          keywords: productApiData.keywords,
          location: productApiData.location,
          city: productApiData.city,
          state: productApiData.state,
          country: productApiData.country,
          shippingRegions: productApiData.shippingRegions,
          acceptsOffers: productApiData.acceptsOffers,
          offerRange: productApiData.offerRange,
          stock: productApiData.stock,
          condition: productApiData.condition,
          shipping: productApiData.shipping,
          pickup: productApiData.pickup,
          sales: 0,
          views: 0,
          rating: 0,
          reviews: [],
          colorVariants: productApiData.colorVariants || [],
          model3DUrl: productApiData.model3DUrl || "",
        }

        // Add to products list immediately
        setProducts((prev) => [newProduct, ...prev])
        console.log("[v0] Added product to local state immediately")

        // Then reload from database to ensure consistency
        await loadProducts()

        // Force additional reloads with longer delays
        setTimeout(async () => {
          console.log("[v0] Second product reload (1s delay)...")
          await loadProducts()
        }, 1000)

        setTimeout(async () => {
          console.log("[v0] Third product reload (3s delay)...")
          await loadProducts()
        }, 3000)
        // </CHANGE>

        // Verify product was saved by attempting to fetch it
        try {
          const savedProduct = await fetch(`/api/marketplace/products?id=${productId}`).then((res) =>
            res.ok ? res.json() : { product: null },
          )
          console.log("[v0] Verification - product in DB:", savedProduct.product ? "YES" : "NO")

          if (!savedProduct.product) {
            console.warn("[v0] Product may not have saved properly")
            toast({
              title: "Warning",
              description: "Product created but verification failed. Please check your dashboard.",
              variant: "default",
              // </CHANGE>
            })
          }
        } catch (verifyError: any) {
          console.warn("[v0] Could not verify product save:", verifyError)
          // Don't fail the whole operation if verification fails
        }

        const effectiveListingFee = userIsOwner || listingPromoApplied ? 0.001 : calculatedListingFee // Use 0.001 for promo, 0 for owner, otherwise calculated

        // Record listing fee if applicable
        if (!userIsOwner && effectiveListingFee > 0) {
          // Use BusinessFeesManager to record listing fee associated with a product ID.
          BusinessFeesManager.recordListingFee(piUser.uid, effectiveListingFee, productId) // Use piUser
          console.log(`[v0] Recording listing fee: ${effectiveListingFee}π for product ${productId}`)
        }

        // Clear form and reset states
        setShowProductForm(false)
        resetProductForm()
        setListingPromoCode("")
        setListingPromoApplied(false)
        setPendingProduct(null) // Clear pending product after successful listing
        setPendingPaymentId(null) // Clear payment ID

        // Force reload products immediately
        console.log("[v0] Product list reloaded")

        // Show success dialog
        setListedProductId(productId)
        setShowSuccessDialog(true) // Use the renamed dialog state
        setNewlyListedProduct(productApiData) // Store product data for success screen

        toast({
          title: "✓ Product Listed",
          description: `Your product is now live on the marketplace`,
        })
      }
    } catch (error: any) {
      console.error("[v0] Error in submitProductListing:", error)
      // Added specific error handling for storage quota issues during product listing
      if (error.message.includes("quota")) {
        toast({
          title: "Storage Limit Exceeded",
          description: "Your 3D images are too large. Please use smaller images or fewer angles.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Listing Error",
          description: error.message || "Failed to list product",
          variant: "destructive",
        })
      }
      // throw error
    }
  }

  const handleListingPaymentTrigger = async () => {
    console.log("[v0] Payment trigger initiated")
    console.log("[v0] Pending product:", pendingProduct)
    console.log("[v0] Calculated fee:", calculatedListingFee)

    if (!piUser?.uid || !pendingProduct) {
      // Use piUser
      toast({ title: "Missing data", variant: "destructive" })
      return
    }

    const feeToPay = listingPromoApplied ? 0.001 : userIsOwner ? 0 : calculatedListingFee
    console.log("[v0] Fee to pay:", feeToPay)

    if (feeToPay === 0) {
      console.log("[v0] Fee is zero, proceeding directly to listing.")
      try {
        await submitProductListing(pendingProduct)
        setShowListingFeeDialog(false)
        setListingPromoCode("")
        setListingPromoApplied(false)
        setPendingProduct(null)
        setPendingPaymentId(null) // Clear payment ID

        await loadProducts()

        toast({ title: "Product listed successfully! 🎉" })
      } catch (error) {
        console.error("[v0] Error listing product:", error)
        toast({ title: "Failed to list product", variant: "destructive" })
      }
      return
    }

    const paymentData = {
      amount: feeToPay,
      memo: `Listing fee for ${pendingProduct.title || "product"}`,
      metadata: {
        service: "marketplace_listing",
        productTitle: pendingProduct.title,
        userId: piUser?.uid,
        promoApplied: listingPromoApplied,
      },
    }

    const paymentCallbacks = {
      onReadyForServerApproval: async (paymentId: string) => {
        console.log("[v0] Payment ready for server approval:", paymentId)
        setPendingPaymentId(paymentId) // Store payment ID for later use
        try {
          const response = await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          })

          const data = await response.json()

          if (!response.ok) {
            console.error("[v0] Server approval failed:", data)
            throw new Error(data.error || "Approval failed")
          }

          console.log("[v0] Server approval successful:", data)
          // No further action needed here for approval, completion is handled by onReadyForServerCompletion
        } catch (error: any) {
          console.error("[v0] Server approval error:", error)
          throw error
        }
      },

      onReadyForServerCompletion: async (paymentId: string, txid: string) => {
        console.log("[v0] Payment ready for server completion:", paymentId, txid)

        try {
          const response = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          })

          const data = await response.json()

          if (!response.ok) {
            console.error("[v0] Server completion failed:", data)
            throw new Error(data.error || "Completion failed")
          }

          console.log("[v0] Server completion successful:", data)

          try {
            await submitProductListing(pendingProduct)
            console.log("[v0] Product listing submitted successfully")

            setShowListingFeeDialog(false)
            setPendingProduct(null)
            setPendingPaymentId(null) // Clear payment ID after successful listing
            setListingPromoCode("")
            setListingPromoApplied(false)

            toast({
              title: "Product Listed!",
              description: "Your product is now live on the marketplace",
            })

            console.log("[v0] Forcing product list refresh...")
            await loadProducts() // <-- Ensure this is called after submission
            console.log("[v0] Product list refreshed")
          } catch (error) {
            console.error("[v0] Failed to submit product after payment:", error)
            toast({
              title: "Listing Error",
              description: "Payment succeeded but failed to list product. Contact support.",
              variant: "destructive",
            })
            setShowListingFeeDialog(false)
            setPendingProduct(null)
            setPendingPaymentId(null) // Clear payment ID
          }
        } catch (error: any) {
          console.error("[v0] Server completion error:", error)
          toast({
            title: "Completion Error",
            description: error.message,
            variant: "destructive",
          })
          setShowListingFeeDialog(false)
          setPendingProduct(null)
          setPendingPaymentId(null) // Clear payment ID
          return
        }
      },

      onCancel: (paymentId: string) => {
        console.log("[v0] Payment cancelled by user:", paymentId)
        setShowListingFeeDialog(false)
        setPendingProduct(null)
        setPendingPaymentId(null) // Clear payment ID
        setListingPromoCode("")
        setListingPromoApplied(false)
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the listing payment",
        })
      },

      onError: (error: any, payment: any) => {
        console.error("[v0] Payment error:", error, payment)
        setShowListingFeeDialog(false)
        setPendingProduct(null)
        setPendingPaymentId(null) // Clear payment ID
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment",
          variant: "destructive",
        })
      },
    }

    console.log("[v0] Creating Pi payment with data:", paymentData)

    try {
      const payment = await window.Pi.createPayment(paymentData, paymentCallbacks)
      console.log("[v0] Payment created successfully:", payment)
    } catch (error: any) {
      console.error("[v0] Error creating payment:", error)
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      })
      setShowListingFeeDialog(false)
      setPendingProduct(null)
      setPendingPaymentId(null) // Clear payment ID
    }
  }

  const handleListingSuccess = async (productId: string) => {
    console.log("[v0] Product listed successfully:", productId)

    // Force immediate reload of products with state update
    if (piUser?.uid) {
      const userProducts = MarketplaceDB.getProductsByBusiness(piUser.uid)
      console.log("[v0] Refreshed products - User:", userProducts.length)
      setProducts(userProducts)

      // Force React to re-render by updating state twice
      setProducts([...userProducts])
    }

    // Show success dialog
    setListedProductId(productId)
    setShowSuccessDialog(true) // Use the renamed dialog state
    const productData = MarketplaceDB.getProduct(productId)
    setNewlyListedProduct(productData)

    // Clear form
    setShowProductForm(false)
    resetProductForm()
    setListingPromoCode("")
    setListingPromoApplied(false)
    setPendingProduct(null) // Clear pending product
    setPendingPaymentId(null) // Clear payment ID
  }
  // </CHANGE>

  // Add relist and archive functionality
  const handleRelistProduct = async (productId: string, newStock: number, newPrice?: number) => {
    const product = MarketplaceDB.getProduct(productId) // This part might need to be adapted if using DB
    if (!product) return

    const updates: Partial<MarketplaceProduct> = {
      stock: newStock,
    }

    if (newPrice !== undefined) {
      updates.price = newPrice
      updates.priceUSD = newPrice * piPrice // Also update priceUSD if price changes
    }

    // Update product with new stock
    const success = MarketplaceDB.updateProduct(productId, updates) // This part might need to be adapted if using DB

    if (success) {
      toast({
        title: "Product Relisted!",
        description: `"${product.title}" is back in stock with ${newStock} units.`,
      })
      setShowSoldOutDialog(false)
      setSoldOutProduct(null)

      // Reload products to reflect the change
      loadProducts()

      // No listing fee for relisting if stock was just replenished,
      // unless it's a completely new listing scenario.
      // For now, assume relisting by adding stock doesn't incur a new listing fee.
      // If a new price is set, a fee might be applicable, handled by separate listing logic.
    } else {
      toast({
        title: "Relist Failed",
        description: "Could not relist product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleArchiveProduct = (productId: string) => {
    const product = MarketplaceDB.getProduct(productId) // This part might need to be adapted if using DB
    if (!product) return

    // Mark as inactive (stock = 0 stays)
    MarketplaceDB.updateProduct(productId, {
      stock: 0,
      isArchived: true, // Add an isArchived flag if needed
    }) // This part might need to be adapted if using DB

    toast({
      title: "Product Archived",
      description: `"${product.title}" has been archived. You can edit it anytime to relist.`,
    })
    setShowSoldOutDialog(false)
    setSoldOutProduct(null)
    loadProducts() // Refresh product list
  }

  const calculateTotalSales = () => {
    // This needs to be fetched from the database or aggregated if MarketplaceDB is an in-memory store
    return products.reduce((sum, p) => sum + p.price * p.sales, 0)
  }

  const calculateTotalViews = () => {
    // This needs to be fetched from the database or aggregated
    return products.reduce((sum, p) => sum + p.views, 0)
  }

  const handleViewProduct = (product: MarketplaceProduct) => {
    console.log("[v0] View product from dashboard:", product.id)
    setSelectedProduct(product)
    setShowProductModal(true)
  }

  const handleViewShop = (businessId: string) => {
    console.log("[v0] Navigating to shop:", businessId)
    window.location.href = `/shop/${businessId}`
  }

  // Define handleEditProduct, handleCopyProduct, handleDeleteProduct here
  const handleEditProduct = (product: MarketplaceProduct) => {
    setEditingProduct(product)
    setOriginal3DImages(product.photos3D || {})
    setProductForm({
      title: product.title,
      description: product.description,
      priceUSD: product.priceUSD.toString(),
      pricePi: product.price.toString(),
      category: product.category,
      keywords: product.keywords.join(", "),
      location: product.location as "USA" | "International",
      city: product.city,
      state: product.state,
      country: product.country,
      shippingRegions: product.shippingRegions,
      acceptsOffers: product.acceptsOffers,
      offerMin: product.offerRange?.min.toString() || "",
      stock: product.stock.toString(),
      condition: product.condition as "New" | "Used" | "Refurbished",
      shippingAvailable: product.shipping.available,
      shippingCost: product.shipping.cost.toString(),
      shippingDays: product.shipping.estimatedDays,
      shippingService: product.shipping.service as any, // Type assertion might be needed if service isn't strictly typed
      shippingServiceOther: product.shipping.service === "other" ? product.shipping.service : "",
      pickupAvailable: product.pickup.available,
      pickupAddress: product.pickup.address,
      images: product.images,
      photos3D: product.photos3D || {},
      colorVariants: product.colorVariants || [],
      enable3D: !!product.model3DUrl || (product.photos3D && Object.keys(product.photos3D).length > 0),
      model3DUrl: product.model3DUrl || "",
    })
    setImagePreview(product.images)
    setPhotos3DPreview(product.photos3D || {})
    setShowProductForm(true)
  }

  const handleCopyProduct = async (product: MarketplaceProduct) => {
    // Clear editing state and populate form with product data
    setEditingProduct(null) // Ensure we are adding a new product
    setProductForm({
      title: `${product.title} (Copy)`,
      description: product.description,
      priceUSD: product.priceUSD.toString(),
      pricePi: product.price.toString(),
      category: product.category,
      keywords: product.keywords.join(", "),
      location: product.location as "USA" | "International",
      city: product.city,
      state: product.state,
      country: product.country,
      shippingRegions: product.shippingRegions,
      acceptsOffers: product.acceptsOffers,
      offerMin: product.offerRange?.min.toString() || "",
      stock: "1", // Reset stock for new copy
      condition: product.condition as "New" | "Used" | "Refurbished",
      shippingAvailable: product.shipping.available,
      shippingCost: product.shipping.cost.toString(), // This might need to be set to 0 if shipping is free
      shippingDays: product.shipping.estimatedDays,
      shippingService: product.shipping.service as any,
      shippingServiceOther: product.shipping.service === "other" ? product.shipping.service : "",
      pickupAvailable: product.pickup.available,
      pickupAddress: product.pickup.address,
      images: [], // Clear images for a new upload
      photos3D: {}, // Clear 3D photos for a new upload
      colorVariants: product.colorVariants || [],
      enable3D: !!product.model3DUrl, // Carry over 3D if present, but images will be cleared
      model3DUrl: product.model3DUrl || "", // Carry over URL if applicable
    })
    setImagePreview([])
    setPhotos3DPreview({})
    setShowProductForm(true)
    toast({ title: "Product copied to form", description: "Edit the details and list again" })
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/marketplace/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete product")
      }

      toast({
        title: "Product Deleted",
        description: "Your product has been successfully deleted.",
      })
      await loadProducts() // Refresh the product list
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Dashboard</CardTitle>
              <CardDescription>Connect your Pi wallet to access your business dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={connect} size="lg" className="w-full" disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect Pi Wallet"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (showProductForm) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => {
              setShowProductForm(false)
              setEditingProduct(null)
              resetProductForm()
            }}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{editingProduct ? "Edit Product" : "Add New Product"}</CardTitle>
              <CardDescription>List your product in the Pi Marketplace with 3D visualization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priceUSD">Price (USD) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="priceUSD"
                      type="number"
                      step="0.01"
                      value={productForm.priceUSD}
                      onChange={(e) => setProductForm({ ...productForm, priceUSD: e.target.value })}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pricePi">Price (π) *</Label>
                  <Input
                    id="pricePi"
                    type="number"
                    step="0.01"
                    value={productForm.pricePi}
                    readOnly
                    placeholder="Auto-calculated"
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Current rate: 1π = ${piPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={productForm.category}
                    onValueChange={(v) => setProductForm({ ...productForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={productForm.condition}
                  onValueChange={(v: any) => setProductForm({ ...productForm, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Used">Used</SelectItem>
                    <SelectItem value="Refurbished">Refurbished</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="keywords">Search Keywords (comma separated)</Label>
                <Input
                  id="keywords"
                  value={productForm.keywords}
                  onChange={(e) => setProductForm({ ...productForm, keywords: e.target.value })}
                  placeholder="gaming, console, electronics"
                />
              </div>

              {/* IMAGE UPLOAD SECTION START */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Product Images</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image-file-1">Image 1 (Main Product Photo)</Label>
                    <Input
                      id="image-file-1"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 0)
                      }}
                    />
                    {imagePreview[0] && (
                      <div className="mt-2 relative w-32 h-32 border rounded">
                        <img
                          src={imagePreview[0] || "/placeholder.svg"}
                          alt="Preview 1"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="image-file-2">Image 2 (Optional)</Label>
                    <Input
                      id="image-file-2"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 1)
                      }}
                    />
                    {imagePreview[1] && (
                      <div className="mt-2 relative w-32 h-32 border rounded">
                        <img
                          src={imagePreview[1] || "/placeholder.svg"}
                          alt="Preview 2"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="image-file-3">Image 3 (Optional)</Label>
                    <Input
                      id="image-file-3"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 2)
                      }}
                    />
                    {imagePreview[2] && (
                      <div className="mt-2 relative w-32 h-32 border rounded">
                        <img
                          src={imagePreview[2] || "/placeholder.svg"}
                          alt="Preview 3"
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload product images. Images will be stored securely. Leave blank to use default placeholder image.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">3D Product Views (Optional)</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload multiple angles of your product for an enhanced 3D viewing experience
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="photo-3d-front">Front View</Label>
                      <Input
                        id="photo-3d-front"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handle3DPhotoUpload(file, "front")
                        }}
                      />
                      {photos3DPreview.front && (
                        <div className="mt-2 relative w-20 h-20 border rounded">
                          <img
                            src={photos3DPreview.front || "/placeholder.svg"}
                            alt="Front view"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo-3d-right">Right Side View</Label>
                      <Input
                        id="photo-3d-right"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handle3DPhotoUpload(file, "right")
                        }}
                      />
                      {photos3DPreview.right && (
                        <div className="mt-2 relative w-20 h-20 border rounded">
                          <img
                            src={photos3DPreview.right || "/placeholder.svg"}
                            alt="Right side view"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo-3d-top">Top View</Label>
                      <Input
                        id="photo-3d-top"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handle3DPhotoUpload(file, "top")
                        }}
                      />
                      {photos3DPreview.top && (
                        <div className="mt-2 relative w-20 h-20 border rounded">
                          <img
                            src={photos3DPreview.top || "/placeholder.svg"}
                            alt="Top view"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="photo-3d-left">Left Side View</Label>
                      <Input
                        id="photo-3d-left"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handle3DPhotoUpload(file, "left")
                        }}
                      />
                      {photos3DPreview.left && (
                        <div className="mt-2 relative w-20 h-20 border rounded">
                          <img
                            src={photos3DPreview.left || "/placeholder.svg"}
                            alt="Left side view"
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {Object.keys(productForm.photos3D).length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <Badge className="bg-green-500">3D Views Added</Badge>
                      <span>
                        {
                          Object.keys(productForm.photos3D).filter(
                            (k) => productForm.photos3D[k as keyof typeof productForm.photos3D],
                          ).length
                        }{" "}
                        of 4 angles
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* IMAGE UPLOAD SECTION END */}

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable3D"
                    checked={productForm.enable3D}
                    onChange={(e) => setProductForm({ ...productForm, enable3D: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <Label htmlFor="enable3D" className="text-sm font-medium">
                    Enable AI-Powered 3D Model Generation
                  </Label>
                </div>
                {productForm.enable3D && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm space-y-2">
                    <p className="font-medium">3D Generation Active</p>
                    <p className="text-muted-foreground">
                      Your uploaded images will be converted to interactive 3D models using AI. Cost: $0.05 per image (
                      {calculate3DFee().toFixed(4)}π total)
                    </p>
                    {Object.keys(productForm.photos3D || {}).length > 0 && (
                      <p className="text-green-600 font-medium">
                        ✓ {Object.keys(productForm.photos3D || {}).length} image(s) ready for 3D conversion
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Location</Label>
                  <Select
                    value={productForm.location}
                    onValueChange={(v: any) => setProductForm({ ...productForm, location: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USA">USA</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={productForm.city}
                    onChange={(e) => setProductForm({ ...productForm, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Country</Label>
                  <Input
                    id="state"
                    value={productForm.state}
                    onChange={(e) => setProductForm({ ...productForm, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Shipping & Delivery</h3>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-1">Free Shipping on All Items</p>
                  <p className="text-xs text-green-700">
                    Note: Please include your shipping costs in your product's listing price above.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="shipping-available">Offer Shipping</Label>
                  <input
                    id="shipping-available"
                    type="checkbox"
                    checked={productForm.shippingAvailable}
                    onChange={(e) => setProductForm({ ...productForm, shippingAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>

                {productForm.shippingAvailable && (
                  <>
                    <div>
                      <Label htmlFor="shipping-days">Shipping Days After Order</Label>
                      <Select
                        value={productForm.shippingDays}
                        onValueChange={(v) => setProductForm({ ...productForm, shippingDays: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2">1-2 days</SelectItem>
                          <SelectItem value="3-5">3-5 days</SelectItem>
                          <SelectItem value="5-7">5-7 days</SelectItem>
                          <SelectItem value="7-10">7-10 days</SelectItem>
                          <SelectItem value="10-14">10-14 days</SelectItem>
                          <SelectItem value="14-21">14-21 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="pickup-available">Offer Local Pickup</Label>
                  <input
                    id="pickup-available"
                    type="checkbox"
                    checked={productForm.pickupAvailable}
                    onChange={(e) => setProductForm({ ...productForm, pickupAvailable: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>

                {productForm.pickupAvailable && (
                  <div>
                    <Label htmlFor="pickup-address">Pickup Address</Label>
                    <Input
                      id="pickup-address"
                      value={productForm.pickupAddress}
                      onChange={(e) => setProductForm({ ...productForm, pickupAddress: e.target.value })}
                      placeholder="Enter pickup location"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Shipping Destinations</h3>
                <p className="text-sm text-muted-foreground">
                  Select all countries where you're willing to ship this product
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                  {SHIPPING_COUNTRIES.map((country) => (
                    <label key={country} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.shippingRegions.includes(country)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProductForm({
                              ...productForm,
                              shippingRegions: [...productForm.shippingRegions, country],
                            })
                          } else {
                            setProductForm({
                              ...productForm,
                              shippingRegions: productForm.shippingRegions.filter((c) => c !== country),
                            })
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{country}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProductForm({ ...productForm, shippingRegions: SHIPPING_COUNTRIES })}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProductForm({ ...productForm, shippingRegions: [] })}
                  >
                    Clear All
                  </Button>
                </div>

                {productForm.shippingRegions.length > 0 && (
                  <p className="text-sm text-green-600">
                    Shipping to {productForm.shippingRegions.length}{" "}
                    {productForm.shippingRegions.length === 1 ? "country" : "countries"}
                  </p>
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="accepts-offers">Accept Offers</Label>
                  <input
                    id="accepts-offers"
                    type="checkbox"
                    checked={productForm.acceptsOffers}
                    onChange={(e) => setProductForm({ ...productForm, acceptsOffers: e.target.checked })}
                    className="w-4 h-4"
                  />
                </div>
                {productForm.acceptsOffers && (
                  <div>
                    <Label htmlFor="offer-min">Minimum Offer You'll Accept (π)</Label>
                    <Input
                      id="offer-min"
                      type="number"
                      step="0.01"
                      value={productForm.offerMin}
                      onChange={(e) => setProductForm({ ...productForm, offerMin: e.target.value })}
                      placeholder="Lowest price you'll accept"
                    />
                    {productForm.offerMin && piPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum: {productForm.offerMin}π ≈ $
                        {(Number.parseFloat(productForm.offerMin) * piPrice).toFixed(2)} USD
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Buyers can offer between this amount and your listing price
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button onClick={handleAddProduct} className="flex-1" type="button">
                  {editingProduct ? "Update Product" : "List Product"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowProductForm(false)
                    setEditingProduct(null)
                    resetProductForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Replaced original return statement with new structure including Header and main tag
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {isMounted &&
        showBalanceDashboard &&
        createPortal(
          <ShopOwnerBalanceDashboard sellerId={piUser?.uid} onClose={() => setShowBalanceDashboard(false)} />,
          document.body,
        )}

      {piUser?.uid && <ReturnRateWarningBanner sellerId={piUser.uid} />}

      {!isConnected ? (
        <div className="min-h-screen bg-background py-12">
          <div className="container max-w-2xl mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Dashboard</CardTitle>
                <CardDescription>Connect your Pi wallet to access your business dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={connect} size="lg" className="w-full" disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect Pi Wallet"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Business Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {piUser?.username}</p> {/* Use piUser */}
              {userIsOwner && (
                <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-amber-600 text-white">
                  Owner Account - All Fees Waived
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBalanceDashboard(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Shop Balance
              </Button>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pi Ride
                </Button>
              </Link>
              {userIsOwner && (
                <Link href="/owner-admin">
                  <Button className="ml-2 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Administrator
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {userIsOwner && (
            <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Shield className="w-5 h-5" />
                  Owner Privileges Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      Listing Fee: <strong className="text-green-600">$0</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      Transaction Fee: <strong className="text-green-600">0%</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      Setup Fee: <strong className="text-green-600">$0</strong>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">Listed in marketplace</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateTotalSales().toFixed(2)}π</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateTotalViews()}</div>
                <p className="text-xs text-muted-foreground">Product impressions</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="space-y-6">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">
                Orders {orders.length > 0 && <Badge className="ml-2">{orders.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="refunds">
                Refunds{" "}
                {refundRequests.filter((r) => r.status === "pending").length > 0 && (
                  <Badge className="ml-2 bg-yellow-500">
                    {refundRequests.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sales">Sales History</TabsTrigger>
              <TabsTrigger value="shop">Shop Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Your Products</h2>
                <Button onClick={() => setShowProductForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </div>

              {products.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Products Listed</h3>
                    <p className="text-muted-foreground mb-4">Start selling by adding your first product</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id}>
                      <CardHeader>
                        <div
                          className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleViewProduct(product)}
                        >
                          <img
                            src={product.images[0] || "/diverse-products-still-life.png"}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                          {product.has3D && (
                            <Badge className="absolute top-2 right-2 bg-primary">3D View Available</Badge>
                          )}
                          {product.colorVariants && product.colorVariants.length > 0 && (
                            <Badge className="absolute top-2 left-2 bg-secondary">
                              {product.colorVariants.length} Colors
                            </Badge>
                          )}
                        </div>
                        <CardTitle
                          className="text-lg cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleViewProduct(product)}
                        >
                          {product.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-primary">{product.price}π</span>
                          <Badge>{product.category}</Badge>
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>{product.views} views</span>
                          <span>•</span>
                          <span>{product.sales} sales</span>
                          <span>•</span>
                          <span>{product.stock} in stock</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyProduct(product)}
                            className="flex-1"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {/* In the product card, update the View Seller's Shop button */}
                        <Button variant="outline" size="sm" onClick={() => handleViewShop(product.businessId)}>
                          View Seller's Shop
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Orders to Fulfill</CardTitle>
                  <CardDescription>Manage your orders and shipments</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const product = MarketplaceDB.getProduct(order.productId) // This might need to fetch from DB
                        return (
                          <Card key={order.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                                  <CardDescription>{product?.title}</CardDescription>
                                </div>
                                <Badge
                                  variant={
                                    order.status === "paid"
                                      ? "default"
                                      : order.status === "shipped"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Amount:</span>
                                  <span className="font-semibold ml-2">{order.amount}π</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Date:</span>
                                  <span className="ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {order.shippingAddress && (
                                <div className="bg-muted p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Shipping Address
                                  </h4>
                                  <div className="text-sm space-y-1">
                                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                                    <p>{order.shippingAddress.addressLine1}</p>
                                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                                    <p>
                                      {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                                      {order.shippingAddress.zipCode}
                                    </p>
                                    <p>{order.shippingAddress.country}</p>
                                    <p className="pt-2">
                                      <strong>Phone:</strong> {order.shippingAddress.phone}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {order.pickup && (
                                <div className="bg-muted p-4 rounded-lg">
                                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Local Pickup
                                  </h4>
                                  <p className="text-sm">Customer will pick up at your location</p>
                                </div>
                              )}

                              {order.status === "paid" && order.shipping && (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter tracking number"
                                    onChange={(e) => {
                                      const trackingNumber = e.target.value
                                      if (trackingNumber.length > 5) {
                                        MarketplaceDB.updateOrderStatus(order.id, "shipped", trackingNumber) // This might need DB update
                                        setOrders(MarketplaceDB.getOrdersBySeller(piUser!.uid)) // This might need DB fetch
                                        toast({
                                          title: "Order Updated",
                                          description: "Order marked as shipped",
                                        })
                                      }
                                    }}
                                  />
                                  <Button>
                                    <Truck className="w-4 h-4 mr-2" />
                                    Mark Shipped
                                  </Button>
                                </div>
                              )}

                              {order.trackingNumber && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Tracking:</span>
                                  <span className="font-mono ml-2">{order.trackingNumber}</span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="refunds">
              <SellerRefundManager sellerId={piUser?.uid || ""} />
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales History & Fees</CardTitle>
                  <CardDescription>Track your earnings, listing fees, and transaction fees</CardDescription>
                </CardHeader>
                <CardContent>
                  {salesHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No sales yet</p>
                  ) : (
                    <div className="space-y-4">
                      {salesHistory.map((sale) => (
                        <div key={sale.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{sale.productTitle}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(sale.soldAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge>Sold</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Sale Amount:</span>
                              <span className="font-semibold ml-2">{sale.saleAmount}π</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Listing Fee:</span>
                              <span className="font-semibold ml-2">{sale.listingFee}π</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Transaction Fee:</span>
                              <span className="font-semibold ml-2 text-primary">{sale.transactionFee.toFixed(2)}π</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Net Profit:</span>
                              <span className="font-semibold ml-2 text-green-600">{sale.netProfit.toFixed(2)}π</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shop" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Configuration</CardTitle>
                  <CardDescription>Customize how your shop appears in the marketplace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="shop-name">Shop Name</Label>
                    <Input
                      id="shop-name"
                      value={shopSettings.name}
                      onChange={(e) => setShopSettings({ ...shopSettings, name: e.target.value })}
                      placeholder="My Amazing Shop"
                    />
                  </div>

                  <div>
                    <Label>Display Mode</Label>
                    <Select
                      value={shopSettings.displayMode}
                      onValueChange={(v: any) => setShopSettings({ ...shopSettings, displayMode: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Photo Grid)</SelectItem>
                        <SelectItem value="3d">3D Rendering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Shop Template</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {SHOP_TEMPLATES.map((template) => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all ${
                            shopSettings.template === template.id
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => setShopSettings({ ...shopSettings, template: template.id })}
                        >
                          <CardHeader>
                            <CardTitle className="text-sm">{template.name}</CardTitle>
                            <CardDescription className="text-xs">{template.description}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Button onClick={saveShopSettings}>Save Shop Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Success dialog */}
          {isMounted &&
            showSuccessDialog && // Use the renamed dialog state
            createPortal(
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
                style={{ zIndex: 999999 }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowSuccessDialog(false) // Use the renamed dialog state
                    setSuccessProduct(null)
                    setListedProductId(null)
                    setNewlyListedProduct(null) // Clear newly listed product on backdrop click
                    setPendingProduct(null) // Clear pending product
                    setPendingPaymentId(null) // Clear payment ID
                  }
                }}
              >
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle className="text-green-600">✓ Listing Successful!</CardTitle>
                    <CardDescription>
                      {successProduct
                        ? `Your product "${successProduct.title}" is now live!`
                        : "Your product is now live on the marketplace"}
                    </CardDescription>{" "}
                    {/* Corrected closing tag here */}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">What would you like to do next?</p>
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (listedProductId) {
                            window.open(`/marketplace?product=${listedProductId}`, "_blank")
                          }
                          setShowSuccessDialog(false) // Use the renamed dialog state
                          setSuccessProduct(null)
                          setListedProductId(null)
                          setNewlyListedProduct(null) // Clear newly listed product
                          setPendingProduct(null) // Clear pending product
                          setPendingPaymentId(null) // Clear payment ID
                        }}
                      >
                        View on Marketplace
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => {
                          setShowSuccessDialog(false) // Use the renamed dialog state
                          setSuccessProduct(null)
                          setListedProductId(null)
                          setNewlyListedProduct(null) // Clear newly listed product
                          setShowProductForm(true)
                          resetProductForm()
                          setPendingProduct(null) // Clear pending product
                          setPendingPaymentId(null) // Clear payment ID
                        }}
                      >
                        List Another Product
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          setShowSuccessDialog(false) // Use the renamed dialog state
                          setSuccessProduct(null)
                          setListedProductId(null)
                          setNewlyListedProduct(null) // Clear newly listed product
                          loadProducts()
                          setPendingProduct(null) // Clear pending product
                          setPendingPaymentId(null) // Clear payment ID
                        }}
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>,
              document.body,
            )}
          {/* Listing Fee Payment Dialog */}
          {isMounted &&
            showListingFeeDialog &&
            createPortal(
              <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
                style={{ zIndex: 999999, pointerEvents: "auto" }}
                onClick={(e) => {
                  console.log("[v0] Backdrop clicked")
                  if (e.target === e.currentTarget) {
                    setShowListingFeeDialog(false)
                    setPendingProduct(null)
                    setListingPromoCode("")
                    setListingPromoApplied(false)
                    setPendingPaymentId(null) // Clear payment ID
                  }
                }}
              >
                <Card className="w-full max-w-md pointer-events-auto">
                  <CardHeader>
                    <CardTitle>Listing Fee Required</CardTitle>
                    <CardDescription>
                      {userIsOwner
                        ? "Owner Account - No listing fees"
                        : listingPromoApplied
                          ? "QUADSTATE Promo Applied - Special Rate"
                          : "Pay a small fee to list your product"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Listing Fee:</span>
                        <span className="text-2xl font-bold">{calculatedListingFee.toFixed(4)}π</span>
                      </div>
                      {calculate3DFee() > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">3D Generation Fee:</span>
                          <span className="font-medium">{calculate3DFee().toFixed(4)}π</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {listingPromoApplied
                          ? "QUADSTATE rate: 0.001π"
                          : `≈ $${(calculatedListingFee * piPrice).toFixed(2)} USD`}
                      </p>
                      {listingPromoApplied && (
                        <div className="mt-2 text-green-600 font-medium text-sm">✓ QUADSTATE Applied</div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Have a promo code?</Label>
                      <div className="flex gap-2">
                        <Input
                          value={listingPromoCode}
                          onChange={(e) => setListingPromoCode(e.target.value)}
                          placeholder=""
                          disabled={listingPromoApplied}
                        />
                        <Button
                          type="button"
                          onClick={(e) => {
                            console.log("[v0] ============ APPLY BUTTON CLICKED ============")
                            console.log("[v0] Promo code:", listingPromoCode)
                            e.preventDefault()
                            e.stopPropagation()
                            applyListingPromoCode()
                          }}
                          variant="outline"
                          disabled={listingPromoApplied || !listingPromoCode.trim()}
                          style={{ pointerEvents: "auto" }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Listing Fee: {calculatedListingFee.toFixed(4)}π per product</p>
                      <p>• Transaction Fee: 3% when item sells</p>
                    </div>

                    {userIsOwner && (
                      <div className="bg-green-500/10 p-4 rounded-lg text-center">
                        <p className="text-green-600 font-medium">✓ Owner Account</p>
                        <p className="text-sm text-muted-foreground mt-1">List for FREE</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      type="button"
                      onClick={(e) => {
                        console.log("[v0] ============ PAY BUTTON CLICKED ============")
                        console.log("[v0] Event target:", e.target)
                        e.preventDefault()
                        e.stopPropagation()
                        handleListingPaymentTrigger().catch((err) => {
                          // Use handleListingPaymentTrigger
                          console.error("[v0] Payment handler error:", err)
                          toast({
                            title: "Error",
                            description: err.message || "Payment failed",
                            variant: "destructive",
                          })
                        })
                      }}
                      className="flex-1"
                      style={{ pointerEvents: "auto" }}
                    >
                      {isConnecting ? "Connecting..." : !isConnected ? "Connect Wallet & Pay" : "Pay & List"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowListingFeeDialog(false)
                        setPendingProduct(null)
                        setListingPromoCode("")
                        setListingPromoApplied(false)
                        setPendingPaymentId(null) // Clear payment ID
                      }}
                      style={{ pointerEvents: "auto" }}
                    >
                      Cancel
                    </Button>
                  </CardFooter>
                </Card>
              </div>,
              document.body,
            )}
          {/* Add SoldOutDialog to JSX */}
          {soldOutProduct && (
            <SoldOutDialog
              product={soldOutProduct}
              open={showSoldOutDialog}
              onClose={() => {
                setShowSoldOutDialog(false)
                setSoldOutProduct(null)
              }}
              onRelist={handleRelistProduct}
              onArchive={handleArchiveProduct}
            />
          )}

          {/* Product Details Modal */}
          {selectedProduct && showProductModal && (
            <ProductDetailsModal
              product={selectedProduct}
              isOpen={showProductModal}
              onClose={() => {
                setShowProductModal(false)
                setSelectedProduct(null)
              }}
            />
          )}

          <Card className="border-destructive/50 bg-destructive/5 mt-8 max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5" />
                Delete Business Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteBusinessAccount} size="sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Business Account
              </Button>
            </CardContent>
          </Card>
        </main>
      )}
    </div>
  )
}
