import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import { OrderQueue } from '@/components/merchant/order-queue'
import { MenuAvailability } from '@/components/merchant/menu-availability'
import { OrderWithItems, Item, Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MerchantPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch orders from the last 24 hours that are paid, preparing, or recently completed
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const [ordersResult, itemsResult] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          item:items(*)
        )
      `)
      .in('status', ['paid', 'preparing', 'completed'])
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('items')
      .select('*, category:categories(id, name)')
      .order('name', { ascending: true }),
  ])

  if (ordersResult.error) {
    console.error('Error fetching orders:', ordersResult.error)
  }

  const orders = (ordersResult.data as OrderWithItems[]) || []
  const items = (itemsResult.data as (Item & { category: Pick<Category, 'id' | 'name'> })[]) || []

  return (
    <main className="min-h-screen bg-background">
      <div className="flex">
        <div className="flex-1">
          <OrderQueue initialOrders={orders} user={user} />
        </div>
        <MenuAvailability items={items} />
      </div>
    </main>
  )
}
