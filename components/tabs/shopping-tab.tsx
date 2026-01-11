"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingBag, Store } from "@/lib/icons"
import Link from "next/link"

export function ShoppingTab() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Shopping</h2>
          <p className="text-muted-foreground">Discover amazing products from Pi Network businesses</p>
        </div>
        <Input
          placeholder="Search marketplace..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="text-2xl">Pi Marketplace</CardTitle>
              <CardDescription>Shop from verified Pi businesses worldwide</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Pay with Pi cryptocurrency
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Support Pi Network businesses
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Secure transactions
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              USA and International sellers
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Browse by category, location, or business
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">✓</span>
              Make offers and negotiate prices
            </div>
          </div>

          <Link href="/marketplace">
            <Button size="lg" className="w-full" onClick={() => console.log("[v0] Browse Marketplace button clicked")}>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Browse Marketplace
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Register Business Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Store className="w-10 h-10 text-primary" />
            <div>
              <CardTitle>Sell on Pi Marketplace</CardTitle>
              <CardDescription>Register your business and start selling</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Join our growing marketplace and reach customers in the Pi Network ecosystem. List your products, set your
            prices, accept offers, and grow your business with Pi cryptocurrency.
          </p>
          <Button variant="outline" className="w-full bg-transparent" disabled>
            <Store className="w-4 h-4 mr-2" />
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
