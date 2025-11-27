'use client'

import { useState } from 'react'
import { Item, CustomizationGroup, CustomizationOption } from '@/lib/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { Plus } from 'lucide-react'
import ItemCustomizationModal from './item-customization-modal'

interface MenuItemCardProps {
  item: Item
  customizations: (CustomizationGroup & { options: CustomizationOption[] })[]
}

export default function MenuItemCard({ item, customizations }: MenuItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={handleClick}
      >
        {/* Item Image */}
        {item.image_url ? (
          <div className="aspect-square relative bg-muted">
            <img
              src={item.image_url}
              alt={item.name}
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="aspect-square bg-muted flex items-center justify-center">
            <span className="text-4xl">🍵</span>
          </div>
        )}

        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {item.description}
            </p>
          )}
          <p className="text-lg font-bold">{formatCurrency(Number(item.base_price))}</p>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button className="w-full" size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>

      <ItemCustomizationModal
        item={item}
        customizations={customizations}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
