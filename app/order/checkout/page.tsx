'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, validateInitials, formatInitials } from '@/lib/utils/format'
import { ArrowLeft, Banknote, QrCode, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const cart = useCart()
  const [step, setStep] = useState<'initials' | 'payment'>('initials')
  const [initials, setInitials] = useState('')

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      router.push('/order')
    }
  }, [cart.items.length, router])

  const handleInitialsSubmit = () => {
    if (!validateInitials(initials)) {
      toast.error('Please enter 2-3 letters for your initials')
      return
    }
    setStep('payment')
  }

  const handlePaymentMethod = async (method: 'cash' | 'paynow') => {
    const formattedInitials = formatInitials(initials)
    router.push(`/order/payment?method=${method}&initials=${formattedInitials}`)
  }

  if (cart.items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background texture-paper">
      {/* Minimal Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => (step === 'payment' ? setStep('initials') : router.back())}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="animate-fade-in">
            <h1 className="text-xl font-display">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {step === 'initials' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Order Summary - Compact */}
        <section className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Order Summary
            </h2>
            <span className="text-sm text-muted-foreground">
              {cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="bg-card rounded-xl shadow-zen p-5 space-y-4">
            {cart.items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex justify-between items-start",
                  index > 0 && "pt-4 border-t border-border/50"
                )}
              >
                <div className="flex-1">
                  <p className="font-display text-base">
                    <span className="text-muted-foreground">{item.quantity}x</span>{' '}
                    {item.item.name}
                  </p>
                  {item.customizations.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {item.customizations.map((c, i) => (
                        <p key={i}>{c.option_name}</p>
                      ))}
                    </div>
                  )}
                </div>
                <p className="font-display text-base">{formatCurrency(item.item_total)}</p>
              </div>
            ))}

            {/* Total */}
            <div className="pt-4 border-t border-accent/30 flex justify-between items-center">
              <span className="text-muted-foreground">Total</span>
              <span className="font-display text-2xl text-primary font-medium">
                {formatCurrency(cart.getTotal())}
              </span>
            </div>
          </div>
        </section>

        {/* Initials Step */}
        {step === 'initials' && (
          <section className="animate-fade-up delay-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display mb-2">Your Initials</h2>
              <p className="text-muted-foreground">
                We'll call your initials when your order is ready
              </p>
            </div>

            <div className="bg-card rounded-xl shadow-zen p-6 space-y-6">
              {/* Large Initials Input */}
              <div className="text-center">
                <Input
                  type="text"
                  placeholder="ABC"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="text-center text-4xl font-display h-20 uppercase tracking-widest border-2 focus:border-primary"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Enter 2-3 letters
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-14 font-medium group"
                onClick={handleInitialsSubmit}
                disabled={!validateInitials(initials)}
              >
                Continue to Payment
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </section>
        )}

        {/* Payment Method Step */}
        {step === 'payment' && (
          <section className="animate-fade-up delay-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display mb-2">Payment Method</h2>
              <p className="text-muted-foreground">
                Order for <span className="font-semibold text-foreground">{initials}</span>
              </p>
            </div>

            <div className="space-y-4">
              {/* PayNow Option */}
              <button
                onClick={() => handlePaymentMethod('paynow')}
                className={cn(
                  "w-full bg-card rounded-xl shadow-zen p-6 text-left",
                  "border-2 border-transparent",
                  "transition-all duration-300",
                  "hover:shadow-elevated hover:border-primary hover:-translate-y-0.5",
                  "group"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <QrCode className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg mb-0.5">PayNow</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan QR code to pay instantly
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>

              {/* Cash Option */}
              <button
                onClick={() => handlePaymentMethod('cash')}
                className={cn(
                  "w-full bg-card rounded-xl shadow-zen p-6 text-left",
                  "border-2 border-transparent",
                  "transition-all duration-300",
                  "hover:shadow-elevated hover:border-primary hover:-translate-y-0.5",
                  "group"
                )}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Banknote className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg mb-0.5">Cash</h3>
                    <p className="text-sm text-muted-foreground">
                      Pay at the counter
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
