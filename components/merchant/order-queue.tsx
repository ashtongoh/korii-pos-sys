'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderWithItems, AdminUser } from '@/lib/types'
import { OrderCard } from './order-card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, LogOut, Clock, ChefHat, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { signOut } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

interface OrderQueueProps {
  initialOrders: OrderWithItems[]
  user?: AdminUser
}

type TabValue = 'all' | 'paid' | 'preparing' | 'completed'

export function OrderQueue({ initialOrders, user }: OrderQueueProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supabase = createClient()

  // Fetch full order with items
  const fetchOrderWithItems = useCallback(async (orderId: string): Promise<OrderWithItems | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          item:items(*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return null
    }

    return data as OrderWithItems
  }, [supabase])

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const { data, error } = await supabase
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
      console.error('Error refreshing orders:', error)
      toast.error('Failed to refresh orders')
    } else {
      setOrders((data as OrderWithItems[]) || [])
    }
    setIsRefreshing(false)
  }, [supabase])

  // Subscribe to Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        async (payload) => {
          console.log('Order change:', payload)

          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as { id: string; status: string }
            if (['paid', 'preparing', 'completed'].includes(newOrder.status)) {
              const fullOrder = await fetchOrderWithItems(newOrder.id)
              if (fullOrder) {
                setOrders((prev) => [...prev, fullOrder])
                toast.success('New order received!')
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as { id: string; status: string }

            if (['cancelled', 'pending'].includes(updatedOrder.status)) {
              setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id))
              return
            }

            const fullOrder = await fetchOrderWithItems(updatedOrder.id)
            if (fullOrder) {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === fullOrder.id)
                if (exists) {
                  return prev.map((o) => (o.id === fullOrder.id ? fullOrder : o))
                } else {
                  return [...prev, fullOrder]
                }
              })
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedOrder = payload.old as { id: string }
            setOrders((prev) => prev.filter((o) => o.id !== deletedOrder.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, fetchOrderWithItems])

  // Polling fallback every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000)
    return () => clearInterval(interval)
  }, [handleRefresh])

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  // Count orders by status
  const paidCount = orders.filter((o) => o.status === 'paid').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const completedCount = orders.filter((o) => o.status === 'completed').length

  // Handle status update from child component
  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: newStatus as OrderWithItems['status'] }
          : o
      )
    )
  }

  const tabs = [
    { value: 'all', label: 'All', count: orders.length, icon: null },
    { value: 'paid', label: 'New', count: paidCount, icon: Clock, variant: 'paid' as const },
    { value: 'preparing', label: 'Preparing', count: preparingCount, icon: ChefHat, variant: 'preparing' as const },
    { value: 'completed', label: 'Completed', count: completedCount, icon: CheckCircle, variant: 'completed' as const },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Refined Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display tracking-tight">
              Kōri Matcha
            </h1>
            <p className="text-sm text-primary-foreground/70 mt-0.5">
              Order Queue
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 border-0 text-white"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            {user && (
              <form action={signOut}>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-0 text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Status Summary Bar */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">
              {paidCount} new
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <span className="text-sm text-muted-foreground">
              {preparingCount} preparing
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">
              {completedCount} completed
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as TabValue)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "whitespace-nowrap",
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground shadow-zen"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
              {tab.count > 0 && (
                <Badge
                  variant={activeTab === tab.value ? "secondary" : (tab.variant || "secondary")}
                  className={cn(
                    "ml-1",
                    activeTab === tab.value && "bg-white/20 text-white"
                  )}
                >
                  {tab.count}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">茶</span>
            </div>
            <h3 className="text-lg font-display mb-2">No orders here</h3>
            <p className="text-sm text-muted-foreground">
              Orders will appear here automatically
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order, index) => (
                <div
                  key={order.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <OrderCard
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
