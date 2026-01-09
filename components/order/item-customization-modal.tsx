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
import { PillSelector, MultiPillSelector } from '@/components/ui/pill-selector'
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

  // Handle single selection (pill selector)
  const handleSingleSelection = (groupId: string, optionId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: [optionId],
    }))
  }

  // Handle multiple selection (multi pill selector)
  const handleMultipleSelection = (groupId: string, optionIds: string[]) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [groupId]: optionIds,
    }))
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

  // If no customizations, show quick add option
  if (customizations.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{item.name}</DialogTitle>
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
            {item.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            )}
            <p className="font-display text-2xl text-primary">
              {formatCurrency(Number(item.base_price))}
            </p>

            {/* Quantity */}
            <div className="flex items-center justify-between py-2">
              <Label className="text-base">Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-11 w-11"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-semibold text-lg tabular-nums">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-11 w-11"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => handleAddToCart()} size="lg" className="w-full h-12">
              Add {quantity} to Cart - {formatCurrency(Number(item.base_price) * quantity)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
        {/* Header - sticky on scroll */}
        <DialogHeader className="sticky top-0 z-10 bg-card px-6 py-4 border-b">
          <DialogTitle className="font-display text-xl">{item.name}</DialogTitle>
          {item.description && (
            <p className="text-muted-foreground text-sm leading-relaxed mt-1">
              {item.description}
            </p>
          )}
        </DialogHeader>

        {/* Scrollable content */}
        <div className="px-6 py-4 space-y-5">
          {/* Customizations - compact layout */}
          {customizations.map((group, groupIndex) => (
            <div
              key={group.id}
              className="animate-fade-up"
              style={{ animationDelay: `${groupIndex * 50}ms` }}
            >
              <Label className="text-sm font-semibold text-foreground mb-3 block">
                {group.name}
                {group.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>

              {group.type === 'single' ? (
                <PillSelector
                  value={selectedOptions[group.id]?.[0] || ''}
                  onValueChange={(value) => handleSingleSelection(group.id, value)}
                  options={group.options.map((option) => ({
                    value: option.id,
                    label: option.name,
                    sublabel:
                      Number(option.price_modifier) !== 0
                        ? `${Number(option.price_modifier) > 0 ? '+' : ''}${formatCurrency(Number(option.price_modifier))}`
                        : undefined,
                  }))}
                />
              ) : (
                <MultiPillSelector
                  values={selectedOptions[group.id] || []}
                  onValuesChange={(values) => handleMultipleSelection(group.id, values)}
                  options={group.options.map((option) => ({
                    value: option.id,
                    label: option.name,
                    sublabel:
                      Number(option.price_modifier) !== 0
                        ? `${Number(option.price_modifier) > 0 ? '+' : ''}${formatCurrency(Number(option.price_modifier))}`
                        : undefined,
                  }))}
                />
              )}
            </div>
          ))}

          {/* Quantity selector */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <Label className="text-sm font-semibold">Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-11 w-11 shadow-zen"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-semibold text-lg tabular-nums">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-11 w-11 shadow-zen"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer - sticky */}
        <DialogFooter className="sticky bottom-0 bg-card px-6 py-4 border-t gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="h-12 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            size="lg"
            className="flex-1 h-12 font-semibold"
          >
            Add {quantity} to Cart - {formatCurrency(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
