import { createClient } from '@/lib/supabase/server'
import { OrderQueue } from '@/components/merchant/order-queue'
import { OrderWithItems } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MerchantPage() {
  const supabase = await createClient()

  // Fetch orders from the last 24 hours that are paid, preparing, or recently completed
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const { data: orders, error } = await supabase
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
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching orders:', error)
  }

  return (
    <main className="min-h-screen bg-background">
      <OrderQueue initialOrders={(orders as OrderWithItems[]) || []} />
    </main>
  )
}
