"use client"

import { useState, useRef, type TouchEvent, type WheelEvent } from "react"
import { ShoppingBag, X } from "@/lib/icons"
import { Button } from "@/components/ui/button"

interface Interactive2DViewerProps {
  images: string[]
  productTitle: string
}

export function Interactive2DViewer({ images, productTitle }: Interactive2DViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 })
  const dragThreshold = 50

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <ShoppingBag className="w-24 h-24 text-muted-foreground" />
      </div>
    )
  }

  const handleImageClick = () => {
    setIsFullscreen(true)
  }

  const handleCloseFullscreen = () => {
    setIsFullscreen(false)
    setScale(1)
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0,
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

    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const scaleChange = distance / touchStartRef.current.distance
      setScale((prev) => Math.max(1, Math.min(3, prev * scaleChange)))
      touchStartRef.current.distance = distance
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length === 1 && isDragging) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
        if (deltaX > 0) {
          setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
        } else {
          setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }
      } else if (Math.abs(deltaY) > dragThreshold) {
        if (deltaY > 0) {
          setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
        } else {
          setCurrentImageIndex((prev) => (prev + 1) % images.length)
        }
      }
    }
    setIsDragging(false)
  }

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault()

    if (e.ctrlKey || e.metaKey) {
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setScale((prev) => Math.max(1, Math.min(3, prev * delta)))
    } else {
      if (Math.abs(e.deltaY) > 20) {
        if (e.deltaY > 0) {
          setCurrentImageIndex((prev) => (prev + 1) % images.length)
        } else {
          setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
        }
      }
    }
  }

  const handleDoubleClick = () => {
    setScale(1)
  }

  return (
    <>
      <div
        ref={containerRef}
        className="w-full aspect-square relative overflow-hidden bg-muted touch-none cursor-pointer"
        onClick={handleImageClick}
        style={{ borderRadius: 0 }}
      >
        <img
          src={images[currentImageIndex] || "/placeholder.svg"}
          alt={`${productTitle} - Image ${currentImageIndex + 1}`}
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
          {currentImageIndex + 1} / {images.length}
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentImageIndex(index)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                }`}
                aria-label={`Image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
          <div
            className="w-full h-full relative touch-none cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={images[currentImageIndex] || "/placeholder.svg"}
              alt={`${productTitle} - Image ${currentImageIndex + 1}`}
              className="absolute inset-0 w-full h-full object-contain transition-transform duration-300"
              style={{ transform: `scale(${scale})` }}
              draggable={false}
            />

            <Button
              onClick={handleCloseFullscreen}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white rounded-full w-12 h-12"
            >
              <X className="w-6 h-6" />
            </Button>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
              {currentImageIndex + 1} / {images.length}
            </div>

            {scale > 1 && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm z-10">
                {Math.round(scale * 100)}%
              </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-1.5 rounded-lg text-xs max-w-[90%] z-10">
              <p className="text-center">
                <strong>Swipe</strong> to navigate • <strong>Pinch</strong> to zoom • <strong>Double tap</strong> to
                reset
              </p>
            </div>

            {images.length > 1 && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? "bg-white w-4" : "bg-white/50"
                    }`}
                    aria-label={`Image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
