"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Package, RefreshCw, Archive, CheckCircle } from "@/lib/icons"
import { useState } from "react"
import type { MarketplaceProduct } from "@/lib/marketplace-db"

interface SoldOutDialogProps {
  product: MarketplaceProduct
  open: boolean
  onClose: () => void
  onRelist: (productId: string, newStock: number, newPrice?: number) => void
  onArchive: (productId: string) => void
}

export function SoldOutDialog({ product, open, onClose, onRelist, onArchive }: SoldOutDialogProps) {
  const [relistStock, setRelistStock] = useState("10")
  const [relistPrice, setRelistPrice] = useState(product.price.toString())
  const [keepSamePrice, setKeepSamePrice] = useState(true)

  const handleRelist = () => {
    const stock = Number.parseInt(relistStock)
    if (isNaN(stock) || stock <= 0) {
      alert("Please enter a valid stock quantity")
      return
    }

    const price = keepSamePrice ? product.price : Number.parseFloat(relistPrice)
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price")
      return
    }

    onRelist(product.id, stock, keepSamePrice ? undefined : price)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <DialogTitle>Product Sold Out!</DialogTitle>
              <DialogDescription>"{product.title}" has sold all available stock</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Alert className="bg-green-500/10 border-green-500/20">
          <Package className="w-4 h-4 text-green-600" />
          <AlertDescription>
            <strong>Congratulations!</strong> All {product.stock} units have been sold. Would you like to relist this
            product with more inventory?
          </AlertDescription>
        </Alert>

        <div className="space-y-4 pt-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Previous Stock:</span>
              <Badge variant="outline">{product.stock} units</Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Price:</span>
              <Badge variant="outline">{product.price}π</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Sales:</span>
              <Badge className="bg-green-500">{product.sales} sold</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="relist-stock">New Stock Quantity</Label>
              <Input
                id="relist-stock"
                type="number"
                min="1"
                value={relistStock}
                onChange={(e) => setRelistStock(e.target.value)}
                placeholder="Enter quantity"
              />
              <p className="text-xs text-muted-foreground mt-1">How many units do you want to list?</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="keep-same-price"
                  checked={keepSamePrice}
                  onChange={(e) => setKeepSamePrice(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="keep-same-price" className="cursor-pointer">
                  Keep same price ({product.price}π)
                </Label>
              </div>

              {!keepSamePrice && (
                <div>
                  <Label htmlFor="relist-price">New Price (π)</Label>
                  <Input
                    id="relist-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={relistPrice}
                    onChange={(e) => setRelistPrice(e.target.value)}
                    placeholder="Enter new price"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleRelist} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Relist Product
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onArchive(product.id)
                onClose()
              }}
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Relisting will apply standard listing fees. Choose "Archive" to keep the product inactive in your dashboard.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
