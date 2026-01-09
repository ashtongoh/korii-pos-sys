'use client'

import { useState } from 'react'
import { CustomizationGroup, CustomizationOption, Item, Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  createCustomizationGroup,
  updateCustomizationGroup,
  deleteCustomizationGroup,
  createCustomizationOption,
  updateCustomizationOption,
  deleteCustomizationOption,
  linkCustomizationToItem,
  unlinkCustomizationFromItem,
  bulkLinkCustomizationToItems,
} from '@/lib/actions/customizations'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings2,
  Link2,
  ChevronRight,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type GroupWithOptions = CustomizationGroup & { options: CustomizationOption[] }
type ItemWithCategory = Item & { category: Category | null }

interface CustomizationManagerProps {
  groups: GroupWithOptions[]
  items: ItemWithCategory[]
  linkages: { item_id: string; group_id: string }[]
}

export function CustomizationManager({
  groups,
  items,
  linkages,
}: CustomizationManagerProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState('groups')

  // Groups & Options tab state
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    groups[0]?.id || null
  )
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<GroupWithOptions | null>(null)
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Item Assignments tab state
  const [selectedItem, setSelectedItem] = useState<string | null>(
    items[0]?.id || null
  )
  const [linkingGroupId, setLinkingGroupId] = useState<string | null>(null)

  // Group form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    type: 'single' as 'single' | 'multiple',
    required: true,
  })

  // Option form state
  const [optionForm, setOptionForm] = useState({
    name: '',
    price_modifier: '',
  })

  // Get current group
  const currentGroup = groups.find((g) => g.id === selectedGroup)

  // Get linkages for selected item
  const itemLinkages = linkages.filter((l) => l.item_id === selectedItem)
  const linkedGroupIds = new Set(itemLinkages.map((l) => l.group_id))

  // ============== GROUP HANDLERS ==============

  const handleOpenGroupDialog = (group?: GroupWithOptions) => {
    if (group) {
      setEditingGroup(group)
      setGroupForm({
        name: group.name,
        type: group.type as 'single' | 'multiple',
        required: group.required,
      })
    } else {
      setEditingGroup(null)
      setGroupForm({
        name: '',
        type: 'single',
        required: true,
      })
    }
    setIsGroupDialogOpen(true)
  }

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) {
      toast.error('Please enter a group name')
      return
    }

    setIsLoading(true)

    try {
      if (editingGroup) {
        const result = await updateCustomizationGroup(editingGroup.id, {
          name: groupForm.name,
          type: groupForm.type,
          required: groupForm.required,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Group updated successfully')
          setIsGroupDialogOpen(false)
        }
      } else {
        const result = await createCustomizationGroup({
          name: groupForm.name,
          type: groupForm.type,
          required: groupForm.required,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Group created successfully')
          setIsGroupDialogOpen(false)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This will also delete all its options.')) return

    const result = await deleteCustomizationGroup(groupId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Group deleted successfully')
      if (selectedGroup === groupId) {
        setSelectedGroup(groups.find((g) => g.id !== groupId)?.id || null)
      }
    }
  }

  // ============== OPTION HANDLERS ==============

  const handleOpenOptionDialog = (option?: CustomizationOption) => {
    if (option) {
      setEditingOption(option)
      setOptionForm({
        name: option.name,
        price_modifier: String(option.price_modifier),
      })
    } else {
      setEditingOption(null)
      setOptionForm({
        name: '',
        price_modifier: '0',
      })
    }
    setIsOptionDialogOpen(true)
  }

  const handleSaveOption = async () => {
    if (!optionForm.name.trim()) {
      toast.error('Please enter an option name')
      return
    }

    if (!selectedGroup) {
      toast.error('Please select a group first')
      return
    }

    setIsLoading(true)

    try {
      if (editingOption) {
        const result = await updateCustomizationOption(editingOption.id, {
          name: optionForm.name,
          price_modifier: parseFloat(optionForm.price_modifier) || 0,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Option updated successfully')
          setIsOptionDialogOpen(false)
        }
      } else {
        const result = await createCustomizationOption({
          group_id: selectedGroup,
          name: optionForm.name,
          price_modifier: parseFloat(optionForm.price_modifier) || 0,
        })
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Option created successfully')
          setIsOptionDialogOpen(false)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return

    const result = await deleteCustomizationOption(optionId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Option deleted successfully')
    }
  }

  // ============== LINKAGE HANDLERS ==============

  const handleToggleLinkage = async (groupId: string, isLinked: boolean) => {
    if (!selectedItem) return

    setLinkingGroupId(groupId)

    try {
      if (isLinked) {
        const result = await unlinkCustomizationFromItem(selectedItem, groupId)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Customization unlinked')
        }
      } else {
        const result = await linkCustomizationToItem(selectedItem, groupId)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Customization linked')
        }
      }
    } finally {
      setLinkingGroupId(null)
    }
  }

  const handleApplyToAll = async (groupId: string) => {
    if (!confirm('This will link this customization to ALL menu items. Continue?')) return

    setLinkingGroupId(groupId)

    try {
      const allItemIds = items.map((item) => item.id)
      const result = await bulkLinkCustomizationToItems(groupId, allItemIds)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Applied to all items')
      }
    } finally {
      setLinkingGroupId(null)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="bg-card shadow-zen p-1 h-auto">
        <TabsTrigger
          value="groups"
          className="gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-zen"
        >
          <Settings2 className="h-4 w-4" />
          Groups & Options
        </TabsTrigger>
        <TabsTrigger
          value="assignments"
          className="gap-2 px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-zen"
        >
          <Link2 className="h-4 w-4" />
          Item Assignments
        </TabsTrigger>
      </TabsList>

      {/* ============== GROUPS & OPTIONS TAB ============== */}
      <TabsContent value="groups" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Groups Sidebar */}
          <div className="bg-card rounded-xl shadow-zen overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-display text-lg">Groups</h2>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => handleOpenGroupDialog()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-2 space-y-1">
              {groups.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No customization groups yet
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenGroupDialog()}
                  >
                    Create your first group
                  </Button>
                </div>
              ) : (
                groups.map((group, index) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-1 animate-fade-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <button
                      onClick={() => setSelectedGroup(group.id)}
                      className={cn(
                        'flex-1 text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        selectedGroup === group.id
                          ? 'bg-primary text-primary-foreground shadow-zen'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{group.name}</span>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 transition-transform',
                            selectedGroup === group.id && 'rotate-90'
                          )}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                        <span>{group.options.length} options</span>
                        <span>•</span>
                        <span>{group.type === 'single' ? 'Single' : 'Multiple'}</span>
                        {group.required && (
                          <>
                            <span>•</span>
                            <span>Required</span>
                          </>
                        )}
                      </div>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-50 hover:opacity-100"
                      onClick={() => handleOpenGroupDialog(group)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-50 hover:opacity-100 hover:text-destructive"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Options Panel */}
          <div className="bg-card rounded-xl shadow-zen overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-display text-lg">
                {currentGroup ? `${currentGroup.name} Options` : 'Select a Group'}
              </h2>
              {currentGroup && (
                <Button onClick={() => handleOpenOptionDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>

            <div className="p-4">
              {!currentGroup ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Settings2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Select a group to manage its options
                  </p>
                </div>
              ) : currentGroup.options.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-3">No options in this group</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenOptionDialog()}
                  >
                    Add your first option
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentGroup.options.map((option, index) => (
                    <div
                      key={option.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-xl border border-border/50',
                        'hover:border-border transition-colors duration-200 animate-fade-up'
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div>
                        <h3 className="font-display font-medium">{option.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {Number(option.price_modifier) === 0
                            ? 'Base price'
                            : `${Number(option.price_modifier) > 0 ? '+' : ''}${formatCurrency(Number(option.price_modifier))}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleOpenOptionDialog(option)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ============== ITEM ASSIGNMENTS TAB ============== */}
      <TabsContent value="assignments" className="mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Items Sidebar */}
          <div className="bg-card rounded-xl shadow-zen overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-display text-lg">Menu Items</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Select an item to manage its customizations
              </p>
            </div>
            <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-sm text-muted-foreground">
                    No menu items yet
                  </p>
                </div>
              ) : (
                items.map((item, index) => {
                  const itemLinks = linkages.filter((l) => l.item_id === item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 animate-fade-up',
                        selectedItem === item.id
                          ? 'bg-primary text-primary-foreground shadow-zen'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-70 mt-0.5">
                        {item.category?.name || 'No category'}
                        <span className="mx-1">•</span>
                        {itemLinks.length} customization{itemLinks.length !== 1 ? 's' : ''}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Assignments Panel */}
          <div className="bg-card rounded-xl shadow-zen overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-display text-lg">
                {selectedItem
                  ? `Customizations for ${items.find((i) => i.id === selectedItem)?.name}`
                  : 'Select an Item'}
              </h2>
              {selectedItem && (
                <p className="text-xs text-muted-foreground mt-1">
                  Toggle switches to link or unlink customization groups
                </p>
              )}
            </div>

            <div className="p-4">
              {!selectedItem ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Link2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Select a menu item to manage its customizations
                  </p>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Settings2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-3">
                    No customization groups available
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveTab('groups')
                      handleOpenGroupDialog()
                    }}
                  >
                    Create a group first
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group, index) => {
                    const isLinked = linkedGroupIds.has(group.id)
                    const isLinking = linkingGroupId === group.id

                    return (
                      <div
                        key={group.id}
                        className={cn(
                          'flex items-center justify-between p-4 rounded-xl border transition-all duration-200 animate-fade-up',
                          isLinked
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border/50 hover:border-border'
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                              isLinked ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}
                          >
                            {isLinked ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Settings2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-display font-medium">{group.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {group.options.length} options
                              <span className="mx-1">•</span>
                              {group.type === 'single' ? 'Single select' : 'Multi select'}
                              {group.required && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="text-destructive">Required</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleApplyToAll(group.id)}
                            disabled={isLinking}
                          >
                            Apply to all
                          </Button>

                          <div className="flex items-center gap-2 pl-4 border-l border-border/50">
                            {isLinking ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Label
                                  htmlFor={`link-${group.id}`}
                                  className={cn(
                                    'text-xs',
                                    isLinked ? 'text-primary' : 'text-muted-foreground'
                                  )}
                                >
                                  {isLinked ? 'Linked' : 'Not linked'}
                                </Label>
                                <Switch
                                  id={`link-${group.id}`}
                                  checked={isLinked}
                                  onCheckedChange={() => handleToggleLinkage(group.id, isLinked)}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      {/* ============== GROUP DIALOG ============== */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingGroup ? 'Edit Group' : 'Add New Group'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Update the customization group details'
                : 'Create a new customization group (e.g., Size, Ice Level, Sugar Level)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="e.g., Size, Ice Level, Sugar Level"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-type">Selection Type</Label>
              <Select
                value={groupForm.type}
                onValueChange={(value: 'single' | 'multiple') =>
                  setGroupForm({ ...groupForm, type: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single selection (radio)</SelectItem>
                  <SelectItem value="multiple">Multiple selection (checkbox)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Single: customer picks one option. Multiple: customer can pick several.
              </p>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="group-required">Required</Label>
                <p className="text-xs text-muted-foreground">
                  Customer must select an option before adding to cart
                </p>
              </div>
              <Switch
                id="group-required"
                checked={groupForm.required}
                onCheckedChange={(checked) =>
                  setGroupForm({ ...groupForm, required: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGroup ? 'Save Changes' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============== OPTION DIALOG ============== */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingOption ? 'Edit Option' : 'Add New Option'}
            </DialogTitle>
            <DialogDescription>
              {editingOption
                ? 'Update the option details'
                : `Add a new option to "${currentGroup?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="option-name">Option Name *</Label>
              <Input
                id="option-name"
                value={optionForm.name}
                onChange={(e) => setOptionForm({ ...optionForm, name: e.target.value })}
                placeholder="e.g., Regular, Large, Less Ice"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="option-price">Price Modifier</Label>
              <Input
                id="option-price"
                type="number"
                step="0.01"
                value={optionForm.price_modifier}
                onChange={(e) =>
                  setOptionForm({ ...optionForm, price_modifier: e.target.value })
                }
                placeholder="0.00"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Enter 0 for base price, positive for upcharge (e.g., 0.50), negative for
                discount (e.g., -0.50)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveOption} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingOption ? 'Save Changes' : 'Add Option'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
