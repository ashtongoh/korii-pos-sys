import { NextRequest, NextResponse } from 'next/server'
import { createPaymentRequest } from '@/lib/hitpay/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, session_id, order_id, customer_name } = body

    // Validate required fields
    if (!amount || !session_id || !order_id) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, session_id, order_id' },
        { status: 400 }
      )
    }

    // Build webhook URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const webhookUrl = `${appUrl}/api/webhooks/hitpay`

    // Create payment request with HitPay
    const result = await createPaymentRequest({
      amount: Number(amount),
      sessionId: session_id,
      orderId: order_id,
      customerName: customer_name,
      webhookUrl,
    })

    if (!result.success) {
      console.error('Failed to create HitPay payment:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to create payment request' },
        { status: 500 }
      )
    }

    // Update payment session with HitPay data
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('payment_sessions')
      .update({
        hitpay_payment_id: result.hitpayPaymentId,
        hitpay_url: result.hitpayUrl,
        qr_code_url: result.qrCodeUrl,
      })
      .eq('session_id', session_id)

    if (updateError) {
      console.error('Failed to update payment session:', updateError)
      // Don't fail the request - the payment was created, we just couldn't update our DB
    }

    return NextResponse.json({
      success: true,
      hitpay_payment_id: result.hitpayPaymentId,
      hitpay_url: result.hitpayUrl,
      qr_code_url: result.qrCodeUrl,
      expires_at: result.expiresAt,
    })
  } catch (error) {
    console.error('Error in payment creation endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
