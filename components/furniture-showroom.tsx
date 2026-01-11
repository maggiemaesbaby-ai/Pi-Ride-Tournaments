"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MarketplaceProduct } from "@/lib/marketplace-db"

interface FurnitureShowroomProps {
  products: MarketplaceProduct[]
  onSelectProduct: (product: MarketplaceProduct) => void
}

export function FurnitureShowroom({ products, onSelectProduct }: FurnitureShowroomProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)

  return (
    <div className="relative min-h-[80vh]">
      {/* Showroom Background - Luxury Interior */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #e8d5b7 100%)",
        }}
      >
        {/* Hardwood Floor Effect */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1/2"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                #8B7355 0px,
                #A0826D 120px,
                #8B7355 240px
              ),
              linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 100%)
            `,
            opacity: 0.9,
          }}
        />

        {/* Wall with subtle texture */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2"
          style={{
            background: `
              linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, transparent 100%),
              repeating-linear-gradient(
                0deg,
                rgba(255,255,255,0.05) 0px,
                rgba(255,255,255,0.1) 1px,
                transparent 2px,
                transparent 80px
              )
            `,
          }}
        />

        {/* Ambient lighting from window */}
        <div
          className="absolute top-0 right-0 w-96 h-96"
          style={{
            background: "radial-gradient(circle, rgba(255,253,240,0.6) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Room corner shadows */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.15) 100%)",
          }}
        />
      </div>

      {/* Product Display - 3D Perspective Grid */}
      <div className="relative z-10 pt-16 pb-8 px-8">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
          style={{
            perspective: "1000px",
          }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="relative cursor-pointer transition-all duration-500 ease-out"
              style={{
                transform: hoveredProduct === product.id ? "translateY(-20px) scale(1.05)" : "translateY(0) scale(1)",
                filter:
                  hoveredProduct === product.id
                    ? "drop-shadow(0 30px 80px rgba(0,0,0,0.5))"
                    : "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
              }}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={() => onSelectProduct(product)}
            >
              {/* Product Card */}
              <Card className="overflow-hidden bg-white/95 backdrop-blur-sm border-2 border-white/50 shadow-2xl">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500"
                      style={{
                        transform: hoveredProduct === product.id ? "scale(1.1)" : "scale(1)",
                      }}
                    />

                    {/* Price Tag - Premium Design */}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 rounded-full shadow-lg">
                      <span className="text-2xl font-bold">{product.price}π</span>
                    </div>

                    {/* 3D Badge */}
                    {product.has3D && <Badge className="absolute top-3 right-3 bg-purple-600">3D View</Badge>}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-lg line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary">{product.condition}</Badge>
                      {product.stock > 0 ? (
                        <span className="text-xs text-green-600 font-medium">In Stock</span>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Sold Out</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floor Shadow */}
              <div
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full"
                style={{
                  background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)",
                  filter: "blur(10px)",
                  opacity: hoveredProduct === product.id ? 0.6 : 0.4,
                  transition: "opacity 0.5s",
                }}
              />
            </div>
          ))}
        </div>

        {/* Showroom Info Banner */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white/90 backdrop-blur-sm px-8 py-4 rounded-full shadow-lg border-2 border-amber-200">
            <p className="text-lg font-semibold text-gray-800">
              🪑 Welcome to our Furniture Showroom • Click any item to view details
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
