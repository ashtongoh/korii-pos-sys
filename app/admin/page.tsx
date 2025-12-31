import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/format'
import { DollarSign, ShoppingBag, Clock, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Fetch today's orders
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .in('status', ['paid', 'preparing', 'completed'])

  // Calculate stats
  const totalOrders = todayOrders?.length || 0
  const totalRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
  const pendingOrders = todayOrders?.filter(o => o.status === 'paid').length || 0
  const completedOrders = todayOrders?.filter(o => o.status === 'completed').length || 0

  // Fetch all-time stats
  const { count: allTimeOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['paid', 'preparing', 'completed'])

  const stats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(totalRevenue),
      description: `${totalOrders} orders today`,
      icon: DollarSign,
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      description: `${allTimeOrders || 0} all time`,
      icon: ShoppingBag,
    },
    {
      title: 'Pending',
      value: pendingOrders.toString(),
      description: 'Orders awaiting preparation',
      icon: Clock,
    },
    {
      title: 'Completed',
      value: completedOrders.toString(),
      description: 'Orders completed today',
      icon: CheckCircle,
    },
  ]

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)]">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store's performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/menu"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Manage Menu</div>
              <div className="text-sm text-muted-foreground">Add, edit, or remove menu items</div>
            </a>
            <a
              href="/merchant"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">View Order Queue</div>
              <div className="text-sm text-muted-foreground">See live orders in the barista view</div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders from today</CardDescription>
          </CardHeader>
          <CardContent>
            {todayOrders && todayOrders.length > 0 ? (
              <div className="space-y-2">
                {todayOrders.slice(-5).reverse().map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{order.customer_initials}</span>
                    <span className="text-muted-foreground">{formatCurrency(Number(order.total_amount))}</span>
                    <span className={`capitalize ${
                      order.status === 'completed' ? 'text-primary' :
                      order.status === 'preparing' ? 'text-accent' :
                      'text-muted-foreground'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet today</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
