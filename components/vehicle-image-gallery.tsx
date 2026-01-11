"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import Image from "next/image"

interface VehicleImageGalleryProps {
  images: string[]
  vehicleName: string
}

export function VehicleImageGallery({ images, vehicleName }: VehicleImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handlePrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + images.length) % images.length)
    }
  }

  const handleNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % images.length)
    }
  }

  const handleClose = () => {
    setSelectedIndex(null)
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className="relative aspect-video rounded-lg overflow-hidden border-2 border-muted hover:border-primary transition-colors cursor-pointer group"
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`${vehicleName} - Image ${index + 1}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={handleClose}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              onClick={handleClose}
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-6 h-6" />
            </Button>

            {/* Previous Button */}
            {images.length > 1 && (
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="icon"
                className="absolute left-4 z-50 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            {/* Main Image */}
            {selectedIndex !== null && (
              <div className="relative w-full h-full p-16">
                <Image
                  src={images[selectedIndex] || "/placeholder.svg"}
                  alt={`${vehicleName} - Image ${selectedIndex + 1}`}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {/* Next Button */}
            {images.length > 1 && (
              <Button
                onClick={handleNext}
                variant="ghost"
                size="icon"
                className="absolute right-4 z-50 bg-black/50 hover:bg-black/70 text-white"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Image Counter */}
            {selectedIndex !== null && images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
