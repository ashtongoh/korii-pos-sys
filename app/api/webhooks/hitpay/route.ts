import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/hitpay/client'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // HitPay can send webhooks as JSON or form-urlencoded depending on configuration
    const contentType = request.headers.get('content-type') || ''
    let payload: Record<string, string>

    if (contentType.includes('application/json')) {
      // Handle JSON payload
      const jsonData = await request.json()
      // Convert to string values for signature verification
      payload = Object.fromEntries(
        Object.entries(jsonData).map(([key, value]) => [key, String(value ?? '')])
      )
    } else {
      // Handle form-urlencoded payload
      const formData = await request.formData()
      payload = {}
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          payload[key] = value
        }
      })
    }

    // Log full payload for debugging
    console.log('Received HitPay webhook payload:', JSON.stringify(payload, null, 2))

    // Extract key fields
    const {
      payment_request_id,
      reference_number,
      status,
      hmac,
    } = payload

    // Verify HMAC signature (only if hmac is provided - sandbox may not include it)
    if (hmac && !verifyWebhookSignature(payload, hmac)) {
      console.error('Invalid webhook signature')
      console.log('HMAC verification failed. Received hmac:', hmac)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Handle both 'completed' and 'succeeded' status values
    const isPaymentSuccessful = status === 'completed' || status === 'succeeded'
    if (!isPaymentSuccessful) {
      console.log(`Payment status is ${status}, not processing`)
      return NextResponse.json({ received: true })
    }

    // Use service client for admin operations
    const supabase = createServiceClient()

    // Try to find payment session by reference_number first, then by payment_request_id
    let paymentSession = null
    let findMethod = ''

    if (reference_number && reference_number !== 'undefined' && reference_number !== '') {
      // Look up by our session_id (stored as reference_number in HitPay)
      console.log('Looking up by reference_number (session_id):', reference_number)
      const result = await supabase
        .from('payment_sessions')
        .select('id, order_id, status, session_id')
        .eq('session_id', reference_number)
        .single()

      if (result.data) {
        paymentSession = result.data
        findMethod = 'reference_number'
      }
    }

    // If not found by reference_number, try by hitpay_payment_id
    if (!paymentSession && payment_request_id) {
      console.log('Looking up by hitpay_payment_id:', payment_request_id)
      const result = await supabase
        .from('payment_sessions')
        .select('id, order_id, status, session_id')
        .eq('hitpay_payment_id', payment_request_id)
        .single()

      if (result.data) {
        paymentSession = result.data
        findMethod = 'hitpay_payment_id'
      }
    }

    if (!paymentSession) {
      console.error('Payment session not found. reference_number:', reference_number, 'payment_request_id:', payment_request_id)
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      )
    }

    console.log(`Found payment session via ${findMethod}:`, paymentSession.session_id)

    // Prevent duplicate processing
    if (paymentSession.status === 'confirmed') {
      console.log('Payment already confirmed, skipping')
      return NextResponse.json({ received: true, already_processed: true })
    }

    // Update payment session status
    const { error: updateSessionError } = await supabase
      .from('payment_sessions')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        hitpay_payment_id: payment_request_id,
      })
      .eq('id', paymentSession.id)

    if (updateSessionError) {
      console.error('Failed to update payment session:', updateSessionError)
      return NextResponse.json(
        { error: 'Failed to update payment session' },
        { status: 500 }
      )
    }

    // Update order status to paid
    if (paymentSession.order_id) {
      const { error: updateOrderError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', paymentSession.order_id)

      if (updateOrderError) {
        console.error('Failed to update order status:', updateOrderError)
        // Don't fail the webhook - payment session was updated
      } else {
        console.log('Order status updated to paid:', paymentSession.order_id)
      }
    }

    console.log('Payment confirmed successfully:', paymentSession.session_id)

    return NextResponse.json({
      received: true,
      session_id: paymentSession.session_id,
      status: 'confirmed',
    })
  } catch (error) {
    console.error('Error processing HitPay webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// HitPay may send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: 'hitpay-webhook' })
}
