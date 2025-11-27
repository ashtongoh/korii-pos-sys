'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, validateInitials, formatInitials } from '@/lib/utils/format'
import { ArrowLeft, Banknote, QrCode } from 'lucide-react'
import { toast } from 'sonner'

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

    // Navigate to payment confirmation page
    router.push(`/order/payment?method=${method}&initials=${formattedInitials}`)
  }

  if (cart.items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (step === 'payment' ? setStep('initials') : router.back())}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              {step === 'initials' ? 'Enter your initials' : 'Select payment method'}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">
                    {item.quantity}x {item.item.name}
                  </p>
                  {item.customizations.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {item.customizations.map((c, i) => (
                        <div key={i}>• {c.option_name}</div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="font-medium">{formatCurrency(item.item_total)}</p>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(cart.getTotal())}</span>
            </div>
          </CardContent>
        </Card>

        {/* Initials Step */}
        {step === 'initials' && (
          <Card>
            <CardHeader>
              <CardTitle>Your Initials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initials">Enter 2-3 letters (for order identification)</Label>
                <Input
                  id="initials"
                  type="text"
                  placeholder="e.g., ABC"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  maxLength={3}
                  className="text-2xl text-center font-bold uppercase"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground text-center">
                  We'll call your initials when your order is ready
                </p>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={handleInitialsSubmit}
                disabled={!validateInitials(initials)}
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Method Step */}
        {step === 'payment' && (
          <div className="space-y-4">
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => handlePaymentMethod('paynow')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">Pay with PayNow</h3>
                  <p className="text-sm text-muted-foreground">
                    Scan QR code to pay instantly
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
              onClick={() => handlePaymentMethod('cash')}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Banknote className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">Pay with Cash</h3>
                  <p className="text-sm text-muted-foreground">
                    Pay at the counter
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
