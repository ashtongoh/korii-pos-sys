'use client'

import { useState, useMemo } from 'react'
import { Category, Item, CustomizationGroup, CustomizationOption } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MenuItemCard from './menu-item-card'
import CartSheet from './cart-sheet'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/cart-context'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'

interface MenuDisplayProps {
  categories: Category[]
  items: (Item & { category: Category })[]
  customizationGroups: (CustomizationGroup & { options: CustomizationOption[] })[]
  itemCustomizations: { item_id: string; group_id: string }[]
}

export default function MenuDisplay({
  categories,
  items,
  customizationGroups,
  itemCustomizations,
}: MenuDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const cart = useCart()

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, Item[]> = {}
    items.forEach((item) => {
      if (!grouped[item.category_id]) {
        grouped[item.category_id] = []
      }
      grouped[item.category_id].push(item)
    })
    return grouped
  }, [items])

  // Get customizations for an item
  const getItemCustomizations = (itemId: string) => {
    const groupIds = itemCustomizations
      .filter((ic) => ic.item_id === itemId)
      .map((ic) => ic.group_id)

    return customizationGroups.filter((group) => groupIds.includes(group.id))
  }

  const itemCount = cart.getItemCount()

  if (categories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No menu available</h2>
          <p className="text-muted-foreground">
            Please contact the administrator to set up the menu.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">Kōri Matcha</h1>
            <p className="text-sm text-primary-foreground/80">Select your items</p>
          </div>
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button size="lg" variant="accent" className="relative">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Cart
                {itemCount > 0 && (
                  <Badge className="ml-2 absolute -top-2 -right-2 bg-white text-primary">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <CartSheet onClose={() => setIsCartOpen(false)} />
          </Sheet>
        </div>
      </header>

      {/* Category Tabs & Menu Items */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="flex flex-col h-full"
        >
          {/* Category Tabs */}
          <div className="border-b bg-card px-4">
            <TabsList className="w-full justify-start h-auto">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-base py-3 px-6"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Menu Items Grid */}
          <div className="flex-1 overflow-y-auto">
            {categories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="mt-0 h-full"
              >
                <div className="container mx-auto px-4 py-6">
                  {itemsByCategory[category.id]?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {itemsByCategory[category.id].map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          customizations={getItemCustomizations(item.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">
                        No items available in this category
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
