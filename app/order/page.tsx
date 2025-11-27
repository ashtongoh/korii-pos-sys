import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MenuDisplay from '@/components/order/menu-display'
import { Category, Item, CustomizationGroup, CustomizationOption } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getMenuData() {
  const supabase = await createClient()

  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError)
    return { categories: [], items: [], customizationGroups: [], itemCustomizations: [] }
  }

  // Fetch items with category info
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*, category:categories(*)')
    .eq('available', true)

  if (itemsError) {
    console.error('Error fetching items:', itemsError)
    return { categories: categories || [], items: [], customizationGroups: [], itemCustomizations: [] }
  }

  // Fetch customization groups with options
  const { data: customizationGroups, error: customGroupsError } = await supabase
    .from('customization_groups')
    .select(`
      *,
      options:customization_options(*)
    `)

  if (customGroupsError) {
    console.error('Error fetching customization groups:', customGroupsError)
    return { categories: categories || [], items: items || [], customizationGroups: [], itemCustomizations: [] }
  }

  // Fetch item-customization relationships
  const { data: itemCustomizations, error: itemCustomError } = await supabase
    .from('item_customization_groups')
    .select('*')

  if (itemCustomError) {
    console.error('Error fetching item customizations:', itemCustomError)
  }

  return {
    categories: categories as Category[],
    items: items as (Item & { category: Category })[],
    customizationGroups: customizationGroups as (CustomizationGroup & {
      options: CustomizationOption[]
    })[],
    itemCustomizations: (itemCustomizations || []) as { item_id: string; group_id: string }[],
  }
}

export default async function OrderPage() {
  const menuData = await getMenuData()

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="p-8 text-center">Loading menu...</div>}>
        <MenuDisplay
          categories={menuData.categories}
          items={menuData.items}
          customizationGroups={menuData.customizationGroups}
          itemCustomizations={menuData.itemCustomizations}
        />
      </Suspense>
    </div>
  )
}
