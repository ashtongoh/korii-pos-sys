'use client'

import { useState } from 'react'
import { Item, Category } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateItemAvailability } from '@/lib/actions/menu'
import { toast } from 'sonner'
import { Search, Coffee } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MenuAvailabilityProps {
  items: (Item & { category: Pick<Category, 'id' | 'name'> })[]
}

export function MenuAvailability({ items }: MenuAvailabilityProps) {
  const [localItems, setLocalItems] = useState(items)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = localItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Uncategorized'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(item)
    return acc
  }, {} as Record<string, typeof filteredItems>)

  const handleToggle = async (itemId: string, currentAvailable: boolean) => {
    // Optimistic update
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, available: !currentAvailable } : item
      )
    )

    const result = await updateItemAvailability(itemId, !currentAvailable)

    if (result.error) {
      // Revert on error
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, available: currentAvailable } : item
        )
      )
      toast.error(result.error)
    } else {
      toast.success(
        currentAvailable ? 'Item marked as unavailable' : 'Item is now available'
      )
    }
  }

  const unavailableCount = localItems.filter((item) => !item.available).length

  return (
    <aside className="w-80 border-l bg-card hidden xl:block">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-3 mb-1">
            <Coffee className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg">Menu Availability</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {unavailableCount > 0
              ? `${unavailableCount} item${unavailableCount > 1 ? 's' : ''} unavailable`
              : 'All items available'}
          </p>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* Items List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
              <div key={categoryName}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {categoryName}
                </h3>
                <div className="space-y-1">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-all duration-200",
                        item.available
                          ? "hover:bg-muted"
                          : "bg-destructive/5 border border-destructive/10"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm",
                          !item.available && "text-muted-foreground line-through"
                        )}
                      >
                        {item.name}
                      </span>
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => handleToggle(item.id, item.available)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No items found
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  )
}
