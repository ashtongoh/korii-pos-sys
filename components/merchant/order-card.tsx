'use client'

import { useState } from 'react'
import { OrderWithItems, CartCustomization } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  formatCurrency,
  formatRelativeTime,
  generateOrderNumber,
} from '@/lib/utils/format'
import { updateOrderStatus } from '@/lib/actions/orders'
import { toast } from 'sonner'
import { Loader2, CreditCard, Banknote, ChefHat, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderCardProps {
  order: OrderWithItems
  onStatusUpdate: (orderId: string, newStatus: string) => void
}

export function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: 'preparing' | 'completed') => {
    setIsUpdating(true)

    // Optimistic update
    onStatusUpdate(order.id, newStatus)

    const result = await updateOrderStatus(order.id, newStatus)

    if (!result.success) {
      // Revert on error
      onStatusUpdate(order.id, order.status)
      toast.error(result.error || 'Failed to update order status')
    } else {
      toast.success(
        newStatus === 'preparing'
          ? 'Order marked as preparing'
          : 'Order completed!'
      )
    }

    setIsUpdating(false)
  }

  // Parse customizations from order items
  const formatCustomizations = (customizationsJson: unknown): string => {
    if (!customizationsJson || !Array.isArray(customizationsJson)) return ''
    const customizations = customizationsJson as CartCustomization[]
    if (customizations.length === 0) return ''
    return customizations.map((c) => c.option_name).join(', ')
  }

  // Status configuration
  const statusConfig = {
    paid: {
      badge: <Badge variant="paid">New</Badge>,
      cardClass: 'border-accent/50 border-2 shadow-elevated',
      headerClass: 'bg-accent/5',
    },
    preparing: {
      badge: <Badge variant="preparing">Preparing</Badge>,
      cardClass: 'shadow-zen',
      headerClass: '',
    },
    completed: {
      badge: <Badge variant="completed">Completed</Badge>,
      cardClass: 'opacity-75 shadow-zen',
      headerClass: '',
    },
  }

  const config = statusConfig[order.status as keyof typeof statusConfig] || {
    badge: <Badge variant="outline">{order.status}</Badge>,
    cardClass: '',
    headerClass: '',
  }

  // Payment method icon
  const PaymentIcon = order.payment_method === 'cash' ? Banknote : CreditCard

  return (
    <article
      className={cn(
        "bg-card rounded-xl overflow-hidden transition-all duration-300",
        config.cardClass
      )}
    >
      {/* Header */}
      <div className={cn("p-4", config.headerClass)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              #{generateOrderNumber(order.id)}
            </span>
            {config.badge}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(order.created_at)}
          </span>
        </div>

        {/* Customer Initials - Prominent Display */}
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-display font-medium tracking-wide text-foreground">
            {order.customer_initials}
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <PaymentIcon className="h-3.5 w-3.5" />
            <span className="capitalize">{order.payment_method}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-4 pb-4">
        <div className="pt-4 border-t border-border/50 space-y-2">
          {order.order_items.map((orderItem) => {
            const customizations = formatCustomizations(orderItem.customizations_json)
            return (
              <div key={orderItem.id} className="text-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="font-medium">
                      <span className="text-muted-foreground">{orderItem.quantity}x</span>{' '}
                      {orderItem.item?.name || 'Unknown Item'}
                    </span>
                    {customizations && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {customizations}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {formatCurrency(Number(orderItem.item_total))}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-accent/20">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-display text-xl font-medium text-primary">
            {formatCurrency(Number(order.total_amount))}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-4">
          {order.status === 'paid' && (
            <Button
              className="w-full h-11 font-medium"
              variant="accent"
              onClick={() => handleStatusChange('preparing')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChefHat className="h-4 w-4 mr-2" />
              )}
              Start Preparing
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button
              className="w-full h-11 font-medium"
              onClick={() => handleStatusChange('completed')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark Complete
            </Button>
          )}
          {order.status === 'completed' && (
            <div className="text-center py-2">
              <span className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Order completed
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
