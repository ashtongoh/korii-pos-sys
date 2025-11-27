import * as crypto from 'crypto'
import {
  HitPayPaymentRequest,
  HitPayPaymentResponse,
  HitPayWebhookPayload,
  CreatePaymentParams,
  CreatePaymentResult,
} from './types'

const HITPAY_API_KEY = process.env.HITPAY_API_KEY || ''
const HITPAY_API_URL = process.env.HITPAY_API_URL || 'https://api.sandbox.hit-pay.com'
const HITPAY_SALT = process.env.HITPAY_SALT || ''

/**
 * Create a payment request with HitPay and generate a QR code
 */
export async function createPaymentRequest(
  params: CreatePaymentParams
): Promise<CreatePaymentResult> {
  const { amount, sessionId, orderId, customerName, webhookUrl } = params

  const payload: HitPayPaymentRequest = {
    amount: Number(amount.toFixed(2)),
    currency: 'SGD',
    payment_methods: ['paynow_online'],
    generate_qr: true,
    reference_number: sessionId, // Use session_id as reference for tracking
    name: customerName || undefined,
    webhook: webhookUrl || undefined,
    expires_after: '15 minutes',
    send_email: 'false',
    send_sms: 'false',
  }

  try {
    const response = await fetch(`${HITPAY_API_URL}/v1/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-BUSINESS-API-KEY': HITPAY_API_KEY,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('HitPay API error:', response.status, errorText)
      return {
        success: false,
        error: `HitPay API error: ${response.status} - ${errorText}`,
      }
    }

    const data: HitPayPaymentResponse = await response.json()

    // Extract QR code URL from response
    // HitPay can return it in different places depending on the response
    const qrCodeUrl =
      data.qr_code_data?.qr_code ||
      data.qr_code_data?.qr_code_url ||
      data.qr_code ||
      undefined

    // Calculate expiry time (15 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    return {
      success: true,
      hitpayPaymentId: data.id,
      hitpayUrl: data.url,
      qrCodeUrl,
      expiresAt: expiresAt.toISOString(),
    }
  } catch (error) {
    console.error('HitPay API request failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Verify the HMAC signature from HitPay webhook
 * HitPay uses HMAC-SHA256 with the payload values (excluding hmac) sorted by key
 */
export function verifyWebhookSignature(
  payload: Record<string, string>,
  receivedHmac: string
): boolean {
  if (!HITPAY_SALT) {
    console.error('HITPAY_SALT is not configured')
    return false
  }

  // Remove hmac from payload and sort keys alphabetically
  const { hmac: _, ...payloadWithoutHmac } = payload
  const sortedKeys = Object.keys(payloadWithoutHmac).sort()

  // Build the string to sign: key1value1key2value2...
  const stringToSign = sortedKeys
    .map((key) => `${key}${payloadWithoutHmac[key]}`)
    .join('')

  // Generate HMAC
  const computedHmac = crypto
    .createHmac('sha256', HITPAY_SALT)
    .update(stringToSign)
    .digest('hex')

  return computedHmac === receivedHmac
}

/**
 * Parse webhook payload from form data
 */
export function parseWebhookPayload(
  formData: FormData
): HitPayWebhookPayload | null {
  try {
    return {
      payment_id: formData.get('payment_id') as string,
      payment_request_id: formData.get('payment_request_id') as string,
      phone: formData.get('phone') as string | null,
      amount: formData.get('amount') as string,
      currency: formData.get('currency') as string,
      status: formData.get('status') as string,
      reference_number: formData.get('reference_number') as string | null,
      hmac: formData.get('hmac') as string,
    }
  } catch {
    return null
  }
}

/**
 * Convert FormData to a plain object for signature verification
 */
export function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {}
  formData.forEach((value, key) => {
    if (typeof value === 'string') {
      obj[key] = value
    }
  })
  return obj
}
