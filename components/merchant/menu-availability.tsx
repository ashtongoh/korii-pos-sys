'use client'

import { useState } from 'react'
import { Item, Category } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { updateItemAvailability } from '@/lib/actions/menu'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

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
    <aside className="w-80 border-l bg-card">
      <Card className="border-0 rounded-none h-full">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Menu Availability</CardTitle>
          <p className="text-sm text-muted-foreground">
            {unavailableCount > 0
              ? `${unavailableCount} item${unavailableCount > 1 ? 's' : ''} unavailable`
              : 'All items available'}
          </p>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-6">
              {Object.entries(groupedItems).map(([categoryName, categoryItems]) => (
                <div key={categoryName}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                    {categoryName}
                  </h3>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          !item.available ? 'bg-destructive/10' : 'hover:bg-muted'
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            !item.available ? 'text-muted-foreground line-through' : ''
                          }`}
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
                <p className="text-center text-sm text-muted-foreground py-8">
                  No items found
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </aside>
  )
}
