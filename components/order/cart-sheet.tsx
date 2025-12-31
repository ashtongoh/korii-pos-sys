'use client'

import { useCart } from '@/contexts/cart-context'
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

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
      <SheetContent side="right" className="w-full sm:max-w-md border-l-0 shadow-2xl">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="font-display text-xl">Your Order</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center justify-center h-[70vh] animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-display mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground text-center text-sm max-w-[200px]">
            Add some delicious matcha to begin your order
          </p>
        </div>
      </SheetContent>
    )
  }

  return (
    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col border-l-0 shadow-2xl p-0">
      {/* Header */}
      <SheetHeader className="px-6 py-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <SheetTitle className="font-display text-xl">Your Order</SheetTitle>
          <span className="text-sm text-muted-foreground">
            {cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'}
          </span>
        </div>
      </SheetHeader>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-background">
        <div className="space-y-4">
          {cart.items.map((cartItem, index) => (
            <div
              key={index}
              className={cn(
                "bg-card rounded-xl p-4 shadow-zen animate-fade-up",
                "transition-all duration-300 hover:shadow-elevated"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-base font-medium truncate">
                    {cartItem.item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatCurrency(Number(cartItem.item.base_price))}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => cart.removeItem(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Customizations */}
              {cartItem.customizations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                  {cartItem.customizations.map((custom, idx) => (
                    <div key={idx} className="text-sm flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {custom.group_name}: <span className="text-foreground">{custom.option_name}</span>
                      </span>
                      {Number(custom.price_modifier) !== 0 && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {Number(custom.price_modifier) > 0 ? '+' : ''}
                          {formatCurrency(Number(custom.price_modifier))}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity Controls */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border/50"
                    onClick={() => cart.updateQuantity(index, cartItem.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-10 text-center font-medium text-sm">
                    {cartItem.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full border-border/50"
                    onClick={() => cart.updateQuantity(index, cartItem.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-display text-lg font-medium text-primary">
                  {formatCurrency(cartItem.item_total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer with Total and Checkout */}
      <SheetFooter className="flex-col gap-4 p-6 border-t bg-card">
        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total</span>
          <span className="font-display text-2xl font-medium text-foreground">
            {formatCurrency(cart.getTotal())}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <Button
            size="lg"
            className="w-full h-12 font-medium group"
            onClick={handleCheckout}
          >
            Proceed to Checkout
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive"
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
