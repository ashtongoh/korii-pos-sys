'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderWithItems, AdminUser } from '@/lib/types'
import { OrderCard } from './order-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { signOut } from '@/lib/actions/auth'

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
            // New order - fetch with items if it's in a relevant status
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

            // If status is now cancelled or pending, remove from list
            if (['cancelled', 'pending'].includes(updatedOrder.status)) {
              setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id))
              return
            }

            // Otherwise, update the order in the list
            const fullOrder = await fetchOrderWithItems(updatedOrder.id)
            if (fullOrder) {
              setOrders((prev) => {
                const exists = prev.some((o) => o.id === fullOrder.id)
                if (exists) {
                  return prev.map((o) => (o.id === fullOrder.id ? fullOrder : o))
                } else {
                  // Order wasn't in list (e.g., status changed from pending to paid)
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

    // Cleanup subscription on unmount
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

  return (
    <div className="min-h-screen">
      {/* Branded Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)]">Kōri Matcha</h1>
            <p className="text-sm text-primary-foreground/80">Order Queue</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="accent"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {user && (
              <form action={signOut}>
                <Button type="submit" variant="secondary" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-6">
        {/* Status Summary */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {paidCount} new · {preparingCount} preparing · {completedCount} completed
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              <Badge variant="secondary" className="ml-2">
                {orders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="paid">
              New
              {paidCount > 0 && (
                <Badge variant="paid" className="ml-2">
                  {paidCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing">
              Preparing
              {preparingCount > 0 && (
                <Badge variant="preparing" className="ml-2">
                  {preparingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <Badge variant="secondary" className="ml-2">
                {completedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No orders in this category</p>
                <p className="text-sm mt-1">Orders will appear here automatically</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
