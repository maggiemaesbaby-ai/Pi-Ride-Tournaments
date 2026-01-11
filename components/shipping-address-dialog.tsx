"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Plus } from "@/lib/icons"

export interface ShippingAddress {
  id: string
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  isDefault: boolean
}

interface ShippingAddressDialogProps {
  open: boolean
  onClose: () => void
  onSelectAddress: (address: ShippingAddress) => void
  userId: string
}

const ADDRESSES_KEY = "buyer_shipping_addresses"

export function ShippingAddressDialog({ open, onClose, onSelectAddress, userId }: ShippingAddressDialogProps) {
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([])
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Partial<ShippingAddress>>({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    phone: "",
    isDefault: false,
  })

  useEffect(() => {
    if (open) {
      loadAddresses()
    }
  }, [open, userId])

  const loadAddresses = () => {
    const data = localStorage.getItem(`${ADDRESSES_KEY}_${userId}`)
    if (data) {
      setSavedAddresses(JSON.parse(data))
    }
  }

  const saveAddress = () => {
    if (
      !newAddress.fullName ||
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.state ||
      !newAddress.zipCode ||
      !newAddress.phone
    ) {
      alert("Please fill in all required fields")
      return
    }

    const address: ShippingAddress = {
      id: `addr_${Date.now()}`,
      fullName: newAddress.fullName,
      addressLine1: newAddress.addressLine1,
      addressLine2: newAddress.addressLine2,
      city: newAddress.city!,
      state: newAddress.state!,
      zipCode: newAddress.zipCode!,
      country: newAddress.country || "United States",
      phone: newAddress.phone!,
      isDefault: newAddress.isDefault || savedAddresses.length === 0,
    }

    const updatedAddresses = savedAddresses.map((a) => ({
      ...a,
      isDefault: address.isDefault ? false : a.isDefault,
    }))

    updatedAddresses.push(address)

    localStorage.setItem(`${ADDRESSES_KEY}_${userId}`, JSON.stringify(updatedAddresses))
    setSavedAddresses(updatedAddresses)
    setShowNewAddressForm(false)
    setNewAddress({
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      phone: "",
      isDefault: false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Shipping Address</DialogTitle>
          <DialogDescription>Choose a saved address or add a new one</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {savedAddresses.map((address) => (
            <Card
              key={address.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelectAddress(address)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{address.fullName}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                    <p className="text-sm text-muted-foreground mt-1">Phone: {address.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {!showNewAddressForm ? (
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setShowNewAddressForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Address
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">New Shipping Address</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address Line 1 *</Label>
                    <Input
                      value={newAddress.addressLine1}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Address Line 2</Label>
                    <Input
                      value={newAddress.addressLine2}
                      onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                      placeholder="Apt 4B (optional)"
                    />
                  </div>

                  <div>
                    <Label>City *</Label>
                    <Input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>

                  <div>
                    <Label>State *</Label>
                    <Input
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>

                  <div>
                    <Label>ZIP Code *</Label>
                    <Input
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      placeholder="10001"
                    />
                  </div>

                  <div>
                    <Label>Country *</Label>
                    <Input
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                      placeholder="United States"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Phone Number *</Label>
                    <Input
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={newAddress.isDefault}
                      onCheckedChange={(checked) => setNewAddress({ ...newAddress, isDefault: checked as boolean })}
                    />
                    <Label>Set as default address</Label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveAddress} className="flex-1">
                    Save and Use This Address
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewAddressForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
