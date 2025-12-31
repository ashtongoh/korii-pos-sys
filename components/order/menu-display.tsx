'use client'

import { useState, useMemo } from 'react'
import { Category, Item, CustomizationGroup, CustomizationOption } from '@/lib/types'
import MenuItemCard from './menu-item-card'
import CartSheet from './cart-sheet'
import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/cart-context'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

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
  const currentCategory = categories.find(c => c.id === selectedCategory)

  if (categories.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background texture-paper">
        <div className="text-center animate-fade-up">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-3xl">茶</span>
          </div>
          <h2 className="text-2xl font-display mb-3">No menu available</h2>
          <p className="text-muted-foreground">
            Please contact the administrator to set up the menu.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Refined Header */}
      <header className="relative bg-primary text-primary-foreground">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-primary/95" />

        <div className="relative container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-display tracking-tight">
              Kōri Matcha
            </h1>
            <p className="text-sm text-primary-foreground/70 mt-0.5 tracking-wide">
              氷抹茶 · Premium Japanese Tea
            </p>
          </div>

          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="relative bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all duration-300 hover:scale-[1.02]"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                <span className="font-medium">Cart</span>
                {itemCount > 0 && (
                  <span className="ml-2 min-w-[1.5rem] h-6 px-2 rounded-full bg-accent text-accent-foreground text-sm font-semibold inline-flex items-center justify-center animate-scale-in">
                    {itemCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <CartSheet onClose={() => setIsCartOpen(false)} />
          </Sheet>
        </div>
      </header>

      {/* Category Navigation - Elegant horizontal scroll */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {categories.map((category, index) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "relative px-5 py-3 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-300",
                  "hover:bg-primary/5",
                  selectedCategory === category.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {category.name}
                {selectedCategory === category.id && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Category Title & Items Grid */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Category Header */}
          {currentCategory && (
            <div className="mb-8 animate-fade-in">
              <h2 className="text-2xl font-display text-foreground">
                {currentCategory.name}
              </h2>
              <div className="w-12 h-px bg-accent mt-4" />
            </div>
          )}

          {/* Items Grid */}
          {itemsByCategory[selectedCategory]?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {itemsByCategory[selectedCategory].map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MenuItemCard
                    item={item}
                    customizations={getItemCustomizations(item.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xl">茶</span>
              </div>
              <p className="text-muted-foreground">
                No items available in this category
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
