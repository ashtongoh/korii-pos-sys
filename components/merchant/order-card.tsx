'use client'

import { useState } from 'react'
import { OrderWithItems, CartCustomization } from '@/lib/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  formatCurrency,
  formatRelativeTime,
  generateOrderNumber,
} from '@/lib/utils/format'
import { updateOrderStatus } from '@/lib/actions/orders'
import { toast } from 'sonner'
import { Loader2, CreditCard, Banknote } from 'lucide-react'

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

  // Status badge variant
  const getStatusBadge = () => {
    switch (order.status) {
      case 'paid':
        return (
          <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">
            New
          </Badge>
        )
      case 'preparing':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            Preparing
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
            Completed
          </Badge>
        )
      default:
        return <Badge variant="outline">{order.status}</Badge>
    }
  }

  // Payment method icon
  const PaymentIcon = order.payment_method === 'cash' ? Banknote : CreditCard

  return (
    <Card className={`${order.status === 'paid' ? 'border-amber-500 border-2' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              #{generateOrderNumber(order.id)}
            </span>
            {getStatusBadge()}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(order.created_at)}
          </span>
        </div>

        {/* Customer Initials - Prominent Display */}
        <div className="mt-2">
          <span className="text-3xl font-bold tracking-wide">
            {order.customer_initials}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        <Separator className="mb-3" />

        {/* Order Items */}
        <div className="space-y-2">
          {order.order_items.map((orderItem) => {
            const customizations = formatCustomizations(orderItem.customizations_json)
            return (
              <div key={orderItem.id} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {orderItem.quantity}x {orderItem.item?.name || 'Unknown Item'}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(Number(orderItem.item_total))}
                  </span>
                </div>
                {customizations && (
                  <p className="text-xs text-muted-foreground ml-4">
                    {customizations}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <Separator className="my-3" />

        {/* Total and Payment Method */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <PaymentIcon className="h-4 w-4" />
            <span className="capitalize">{order.payment_method}</span>
          </div>
          <span className="font-bold text-lg">
            {formatCurrency(Number(order.total_amount))}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        {order.status === 'paid' && (
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600"
            onClick={() => handleStatusChange('preparing')}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Start Preparing
          </Button>
        )}
        {order.status === 'preparing' && (
          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={() => handleStatusChange('completed')}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Complete Order
          </Button>
        )}
        {order.status === 'completed' && (
          <p className="w-full text-center text-sm text-muted-foreground">
            Order completed
          </p>
        )}
      </CardFooter>
    </Card>
  )
}
