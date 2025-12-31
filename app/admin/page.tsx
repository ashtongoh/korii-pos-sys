import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils/format'
import { DollarSign, ShoppingBag, Clock, CheckCircle, ArrowRight, UtensilsCrossed, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
      accent: true,
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
      description: 'Awaiting preparation',
      icon: Clock,
      highlight: pendingOrders > 0,
    },
    {
      title: 'Completed',
      value: completedOrders.toString(),
      description: 'Orders completed today',
      icon: CheckCircle,
    },
  ]

  const quickActions = [
    {
      title: 'Manage Menu',
      description: 'Add, edit, or remove menu items',
      href: '/admin/menu',
      icon: UtensilsCrossed,
    },
    {
      title: 'View Order Queue',
      description: 'See live orders in barista view',
      href: '/merchant',
      icon: ClipboardList,
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display mb-1">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your store's performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className={cn(
              "bg-card rounded-xl p-5 shadow-zen animate-fade-up",
              stat.accent && "bg-primary text-primary-foreground",
              stat.highlight && "border-2 border-accent"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={cn(
                "text-sm font-medium",
                stat.accent ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {stat.title}
              </span>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                stat.accent ? "bg-white/10" : "bg-muted"
              )}>
                <stat.icon className={cn(
                  "h-4 w-4",
                  stat.accent ? "text-primary-foreground" : "text-muted-foreground"
                )} />
              </div>
            </div>
            <div className={cn(
              "text-3xl font-display font-medium mb-1",
              stat.accent ? "text-primary-foreground" : "text-foreground"
            )}>
              {stat.value}
            </div>
            <p className={cn(
              "text-sm",
              stat.accent ? "text-primary-foreground/60" : "text-muted-foreground"
            )}>
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="animate-fade-up delay-200">
          <h2 className="text-lg font-display mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  "flex items-center gap-4 p-4 bg-card rounded-xl shadow-zen",
                  "transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5",
                  "group"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="animate-fade-up delay-300">
          <h2 className="text-lg font-display mb-4">Recent Activity</h2>
          <div className="bg-card rounded-xl shadow-zen overflow-hidden">
            {todayOrders && todayOrders.length > 0 ? (
              <div className="divide-y divide-border/50">
                {todayOrders.slice(-5).reverse().map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-display font-medium">
                        {order.customer_initials}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        order.status === 'completed' && "bg-primary/10 text-primary",
                        order.status === 'preparing' && "bg-accent/10 text-accent-foreground",
                        order.status === 'paid' && "bg-muted text-muted-foreground"
                      )}>
                        {order.status}
                      </span>
                    </div>
                    <span className="font-display text-lg">
                      {formatCurrency(Number(order.total_amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No orders yet today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
