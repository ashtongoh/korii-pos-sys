'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { CheckCircle2, Loader2, QrCode as QrCodeIcon, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

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
            qr_data: 'pending_hitpay', // Placeholder until HitPay responds
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

          // Set the QR code URL from HitPay
          if (hitpayData.qr_code_url) {
            setQrCodeUrl(hitpayData.qr_code_url)
          } else {
            // If no QR code URL, we can fallback to showing the HitPay hosted page link
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
        // This handles cases where Realtime isn't enabled or misses the update
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

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <CheckCircle2 className="h-24 w-24 text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2 font-[family-name:var(--font-display)]">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Thank you, <span className="font-semibold">{initials}</span>!
              </p>
              <p className="text-lg">
                Your order will be ready soon. We'll call your initials when it's done.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting in {countdown} seconds...
              </p>
              <Button onClick={() => router.push('/order')} className="w-full" size="lg">
                Place Another Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Processing your order...</p>
        </div>
      </div>
    )
  }

  // PayNow payment screen
  if (method === 'paynow') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2 font-[family-name:var(--font-display)]">Scan to Pay</h2>
              <p className="text-muted-foreground mb-6">
                Total: <span className="font-bold text-lg text-primary">{formatCurrency(cart.getTotal())}</span>
              </p>
            </div>

            {/* QR Code Display */}
            <div className="bg-white p-4 rounded-lg border-4 border-primary">
              <div className="aspect-square bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                {hitpayError ? (
                  <div className="text-center p-4">
                    <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">{hitpayError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setHitpayError(null)
                        setIsProcessing(true)
                        processOrder()
                      }}
                    >
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
                    <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Generating QR Code...</p>
                  </div>
                )}
              </div>
            </div>

            {!hitpayError && (
              <div className="space-y-2 text-center text-sm text-muted-foreground">
                <p>1. Open your banking app</p>
                <p>2. Scan the QR code above</p>
                <p>3. Complete the payment</p>
                <p className="pt-4">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Waiting for payment confirmation...
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Session: {sessionId.substring(0, 8)}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/order/checkout')}
            >
              Cancel & Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <PaymentContent />
    </Suspense>
  )
}
