'use client'

import { useState } from 'react'
import { Category, Item } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils/format'
import {
  createItem,
  updateItem,
  deleteItem,
  updateItemAvailability,
  createCategory,
  deleteCategory,
} from '@/lib/actions/menu'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface MenuManagerProps {
  categories: Category[]
  items: (Item & { category: Category })[]
}

export function MenuManager({ categories, items }: MenuManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0]?.id || null
  )
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    image_url: '',
  })

  // Category form state
  const [categoryName, setCategoryName] = useState('')

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category_id === selectedCategory)
    : items

  const handleToggleAvailability = async (itemId: string, currentAvailable: boolean) => {
    const result = await updateItemAvailability(itemId, !currentAvailable)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(currentAvailable ? 'Item marked as unavailable' : 'Item marked as available')
    }
  }

  const handleOpenItemDialog = (item?: Item) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        name: item.name,
        description: item.description || '',
        base_price: String(item.base_price),
        category_id: item.category_id,
        image_url: item.image_url || '',
      })
    } else {
      setEditingItem(null)
      setItemForm({
        name: '',
        description: '',
        base_price: '',
        category_id: selectedCategory || categories[0]?.id || '',
        image_url: '',
      })
    }
    setIsItemDialogOpen(true)
  }

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.base_price || !itemForm.category_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      if (editingItem) {
        const result = await updateItem(editingItem.id, {
          name: itemForm.name,
          description: itemForm.description || null,
          base_price: parseFloat(itemForm.base_price),
          category_id: itemForm.category_id,
          image_url: itemForm.image_url || null,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Item updated successfully')
          setIsItemDialogOpen(false)
        }
      } else {
        const result = await createItem({
          name: itemForm.name,
          description: itemForm.description || undefined,
          base_price: parseFloat(itemForm.base_price),
          category_id: itemForm.category_id,
          image_url: itemForm.image_url || undefined,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Item created successfully')
          setIsItemDialogOpen(false)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    const result = await deleteItem(itemId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Item deleted successfully')
    }
  }

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Please enter a category name')
      return
    }

    setIsLoading(true)
    const result = await createCategory({ name: categoryName })
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Category created successfully')
      setCategoryName('')
      setIsCategoryDialogOpen(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? Items must be moved first.')) return

    const result = await deleteCategory(categoryId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Category deleted successfully')
      if (selectedCategory === categoryId) {
        setSelectedCategory(categories.find(c => c.id !== categoryId)?.id || null)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Categories Sidebar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Categories</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setIsCategoryDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            All Items ({items.length})
          </button>
          {categories.map((category) => {
            const count = items.filter((i) => i.category_id === category.id).length
            return (
              <div key={category.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  {category.name} ({count})
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-50 hover:opacity-100"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {selectedCategory
                ? categories.find((c) => c.id === selectedCategory)?.name
                : 'All Items'}
            </CardTitle>
            <Button onClick={() => handleOpenItemDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items in this category</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => handleOpenItemDialog()}
              >
                Add your first item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <span className="text-xl">🍵</span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(Number(item.base_price))}
                        {!selectedCategory && (
                          <span className="ml-2">• {item.category?.name}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`available-${item.id}`} className="text-sm">
                        Available
                      </Label>
                      <Switch
                        id={`available-${item.id}`}
                        checked={item.available}
                        onCheckedChange={() =>
                          handleToggleAvailability(item.id, item.available)
                        }
                      />
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleOpenItemDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the item details below' : 'Fill in the details for the new item'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name *</Label>
              <Input
                id="item-name"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g., Matcha Latte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Input
                id="item-description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.base_price}
                  onChange={(e) => setItemForm({ ...itemForm, base_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category *</Label>
                <Select
                  value={itemForm.category_id}
                  onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-image">Image URL</Label>
              <Input
                id="item-image"
                value={itemForm.image_url}
                onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your menu items
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g., Drinks, Food, Add-ons"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
