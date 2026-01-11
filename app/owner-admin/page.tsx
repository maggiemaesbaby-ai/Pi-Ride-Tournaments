"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { usePiWallet } from "@/hooks/use-pi-wallet"
import { isOwner } from "@/lib/owner-config"
import { MarketplaceDB, type MarketplaceProduct } from "@/lib/marketplace-db"
import { driverDB } from "@/lib/driver-db"
import { getAllPaymentRecords } from "@/lib/payment-logger"
import { DollarSign, TrendingUp, ShoppingBag, Car, Store, Shield, Trash2, AlertTriangle } from "lucide-react"
import { useCurrency } from "@/contexts/currency-provider"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function OwnerAdminPage() {
  const { user } = usePiWallet()
  const router = useRouter()
  const { toast } = useToast()
  const { formatPriceWithUSD } = useCurrency()
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalDrivers: 0,
    totalBusinesses: 0,
    totalProducts: 0,
    activeDrivers: 0,
    pendingDriverApprovals: 0,
    completedRides: 0,
  })

  const [showRemovalDialog, setShowRemovalDialog] = useState(false)
  const [productToRemove, setProductToRemove] = useState<MarketplaceProduct | null>(null)
  const [removalReason, setRemovalReason] = useState("")
  const [allProducts, setAllProducts] = useState<MarketplaceProduct[]>([])
  const [businesses, setBusinesses] = useState<any[]>([])
  const userIsOwner = isOwner(user?.uid)

  const loadData = () => {
    const transactions = getAllPaymentRecords()
    const drivers = driverDB.getAllDrivers()
    const products = MarketplaceDB.getAllProducts()
    const businessList = JSON.parse(localStorage.getItem("registered_businesses") || "[]")

    setAllProducts(products)
    setBusinesses(businessList)

    const totalRevenue = transactions
      .filter((t) => t.status === "completed" && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    setStats({
      totalRevenue,
      totalTransactions: transactions.length,
      totalDrivers: drivers.length,
      totalBusinesses: businessList.length,
      totalProducts: products.length,
      activeDrivers: drivers.filter((d) => d.isOnline).length,
      pendingDriverApprovals: drivers.filter((d) => !d.approved).length,
      completedRides: drivers.reduce((sum, d) => sum + d.completedRides, 0),
    })
  }

  useEffect(() => {
    if (!user || !userIsOwner) {
      toast({
        title: "Access Denied",
        description: "You must be the platform owner to access this page.",
        variant: "destructive",
      })
      router.push("/business-dashboard")
    } else {
      loadData()
    }
  }, [user, userIsOwner, router, toast])

  // Return loading state while checking permissions
  if (!user || !userIsOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Verifying access...</div>
      </div>
    )
  }

  const handleRemoveProduct = (product: MarketplaceProduct) => {
    setProductToRemove(product)
    setRemovalReason("")
    setShowRemovalDialog(true)
  }

  const confirmRemoveProduct = async () => {
    if (!productToRemove || !removalReason.trim()) {
      toast({
        title: "Missing Reason",
        description: "Please provide a reason for removing this product",
        variant: "destructive",
      })
      return
    }

    try {
      // Remove product from marketplace
      MarketplaceDB.deleteProduct(productToRemove.id)

      // Send notification to business owner
      const removalNotification = {
        id: `removal_${Date.now()}`,
        productId: productToRemove.id,
        productTitle: productToRemove.title,
        businessId: productToRemove.businessId,
        businessName: productToRemove.businessName,
        reason: removalReason,
        removedBy: user?.username || "Platform Admin",
        timestamp: Date.now(),
      }

      // Store removal notification in localStorage for business owner to see
      const notifications = JSON.parse(localStorage.getItem(`notifications_${productToRemove.businessId}`) || "[]")
      notifications.push(removalNotification)
      localStorage.setItem(`notifications_${productToRemove.businessId}`, JSON.stringify(notifications))

      toast({
        title: "Product Removed",
        description: `${productToRemove.title} has been removed. Seller has been notified.`,
      })

      setShowRemovalDialog(false)
      setProductToRemove(null)
      setRemovalReason("")
      loadData()
    } catch (error) {
      console.error("[v0] Error removing product:", error)
      toast({
        title: "Error",
        description: "Failed to remove product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getProductsByBusiness = (businessId: string) => {
    return allProducts.filter((p) => p.businessId === businessId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-amber-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Owner Admin Dashboard</h1>
            <p className="text-muted-foreground">Complete platform management and analytics</p>
            <Badge className="mt-2 bg-gradient-to-r from-purple-600 to-amber-600 text-white">Zero Fees Applied</Badge>
          </div>
          <Button onClick={() => router.push("/")}>Return to Platform</Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">{formatPriceWithUSD(stats.totalRevenue).pi}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Drivers</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.activeDrivers} / {stats.totalDrivers}
                  </p>
                </div>
                <Car className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Marketplace Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ride Management Section */}
        <Card className="border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Car className="w-6 h-6" />
              Ride Management & Driver Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Active Drivers Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{stats.activeDrivers}</div>
                <div className="text-sm text-muted-foreground">Online Now</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{stats.completedRides}</div>
                <div className="text-sm text-muted-foreground">Total Rides</div>
              </div>
            </div>

            {/* Online Drivers List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Currently Online:</h4>
              {driverDB.getAllDrivers().filter((d) => d.isOnline).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No drivers currently online</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {driverDB
                    .getAllDrivers()
                    .filter((d) => d.isOnline)
                    .map((driver) => (
                      <div key={driver.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium">{driver.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({driver.vehicleType})</span>
                        </div>
                        {driver.inRide && (
                          <Badge variant="secondary" className="text-xs">
                            In Ride
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Driver Stats Summary */}
            <div className="space-y-2 pt-4 border-t">
              <h4 className="font-semibold text-sm">Top Drivers:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {driverDB
                  .getAllDrivers()
                  .sort((a, b) => b.completedRides - a.completedRides)
                  .slice(0, 5)
                  .map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-2 bg-white rounded-lg border">
                      <div>
                        <div className="text-sm font-medium">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">Rating: {driver.rating.toFixed(1)} ⭐</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{driver.completedRides} rides</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPriceWithUSD(driver.totalEarnings).pi}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <Button className="w-full mt-4" onClick={() => router.push("/admin/drivers")}>
              <Car className="w-4 h-4 mr-2" />
              Full Driver Management
            </Button>
          </CardContent>
        </Card>

        {/* Marketplace Management Section */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <ShoppingBag className="w-6 h-6" />
              Marketplace Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Marketplace Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{stats.totalProducts}</div>
                <div className="text-sm text-muted-foreground">Total Products</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">{stats.totalBusinesses}</div>
                <div className="text-sm text-muted-foreground">Businesses</div>
              </div>
            </div>

            {/* Product List with Actions */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Products:</h4>
              {allProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No products listed yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allProducts.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-purple-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.businessName} • {formatPriceWithUSD(product.price).pi}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(product)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button className="w-full mt-4" onClick={() => router.push("/marketplace")}>
              <Store className="w-4 h-4 mr-2" />
              View Full Marketplace
            </Button>
          </CardContent>
        </Card>

        {/* Owner Privileges Card - Full Width */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Shield className="w-6 h-6" />
              Owner Privileges & Fee Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium">Marketplace Listing Fees:</span>
                <Badge className="bg-green-500">$0 (Waived)</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium">Transaction Fees:</span>
                <Badge className="bg-green-500">0% (Waived)</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium">Driver Signup Fee:</span>
                <Badge className="bg-green-500">$0 (Waived)</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium">Business Setup Fee:</span>
                <Badge className="bg-green-500">$0 (Waived)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRemovalDialog} onOpenChange={setShowRemovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Remove Product from Marketplace
            </DialogTitle>
            <DialogDescription>
              This will permanently remove the product and notify the seller. Please provide a reason for removal.
            </DialogDescription>
          </DialogHeader>
          {productToRemove && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-semibold">{productToRemove.title}</p>
                <p className="text-sm text-muted-foreground">By: {productToRemove.businessName}</p>
                <p className="text-sm font-bold text-primary mt-2">{productToRemove.price}π</p>
              </div>
              <div>
                <Label htmlFor="removal-reason">Reason for Removal *</Label>
                <Textarea
                  id="removal-reason"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  placeholder="E.g., Violates Pi Network guidelines, inappropriate content, misleading product information..."
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemovalDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveProduct}>
              Remove Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
