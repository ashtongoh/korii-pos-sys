'use client'

import { useCart } from '@/contexts/cart-context'
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils/format'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CartSheetProps {
  onClose: () => void
}

export default function CartSheet({ onClose }: CartSheetProps) {
  const cart = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    onClose()
    router.push('/order/checkout')
  }

  if (cart.items.length === 0) {
    return (
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground text-center">
            Add some delicious items to get started!
          </p>
        </div>
      </SheetContent>
    )
  }

  return (
    <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
      <SheetHeader>
        <SheetTitle>Your Cart ({cart.getItemCount()} items)</SheetTitle>
      </SheetHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="space-y-4">
          {cart.items.map((cartItem, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{cartItem.item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(Number(cartItem.item.base_price))}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cart.removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Customizations */}
              {cartItem.customizations.length > 0 && (
                <div className="space-y-1">
                  {cartItem.customizations.map((custom, idx) => (
                    <div key={idx} className="text-sm flex justify-between">
                      <span className="text-muted-foreground">
                        • {custom.group_name}: {custom.option_name}
                      </span>
                      {Number(custom.price_modifier) !== 0 && (
                        <span className="text-muted-foreground">
                          {Number(custom.price_modifier) > 0 ? '+' : ''}
                          {formatCurrency(Number(custom.price_modifier))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => cart.updateQuantity(index, cartItem.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => cart.updateQuantity(index, cartItem.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-semibold">
                  {formatCurrency(cartItem.item_total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Footer with Total and Checkout */}
      <SheetFooter className="flex-col gap-4 pt-4">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>Total</span>
          <span>{formatCurrency(cart.getTotal())}</span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <Button size="lg" className="w-full" onClick={handleCheckout}>
            Proceed to Checkout
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              cart.clear()
              onClose()
            }}
          >
            Clear Cart
          </Button>
        </div>
      </SheetFooter>
    </SheetContent>
  )
}
