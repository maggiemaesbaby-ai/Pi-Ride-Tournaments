"use client"

import { useState, useRef, type TouchEvent, type WheelEvent } from "react"
import { ShoppingBag, X, ZoomIn, ZoomOut } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Interactive3DViewerProps {
  photos3D: {
    front?: string
    back?: string
    left?: string
    right?: string
    top?: string
    bottom?: string
  }
  productTitle: string
  enableFullscreen?: boolean
}

export function Interactive3DViewer({ photos3D, productTitle, enableFullscreen = true }: Interactive3DViewerProps) {
  const availableViews: Array<keyof typeof photos3D> = []
  if (photos3D.front) availableViews.push("front")
  if (photos3D.right) availableViews.push("right")
  if (photos3D.top) availableViews.push("top")
  if (photos3D.left) availableViews.push("left")
  if (photos3D.back) availableViews.push("back")
  if (photos3D.bottom) availableViews.push("bottom")

  const [currentViewIndex, setCurrentViewIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0, posX: 0, posY: 0 })
  const dragThreshold = 50

  if (availableViews.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <ShoppingBag className="w-24 h-24 text-muted-foreground" />
      </div>
    )
  }

  const currentView = availableViews[currentViewIndex]

  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0,
        posX: position.x,
        posY: position.y,
      }
      setIsDragging(true)
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      touchStartRef.current.distance = distance
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const scaleChange = distance / touchStartRef.current.distance
      setScale((prev) => Math.max(1, Math.min(4, prev * scaleChange)))
      touchStartRef.current.distance = distance
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan when zoomed
      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y
      setPosition({
        x: touchStartRef.current.posX + deltaX,
        y: touchStartRef.current.posY + deltaY,
      })
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault()
    if (e.changedTouches.length === 1 && isDragging && scale === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y

      // Swipe to change views
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
        if (deltaX > 0) {
          setCurrentViewIndex((prev) => (prev - 1 + availableViews.length) % availableViews.length)
        } else {
          setCurrentViewIndex((prev) => (prev + 1) % availableViews.length)
        }
      } else if (Math.abs(deltaY) > dragThreshold) {
        if (deltaY > 0) {
          setCurrentViewIndex((prev) => (prev - 1 + availableViews.length) % availableViews.length)
        } else {
          setCurrentViewIndex((prev) => (prev + 1) % availableViews.length)
        }
      }
    }
    setIsDragging(false)
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.95 : 1.05
      setScale((prev) => Math.max(1, Math.min(4, prev * delta)))
    } else {
      if (Math.abs(e.deltaY) > 20) {
        if (e.deltaY > 0) {
          setCurrentViewIndex((prev) => (prev + 1) % availableViews.length)
        } else {
          setCurrentViewIndex((prev) => (prev - 1 + availableViews.length) % availableViews.length)
        }
      }
    }
  }

  const handleDoubleClick = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleSingleClick = () => {
    if (!isFullscreen) {
      setIsFullscreen(true)
    } else if (scale > 1) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(4, prev + 0.5))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(1, prev - 0.5))
    if (scale <= 1.5) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const closeFullscreen = () => {
    setIsFullscreen(false)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const viewerContent = (
    <div
      ref={containerRef}
      className={`w-full relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 touch-none cursor-grab active:cursor-grabbing ${
        isFullscreen ? "h-screen" : "aspect-square rounded-xl"
      }`}
      style={{ touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
    >
      <img
        src={photos3D[currentView] || "/placeholder.svg"}
        alt={`${productTitle} - ${currentView} view`}
        className="absolute inset-0 w-full h-full object-contain transition-transform duration-200"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
        }}
        draggable={false}
      />

      <Badge className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white border-white/20 capitalize z-10">
        {currentView} view
      </Badge>

      {scale > 1 && (
        <Badge className="absolute top-4 right-4 bg-black/80 backdrop-blur text-white border-white/20 z-10">
          {Math.round(scale * 100)}%
        </Badge>
      )}

      {/* Zoom Controls */}
      {!isFullscreen && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          <Button
            size="icon"
            variant="secondary"
            onClick={zoomIn}
            className="bg-black/80 backdrop-blur hover:bg-black/90 text-white border border-white/20"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={zoomOut}
            className="bg-black/80 backdrop-blur hover:bg-black/90 text-white border border-white/20"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur text-white px-6 py-2 rounded-xl text-xs max-w-[90%] z-10 border border-white/20">
        <p className="text-center font-medium">
          <strong>Swipe</strong> to rotate • <strong>Pinch</strong> to zoom • <strong>Tap</strong> to reset
        </p>
      </div>

      {/* View Indicators */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {availableViews.map((view, index) => (
          <button
            key={view}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentViewIndex(index)
            }}
            className={`h-2 rounded-full transition-all border border-white/30 ${
              index === currentViewIndex ? "bg-white w-8" : "bg-white/40 w-2"
            }`}
            aria-label={`View ${view}`}
          />
        ))}
      </div>

      {/* Close Fullscreen */}
      {isFullscreen && (
        <Button
          size="icon"
          variant="secondary"
          onClick={closeFullscreen}
          className="absolute top-4 left-4 bg-black/80 backdrop-blur hover:bg-black/90 text-white border border-white/20 z-10"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )

  if (isFullscreen) {
    return <div className="fixed inset-0 z-[100] bg-black">{viewerContent}</div>
  }

  return viewerContent
}
