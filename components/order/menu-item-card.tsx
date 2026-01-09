'use client'

import { useState } from 'react'
import { Item, CustomizationGroup, CustomizationOption } from '@/lib/types'
import { formatCurrency } from '@/lib/utils/format'
import { Plus } from 'lucide-react'
import ItemCustomizationModal from './item-customization-modal'
import { cn } from '@/lib/utils'

interface MenuItemCardProps {
  item: Item
  customizations: (CustomizationGroup & { options: CustomizationOption[] })[]
}

export default function MenuItemCard({ item, customizations }: MenuItemCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const isUnavailable = !item.available

  return (
    <>
      <article
        className={cn(
          "group relative bg-card rounded-xl overflow-hidden cursor-pointer",
          "shadow-zen hover:shadow-elevated",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1",
          "h-full flex flex-col",
          isPressed && "scale-[0.98]",
          isUnavailable && "opacity-60 pointer-events-none"
        )}
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        {/* Item Image */}
        <div className="aspect-[4/3] relative bg-muted overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <span className="text-5xl opacity-50">茶</span>
            </div>
          )}

          {/* Hover overlay with add button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-3 right-3">
              <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <Plus className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          {/* Unavailable badge */}
          {isUnavailable && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-display text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300">
            {item.name}
          </h3>

          {item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed flex-1">
              {item.description}
            </p>
          )}

          {/* Price with subtle separator - pushed to bottom */}
          <div className="mt-3 pt-3 border-t border-border/50 mt-auto">
            <p className="font-display text-xl text-primary font-medium">
              {formatCurrency(Number(item.base_price))}
            </p>
          </div>
        </div>

        {/* Subtle accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </article>

      <ItemCustomizationModal
        item={item}
        customizations={customizations}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
