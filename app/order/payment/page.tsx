'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/contexts/cart-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/format'
import { CheckCircle2, Loader2, QrCode as QrCodeIcon } from 'lucide-react'
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
  const [qrData, setQrData] = useState('')
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
        // PayNow payment - generate QR and wait
        // TODO: Generate actual PayNow QR code
        // For now, we'll create a mock QR data
        const mockQrData = `paynow://pay?uen=${process.env.NEXT_PUBLIC_PAYNOW_UEN}&amount=${total}&ref=${newSessionId}`
        setQrData(mockQrData)

        // Create payment session
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 15)

        const { error: sessionError } = await supabase
          .from('payment_sessions')
          .insert({
            session_id: newSessionId,
            order_id: order.id,
            qr_data: mockQrData,
            amount: total,
            expires_at: expiresAt.toISOString(),
          })

        if (sessionError) throw sessionError

        setIsProcessing(false)

        // Subscribe to payment session updates
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
              if (payload.new.status === 'confirmed') {
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
              }
            }
          )
          .subscribe()

        // Temporary: Auto-confirm after 10 seconds for testing
        // Remove this in production when email monitoring is working
        setTimeout(async () => {
          await supabase
            .from('payment_sessions')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
            .eq('session_id', newSessionId)

          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('id', order.id)
        }, 10000)

        return () => {
          channel.unsubscribe()
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
            <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
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
              <h2 className="text-2xl font-bold mb-2">Scan to Pay</h2>
              <p className="text-muted-foreground mb-6">
                Total: <span className="font-bold text-lg">{formatCurrency(cart.getTotal())}</span>
              </p>
            </div>

            {/* QR Code Placeholder */}
            <div className="bg-white p-8 rounded-lg border-4 border-primary">
              <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                <div className="text-center">
                  <QrCodeIcon className="h-48 w-48 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">PayNow QR Code</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Session: {sessionId.substring(0, 8)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>1. Open your banking app</p>
              <p>2. Scan the QR code above</p>
              <p>3. Complete the payment</p>
              <p className="pt-4">
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Waiting for payment confirmation...
              </p>
            </div>

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
