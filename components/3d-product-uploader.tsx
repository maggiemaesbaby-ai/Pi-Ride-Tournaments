'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Upload, Camera, Eye, Trash2, Plus } from '@/lib/icons'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Photo3DUpload {
  front?: string
  side?: string
  top?: string
  angle45?: string
}

interface ColorVariant {
  name: string
  hex: string
  photos3D?: Photo3DUpload
}

interface ThreeDProductUploaderProps {
  onPhotosChange: (photos: Photo3DUpload) => void
  onColorVariantsChange: (variants: ColorVariant[]) => void
  initialPhotos?: Photo3DUpload
  initialColorVariants?: ColorVariant[]
}

const BASIC_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Navy', hex: '#1E3A8A' },
]

export function ThreeDProductUploader({ 
  onPhotosChange, 
  onColorVariantsChange,
  initialPhotos, 
  initialColorVariants 
}: ThreeDProductUploaderProps) {
  const { toast } = useToast()
  const [photos, setPhotos] = useState<Photo3DUpload>(initialPhotos || {})
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>(initialColorVariants || [])
  const [currentColorMode, setCurrentColorMode] = useState<'default' | 'basic' | 'custom'>('default')
  const [customColorName, setCustomColorName] = useState('')
  const [customColorHex, setCustomColorHex] = useState('#000000')
  const [preview3D, setPreview3D] = useState(false)

  const handlePhotoUpload = async (view: keyof Photo3DUpload, file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    // Convert to base64 for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const newPhotos = { ...photos, [view]: e.target?.result as string }
      setPhotos(newPhotos)
      onPhotosChange(newPhotos)
      
      toast({
        title: 'Photo Uploaded',
        description: `${view.charAt(0).toUpperCase() + view.slice(1)} view added successfully`
      })
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (view: keyof Photo3DUpload) => {
    const newPhotos = { ...photos }
    delete newPhotos[view]
    setPhotos(newPhotos)
    onPhotosChange(newPhotos)
  }

  const addBasicColorVariant = (colorName: string) => {
    const color = BASIC_COLORS.find(c => c.name === colorName)
    if (!color) return

    const newVariants = [...colorVariants, { name: color.name, hex: color.hex }]
    setColorVariants(newVariants)
    onColorVariantsChange(newVariants)
    
    toast({
      title: 'Color Added',
      description: `${color.name} variant added. Shoppers can now see the product in this color.`
    })
  }

  const addCustomColor = () => {
    if (!customColorName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a color name',
        variant: 'destructive'
      })
      return
    }

    const newVariants = [...colorVariants, { name: customColorName, hex: customColorHex }]
    setColorVariants(newVariants)
    onColorVariantsChange(newVariants)
    setCustomColorName('')
    setCustomColorHex('#000000')
    
    toast({
      title: 'Custom Color Added',
      description: `${customColorName} variant added successfully.`
    })
  }

  const removeColorVariant = (index: number) => {
    const newVariants = colorVariants.filter((_, i) => i !== index)
    setColorVariants(newVariants)
    onColorVariantsChange(newVariants)
  }

  const photoViews: Array<{ key: keyof Photo3DUpload; label: string; description: string }> = [
    { key: 'front', label: 'Front View', description: 'Main product photo from the front' },
    { key: 'side', label: 'Side View', description: 'Product from the side (90° angle)' },
    { key: 'top', label: 'Top View', description: 'Product from above' },
    { key: 'angle45', label: '45° Angle', description: 'Product at 45° angle (optional)' }
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                3D Product Photos
              </CardTitle>
              <CardDescription>
                Upload photos for 3D visualization (even 1 photo works!)
              </CardDescription>
            </div>
            {Object.keys(photos).length >= 1 && (
              <Button variant="outline" size="sm" onClick={() => setPreview3D(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview 3D
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {photoViews.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <p className="text-xs text-muted-foreground">{description}</p>
                
                {photos[key] ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                    <img src={photos[key] || "/placeholder.svg"} alt={label} className="w-full h-full object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removePhoto(key)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="block">
                    <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/20">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handlePhotoUpload(key, file)
                      }}
                    />
                  </label>
                )}
              </div>
            ))}
          </div>

          {Object.keys(photos).length === 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
              <strong>Start with 1 photo!</strong> Upload any angle to enable 3D visualization. Add more views for better 360° experience.
            </div>
          )}

          {Object.keys(photos).length === 1 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm">
              <strong>Good start!</strong> Add more angles (side, top) for a complete 3D experience.
            </div>
          )}

          {Object.keys(photos).length >= 2 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm">
              <strong>Excellent!</strong> Your product will be displayed in interactive 3D with multiple viewing angles.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Variants (Optional)</CardTitle>
          <CardDescription>
            Add color options for your product. Shoppers can switch between colors in 3D view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={currentColorMode === 'basic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentColorMode('basic')}
            >
              Choose from Basic Colors
            </Button>
            <Button
              variant={currentColorMode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentColorMode('custom')}
            >
              Add Custom Color
            </Button>
          </div>

          {currentColorMode === 'basic' && (
            <div className="space-y-3">
              <Label>Select Basic Colors</Label>
              <div className="grid grid-cols-3 gap-2">
                {BASIC_COLORS.map((color) => (
                  <Button
                    key={color.name}
                    variant="outline"
                    size="sm"
                    onClick={() => addBasicColorVariant(color.name)}
                    disabled={colorVariants.some(v => v.name === color.name)}
                    className="justify-start gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded border" 
                      style={{ backgroundColor: color.hex }}
                    />
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentColorMode === 'custom' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Color Name</Label>
                  <Input
                    placeholder="e.g., Midnight Blue"
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Color Code</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      className="w-16"
                    />
                    <Input
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={addCustomColor} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Color
              </Button>
            </div>
          )}

          {/* Display Added Colors */}
          {colorVariants.length > 0 && (
            <div className="space-y-2">
              <Label>Added Color Variants ({colorVariants.length})</Label>
              <div className="flex flex-wrap gap-2">
                {colorVariants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: variant.hex }}
                    />
                    <span className="text-sm">{variant.name}</span>
                    <button
                      onClick={() => removeColorVariant(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {colorVariants.length === 0 && (
            <div className="bg-muted/50 border border-dashed rounded-lg p-3 text-sm text-muted-foreground text-center">
              No color variants added. Shoppers will see the default product color only.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
