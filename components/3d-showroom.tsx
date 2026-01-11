"use client"

import { useState } from "react"
import { X } from "@/lib/icons"
import { Button } from "@/components/ui/button"

interface ThreeDShowroomProps {
  photos3D: {
    front?: string
    side?: string
    top?: string
    angle45?: string
  }
  productTitle: string
  businessCategory: string
  onClose: () => void
}

const SHOWROOM_TEMPLATES = {
  Electronics: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    floorColor: "#1a1a2e",
    lighting: "bright",
  },
  Fashion: {
    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    floorColor: "#ffe6e6",
    lighting: "soft",
  },
  Furniture: {
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #e8d5b7 100%)",
    floorColor: "#8B7355",
    lighting: "natural",
    ambiance: "luxury-interior",
  },
  "Home & Garden": {
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    floorColor: "#e8f5f7",
    lighting: "natural",
  },
  "Sports & Outdoors": {
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    floorColor: "#e0f2f1",
    lighting: "bright",
  },
  "Beauty & Health": {
    background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    floorColor: "#fff3e0",
    lighting: "soft",
  },
  "Food & Beverages": {
    background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
    floorColor: "#f5f5f5",
    lighting: "warm",
  },
  Automotive: {
    background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    floorColor: "#263238",
    lighting: "bright",
  },
  "Books & Media": {
    background: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
    floorColor: "#f9f9f9",
    lighting: "soft",
  },
  Toys: {
    background: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
    floorColor: "#fffde7",
    lighting: "bright",
  },
  Jewelry: {
    background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    floorColor: "#000000",
    lighting: "spotlight",
  },
  default: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    floorColor: "#2d2d2d",
    lighting: "neutral",
  },
}

export function ThreeDShowroom({ photos3D, productTitle, businessCategory, onClose }: ThreeDShowroomProps) {
  const [currentView, setCurrentView] = useState<"front" | "side" | "top" | "angle45">("front")
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)

  const template = SHOWROOM_TEMPLATES[businessCategory as keyof typeof SHOWROOM_TEMPLATES] || SHOWROOM_TEMPLATES.default

  const availableViews = Object.entries(photos3D).filter(([_, url]) => url) as Array<[keyof typeof photos3D, string]>

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <div>
          <h2 className="text-white text-xl font-bold">{productTitle}</h2>
          <p className="text-white/60 text-sm">3D Showroom - {businessCategory}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* 3D Showroom */}
      <div className="flex-1 relative overflow-hidden" style={{ background: template.background }}>
        {/* Floor */}
        {businessCategory === "Furniture" ? (
          <>
            {/* Hardwood Floor with grain pattern */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/2"
              style={{
                background: `
                  repeating-linear-gradient(
                    90deg,
                    ${template.floorColor} 0px,
                    #A0826D 120px,
                    ${template.floorColor} 240px
                  ),
                  linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)
                `,
                opacity: 0.9,
              }}
            />
            {/* Wall Paneling Effect */}
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
            {/* Room Corner Shadow Effect */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.2) 100%)
                `,
              }}
            />
            {/* Ambient Window Light */}
            <div
              className="absolute top-0 right-0 w-64 h-64"
              style={{
                background: "radial-gradient(circle, rgba(255,253,240,0.6) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
          </>
        ) : (
          <div
            className="absolute bottom-0 left-0 right-0 h-1/3"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${template.floorColor} 100%)`,
              opacity: 0.8,
            }}
          />
        )}

        {/* Product Display */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div
            className="relative max-w-2xl max-h-full transition-transform duration-500 ease-out"
            style={{
              transform: `rotate(${rotation}deg) scale(${zoom})`,
              filter:
                template.lighting === "spotlight"
                  ? "drop-shadow(0 0 40px rgba(255,255,255,0.8))"
                  : businessCategory === "Furniture"
                    ? "drop-shadow(0 30px 80px rgba(0,0,0,0.5)) drop-shadow(0 10px 20px rgba(0,0,0,0.3))"
                    : "drop-shadow(0 20px 60px rgba(0,0,0,0.4))",
            }}
          >
            <img
              src={photos3D[currentView] || availableViews[0]?.[1] || "/placeholder.svg"}
              alt={`${productTitle} - ${currentView} view`}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* View Label */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full">
          <span className="capitalize font-medium">{currentView} View</span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-4 space-y-3">
        {/* View Selector */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-white text-sm font-medium mr-2">View:</span>
          {availableViews.map(([view, url]) => (
            <Button
              key={view}
              variant={currentView === view ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentView(view as any)}
              className="capitalize"
            >
              {view}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRotate}>
            🔄 Rotate
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            🔍− Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            🔍+ Zoom In
          </Button>
        </div>

        {/* Thumbnail Strip */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
          {availableViews.map(([view, url]) => (
            <button
              key={view}
              onClick={() => setCurrentView(view as any)}
              className={`w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                currentView === view ? "border-primary scale-110" : "border-white/20 hover:border-white/40"
              }`}
            >
              <img src={url || "/placeholder.svg"} alt={view} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
