import { createClient } from '@/lib/supabase/server'
import { MenuManager } from '@/components/admin/menu-manager'
import { Category, Item } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  const supabase = await createClient()

  const [categoriesResult, itemsResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('items')
      .select('*, category:categories(*)')
      .order('name', { ascending: true }),
  ])

  const categories = (categoriesResult.data as Category[]) || []
  const items = (itemsResult.data as (Item & { category: Category })[]) || []

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">Menu Management</h1>
        <p className="text-muted-foreground">Add, edit, and manage your menu items</p>
      </div>

      <MenuManager categories={categories} items={items} />
    </div>
  )
}
