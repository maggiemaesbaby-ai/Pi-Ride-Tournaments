"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Home, Briefcase, MapPin, Plus, Trash2, Edit } from 'lucide-react'
import { getSavedLocations, saveLocation, deleteLocation, SavedLocation } from "@/lib/saved-locations"

interface SavedLocationsDialogProps {
  userId: string
  onSelectLocation: (address: string) => void
  trigger?: React.ReactNode
}

export function SavedLocationsDialog({ userId, onSelectLocation, trigger }: SavedLocationsDialogProps) {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newLocation, setNewLocation] = useState({ label: "", address: "", icon: "📍" })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (userId) {
      setLocations(getSavedLocations(userId))
    }
  }, [userId, open])

  const handleSave = () => {
    if (!newLocation.label || !newLocation.address) return

    const location: SavedLocation = {
      id: editingId || `loc-${Date.now()}`,
      ...newLocation
    }

    saveLocation(userId, location)
    setLocations(getSavedLocations(userId))
    setIsAdding(false)
    setEditingId(null)
    setNewLocation({ label: "", address: "", icon: "📍" })
  }

  const handleDelete = (id: string) => {
    deleteLocation(userId, id)
    setLocations(getSavedLocations(userId))
  }

  const handleEdit = (location: SavedLocation) => {
    setEditingId(location.id)
    setNewLocation({ label: location.label, address: location.address, icon: location.icon })
    setIsAdding(true)
  }

  const quickIcons = ["🏠", "💼", "🏫", "🏥", "🏪", "🍽️", "📍", "⭐"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <MapPin className="w-4 h-4 mr-2" />
            Saved Locations
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved Locations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saved locations list */}
          {locations.map((location) => (
            <Card key={location.id} className="p-4">
              <div className="flex items-start justify-between">
                <div 
                  className="flex items-start gap-3 flex-1 cursor-pointer"
                  onClick={() => {
                    onSelectLocation(location.address)
                    setOpen(false)
                  }}
                >
                  <span className="text-2xl">{location.icon}</span>
                  <div>
                    <h4 className="font-semibold">{location.label}</h4>
                    <p className="text-sm text-slate-600">{location.address}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(location)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(location.id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Add/Edit form */}
          {isAdding ? (
            <Card className="p-4 border-2 border-primary">
              <h4 className="font-semibold mb-3">{editingId ? "Edit" : "Add"} Location</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {quickIcons.map((icon) => (
                      <button
                        key={icon}
                        onClick={() => setNewLocation({ ...newLocation, icon })}
                        className={`text-2xl p-2 rounded border-2 ${
                          newLocation.icon === icon ? "border-primary bg-primary/10" : "border-slate-300"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Label</label>
                  <input
                    type="text"
                    placeholder="e.g., Home, Work, Gym"
                    value={newLocation.label}
                    onChange={(e) => setNewLocation({ ...newLocation, label: e.target.value })}
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Address</label>
                  <input
                    type="text"
                    placeholder="Enter full address"
                    value={newLocation.address}
                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                    className="w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} className="flex-1">
                    {editingId ? "Update" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false)
                      setEditingId(null)
                      setNewLocation({ label: "", address: "", icon: "📍" })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Location
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
