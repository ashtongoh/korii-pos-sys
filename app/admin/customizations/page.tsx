import { createClient } from '@/lib/supabase/server'
import { CustomizationManager } from '@/components/admin/customization-manager'
import { CustomizationGroup, CustomizationOption, Item, Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

type GroupWithOptions = CustomizationGroup & { options: CustomizationOption[] }
type ItemWithCategory = Item & { category: Category | null }

export default async function CustomizationsPage() {
  const supabase = await createClient()

  const [groupsResult, itemsResult, linkagesResult] = await Promise.all([
    supabase
      .from('customization_groups')
      .select('*, options:customization_options(*)')
      .order('name'),
    supabase
      .from('items')
      .select('*, category:categories(*)')
      .order('name'),
    supabase
      .from('item_customization_groups')
      .select('*'),
  ])

  const groups = (groupsResult.data as GroupWithOptions[]) || []
  const items = (itemsResult.data as ItemWithCategory[]) || []
  const linkages = (linkagesResult.data as { item_id: string; group_id: string }[]) || []

  return (
    <div className="p-8">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-display mb-1">Customizations</h1>
        <p className="text-muted-foreground">
          Manage drink options and assign them to menu items
        </p>
      </div>

      <CustomizationManager
        groups={groups}
        items={items}
        linkages={linkages}
      />
    </div>
  )
}
