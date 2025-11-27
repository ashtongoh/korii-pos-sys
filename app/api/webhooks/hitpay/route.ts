import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, formDataToObject } from '@/lib/hitpay/client'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // HitPay sends webhooks as application/x-www-form-urlencoded
    const formData = await request.formData()
    const payload = formDataToObject(formData)

    // Extract key fields
    const {
      payment_id,
      payment_request_id,
      reference_number,
      amount,
      status,
      hmac,
    } = payload

    console.log('Received HitPay webhook:', {
      payment_id,
      payment_request_id,
      reference_number,
      amount,
      status,
    })

    // Verify HMAC signature
    if (!verifyWebhookSignature(payload, hmac)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Only process completed payments
    if (status !== 'completed') {
      console.log(`Payment status is ${status}, not processing`)
      return NextResponse.json({ received: true })
    }

    // reference_number is our session_id
    if (!reference_number) {
      console.error('No reference_number in webhook payload')
      return NextResponse.json(
        { error: 'Missing reference_number' },
        { status: 400 }
      )
    }

    // Use service client for admin operations
    const supabase = createServiceClient()

    // Find and update payment session
    const { data: paymentSession, error: findError } = await supabase
      .from('payment_sessions')
      .select('id, order_id, status')
      .eq('session_id', reference_number)
      .single()

    if (findError || !paymentSession) {
      console.error('Payment session not found:', reference_number, findError)
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      )
    }

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
      .eq('session_id', reference_number)

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
      }
    }

    console.log('Payment confirmed successfully:', reference_number)

    return NextResponse.json({
      received: true,
      session_id: reference_number,
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
