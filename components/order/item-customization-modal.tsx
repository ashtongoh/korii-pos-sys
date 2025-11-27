'use client'

import { useState, useMemo } from 'react'
import { Item, CustomizationGroup, CustomizationOption, CartCustomization } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils/format'
import { useCart } from '@/contexts/cart-context'
import { toast } from 'sonner'
import { Minus, Plus } from 'lucide-react'

interface ItemCustomizationModalProps {
  item: Item
  customizations: (CustomizationGroup & { options: CustomizationOption[] })[]
  isOpen: boolean
  onClose: () => void
}

export default function ItemCustomizationModal({
  item,
  customizations,
  isOpen,
  onClose,
}: ItemCustomizationModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const cart = useCart()

  // Reset state when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQuantity(1)
      setSelectedOptions({})
      onClose()
    }
  }

  // Handle single selection (radio)
  const handleSingleSelection = (groupId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: [optionId],
    }))
  }

  // Handle multiple selection (checkbox)
  const handleMultipleSelection = (groupId: string, optionId: string, checked: boolean) => {
    setSelectedOptions((prev) => {
      const current = prev[groupId] || []
      if (checked) {
        return { ...prev, [groupId]: [...current, optionId] }
      } else {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) }
      }
    })
  }

  // Calculate total price
  const totalPrice = useMemo(() => {
    const basePrice = Number(item.base_price)
    let customizationsTotal = 0

    Object.entries(selectedOptions).forEach(([groupId, optionIds]) => {
      const group = customizations.find((g) => g.id === groupId)
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId)
          if (option) {
            customizationsTotal += Number(option.price_modifier)
          }
        })
      }
    })

    return (basePrice + customizationsTotal) * quantity
  }, [item.base_price, selectedOptions, customizations, quantity])

  // Check if all required customizations are selected
  const canAddToCart = useMemo(() => {
    return customizations
      .filter((g) => g.required)
      .every((g) => selectedOptions[g.id]?.length > 0)
  }, [customizations, selectedOptions])

  // Add to cart
  const handleAddToCart = () => {
    if (!canAddToCart) {
      toast.error('Please select all required options')
      return
    }

    // Build cart customizations
    const cartCustomizations: CartCustomization[] = []
    Object.entries(selectedOptions).forEach(([groupId, optionIds]) => {
      const group = customizations.find((g) => g.id === groupId)
      if (group) {
        optionIds.forEach((optionId) => {
          const option = group.options.find((o) => o.id === optionId)
          if (option) {
            cartCustomizations.push({
              group_id: groupId,
              group_name: group.name,
              option_id: optionId,
              option_name: option.name,
              price_modifier: Number(option.price_modifier),
            })
          }
        })
      }
    })

    cart.addItem(item, cartCustomizations, quantity)
    toast.success('Added to cart!')
    handleOpenChange(false)
  }

  // Quick add (no customizations)
  const handleQuickAdd = () => {
    cart.addItem(item, [], 1)
    toast.success('Added to cart!')
    onClose()
  }

  // If no customizations, show quick add option
  if (customizations.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {item.image_url && (
              <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            {item.description && <p className="text-muted-foreground">{item.description}</p>}
            <p className="text-2xl font-bold">{formatCurrency(Number(item.base_price))}</p>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <Label>Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => handleAddToCart()} size="lg" className="w-full">
              Add {quantity} to Cart - {formatCurrency(Number(item.base_price) * quantity)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item info */}
          {item.image_url && (
            <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
              <img
                src={item.image_url}
                alt={item.name}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          {item.description && <p className="text-muted-foreground">{item.description}</p>}

          {/* Customizations */}
          {customizations.map((group) => (
            <div key={group.id} className="space-y-3">
              <Label className="text-base font-semibold">
                {group.name}
                {group.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {group.type === 'single' ? (
                <RadioGroup
                  value={selectedOptions[group.id]?.[0] || ''}
                  onValueChange={(value) => handleSingleSelection(group.id, value)}
                >
                  {group.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.name}
                        {Number(option.price_modifier) !== 0 && (
                          <span className="ml-2 text-muted-foreground">
                            {Number(option.price_modifier) > 0 ? '+' : ''}
                            {formatCurrency(Number(option.price_modifier))}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.id}
                        checked={selectedOptions[group.id]?.includes(option.id) || false}
                        onCheckedChange={(checked) =>
                          handleMultipleSelection(group.id, option.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.name}
                        {Number(option.price_modifier) !== 0 && (
                          <span className="ml-2 text-muted-foreground">
                            {Number(option.price_modifier) > 0 ? '+' : ''}
                            {formatCurrency(Number(option.price_modifier))}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Label className="text-base">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            size="lg"
            className="flex-1"
          >
            Add {quantity} to Cart - {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
