"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface RatingDialogProps {
  open: boolean
  onClose: () => void
  driverName: string
  serviceType: "ride" | "food" | "package"
  onSubmit: (rating: number, review: string) => void
}

export function RatingDialog({ open, onClose, driverName, serviceType, onSubmit }: RatingDialogProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [review, setReview] = useState("")
  const { toast } = useToast()

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      })
      return
    }

    onSubmit(rating, review)
    toast({
      title: "Thank you for your feedback!",
      description: `You rated ${driverName} ${rating} stars`,
    })

    // Reset form
    setRating(0)
    setReview("")
    onClose()
  }

  const serviceTypeLabel = serviceType === "ride" ? "ride" : serviceType === "food" ? "delivery" : "package delivery"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your {serviceTypeLabel.charAt(0).toUpperCase() + serviceTypeLabel.slice(1)}</DialogTitle>
          <DialogDescription>How was your experience with {driverName}?</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 5 && "Excellent!"}
                {rating === 4 && "Great!"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <label htmlFor="review" className="text-sm font-medium">
              Leave a review (optional)
            </label>
            <Textarea
              id="review"
              placeholder={`Share your experience with ${driverName}...`}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Skip
            </Button>
            <Button onClick={handleSubmit} className="flex-1" disabled={rating === 0}>
              Submit Rating
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
