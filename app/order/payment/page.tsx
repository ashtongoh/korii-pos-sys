'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function PaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cart = useCart()

  const method = searchParams.get('method') as 'cash' | 'paynow'
  const initials = searchParams.get('initials') || ''

  const [isProcessing, setIsProcessing] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [hitpayError, setHitpayError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (cart.items.length === 0) {
      router.push('/order')
      return
    }

    processOrder()
  }, [])

  // Process the order
  const processOrder = async () => {
    try {
      const supabase = createClient()
      const newSessionId = uuidv4()
      setSessionId(newSessionId)

      const total = cart.getTotal()

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: newSessionId,
          customer_initials: initials,
          payment_method: method,
          total_amount: total,
          status: method === 'cash' ? 'paid' : 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      setOrderId(order.id)

      // Create order items
      const orderItems = cart.items.map((item) => ({
        order_id: order.id,
        item_id: item.item.id,
        quantity: item.quantity,
        customizations_json: item.customizations,
        item_total: item.item_total,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Handle payment method
      if (method === 'cash') {
        // Cash payment - immediately mark as paid
        setIsProcessing(false)
        setIsSuccess(true)
        cart.clear()

        // Auto redirect after countdown
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              router.push('/order')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        // PayNow payment - create payment session first, then call HitPay
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 15)

        // Create payment session in database (with placeholder qr_data)
        const { error: sessionError } = await supabase
          .from('payment_sessions')
          .insert({
            session_id: newSessionId,
            order_id: order.id,
            qr_data: 'pending_hitpay',
            amount: total,
            expires_at: expiresAt.toISOString(),
          })

        if (sessionError) throw sessionError

        // Call HitPay API to create payment request and get QR code
        try {
          const hitpayResponse = await fetch('/api/payments/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: total,
              session_id: newSessionId,
              order_id: order.id,
              customer_name: initials,
            }),
          })

          const hitpayData = await hitpayResponse.json()

          if (!hitpayResponse.ok || !hitpayData.success) {
            console.error('HitPay API error:', hitpayData)
            setHitpayError(hitpayData.error || 'Failed to generate QR code')
            setIsProcessing(false)
            return
          }

          if (hitpayData.qr_code_url) {
            setQrCodeUrl(hitpayData.qr_code_url)
          } else {
            console.warn('No QR code URL returned, using HitPay URL:', hitpayData.hitpay_url)
            setHitpayError('QR code not available. Please use the payment link.')
          }
        } catch (hitpayErr) {
          console.error('Failed to call HitPay API:', hitpayErr)
          setHitpayError('Failed to connect to payment service')
          setIsProcessing(false)
          return
        }

        setIsProcessing(false)

        // Function to handle successful payment
        const handlePaymentSuccess = () => {
          setIsSuccess(true)
          cart.clear()

          // Auto redirect after countdown
          const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                router.push('/order')
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }

        // Subscribe to payment session updates via Supabase Realtime
        const channel = supabase
          .channel(`payment-${newSessionId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'payment_sessions',
              filter: `session_id=eq.${newSessionId}`,
            },
            (payload) => {
              console.log('Realtime update received:', payload)
              if (payload.new.status === 'confirmed') {
                handlePaymentSuccess()
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime subscription status:', status)
          })

        // Polling fallback - check payment status every 3 seconds
        const pollInterval = setInterval(async () => {
          try {
            const { data: session } = await supabase
              .from('payment_sessions')
              .select('status')
              .eq('session_id', newSessionId)
              .single()

            if (session?.status === 'confirmed') {
              console.log('Payment confirmed via polling')
              clearInterval(pollInterval)
              channel.unsubscribe()
              handlePaymentSuccess()
            }
          } catch (err) {
            console.error('Polling error:', err)
          }
        }, 3000)

        return () => {
          channel.unsubscribe()
          clearInterval(pollInterval)
        }
      }
    } catch (error) {
      console.error('Error processing order:', error)
      toast.error('Failed to process order. Please try again.')
      setIsProcessing(false)
      setTimeout(() => router.push('/order/checkout'), 2000)
    }
  }

  // Success Screen
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background texture-paper">
        <div className="max-w-md w-full text-center animate-scale-in">
          {/* Success Icon */}
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>

          <h1 className="text-3xl font-display mb-3">Thank You!</h1>
          <p className="text-muted-foreground mb-2">
            Your order has been placed successfully.
          </p>
          <p className="text-lg font-display text-primary mb-8">
            We'll call "{initials}" when ready
          </p>

          {/* Decorative Line */}
          <div className="w-16 h-px bg-accent mx-auto mb-8" />

          <div className="bg-card rounded-xl shadow-zen p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting in {countdown} seconds...
            </p>
            <Button
              onClick={() => router.push('/order')}
              className="w-full h-12"
              size="lg"
            >
              Place Another Order
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Processing Screen
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-lg font-display">Preparing your order...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait</p>
        </div>
      </div>
    )
  }

  // PayNow QR Screen
  if (method === 'paynow') {
    return (
      <div className="min-h-screen bg-background texture-paper">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="max-w-md mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => router.push('/order/checkout')}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-display">Scan to Pay</h1>
              <p className="text-sm text-muted-foreground">PayNow Payment</p>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-6 py-8">
          {/* Amount Display */}
          <div className="text-center mb-8 animate-fade-in">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
              Total Amount
            </p>
            <p className="text-4xl font-display text-primary font-medium">
              {formatCurrency(cart.getTotal())}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="animate-fade-up delay-100">
            <div className={cn(
              "bg-white rounded-2xl shadow-elevated p-6",
              "border-4 border-primary/20"
            )}>
              <div className="aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                {hitpayError ? (
                  <div className="text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{hitpayError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHitpayError(null)
                        setIsProcessing(true)
                        processOrder()
                      }}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                ) : qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="PayNow QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Generating QR Code...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          {!hitpayError && (
            <div className="mt-8 animate-fade-up delay-200">
              <div className="bg-card rounded-xl shadow-zen p-5">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  How to Pay
                </h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-medium">1</span>
                    <span>Open your banking app</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-medium">2</span>
                    <span>Scan the QR code above</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 font-medium">3</span>
                    <span>Complete the payment</span>
                  </li>
                </ol>

                {/* Waiting indicator */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Waiting for payment...</span>
                </div>
              </div>

              {/* Session ID for debugging */}
              <p className="text-xs text-center text-muted-foreground/50 mt-4">
                Session: {sessionId.substring(0, 8)}
              </p>
            </div>
          )}

          {/* Cancel Button */}
          <div className="mt-8">
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push('/order/checkout')}
            >
              Cancel Payment
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return null
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
