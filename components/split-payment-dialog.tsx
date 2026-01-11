"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Minus, Check } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/contexts/currency-provider"

interface SplitPaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  onConfirm: (splits: { userId: string; amount: number }[]) => void
}

export function SplitPaymentDialog({ isOpen, onClose, totalAmount, onConfirm }: SplitPaymentDialogProps) {
  const [numberOfPeople, setNumberOfPeople] = useState(2)
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal")
  const [customSplits, setCustomSplits] = useState<number[]>([])
  const { toast } = useToast()
  const { formatPriceWithUSD } = useCurrency()

  const handleConfirm = () => {
    if (splitType === "equal") {
      const splitAmount = totalAmount / numberOfPeople
      const splits = Array(numberOfPeople).fill(0).map((_, i) => ({
        userId: `user-${i + 1}`,
        amount: splitAmount
      }))
      onConfirm(splits)
    } else {
      const total = customSplits.reduce((sum, amt) => sum + amt, 0)
      if (Math.abs(total - totalAmount) > 0.01) {
        toast({
          title: "Invalid split",
          description: "Split amounts must equal the total",
          variant: "destructive"
        })
        return
      }
      const splits = customSplits.map((amt, i) => ({
        userId: `user-${i + 1}`,
        amount: amt
      }))
      onConfirm(splits)
    }
    onClose()
  }

  const perPersonAmount = totalAmount / numberOfPeople

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Split Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-primary/10 border-2 border-primary">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatPriceWithUSD(totalAmount).pi}</p>
              <p className="text-sm text-slate-600">{formatPriceWithUSD(totalAmount).usd}</p>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button
              variant={splitType === "equal" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSplitType("equal")}
            >
              Equal Split
            </Button>
            <Button
              variant={splitType === "custom" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setSplitType("custom")}
            >
              Custom Split
            </Button>
          </div>

          {splitType === "equal" && (
            <>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumberOfPeople(Math.max(2, numberOfPeople - 1))}
                  disabled={numberOfPeople <= 2}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="text-center min-w-[100px]">
                  <p className="text-2xl font-bold">{numberOfPeople}</p>
                  <p className="text-xs text-slate-600">people</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNumberOfPeople(Math.min(10, numberOfPeople + 1))}
                  disabled={numberOfPeople >= 10}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Card className="p-4 bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 mb-2">Each person pays:</p>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{formatPriceWithUSD(perPersonAmount).pi}</p>
                  <p className="text-sm text-slate-600">{formatPriceWithUSD(perPersonAmount).usd}</p>
                </div>
              </Card>
            </>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              <Check className="w-4 h-4 mr-2" />
              Confirm Split
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
