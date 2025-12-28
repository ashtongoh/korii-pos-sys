import * as crypto from 'crypto'
import QRCode from 'qrcode'
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

    // Try to get QR code from HitPay response
    const rawQrValue =
      data.qr_code_data?.qr_code ||
      data.qr_code_data?.qr_code_url ||
      data.qr_code ||
      undefined

    let qrCodeUrl: string | undefined

    // Check if the value is already a valid image URL or data URL
    if (rawQrValue && (
      rawQrValue.startsWith('http://') ||
      rawQrValue.startsWith('https://') ||
      rawQrValue.startsWith('data:')
    )) {
      qrCodeUrl = rawQrValue
    } else {
      // HitPay returned a raw PayNow EMV string (e.g., "00020101...") or nothing
      // We need to generate a QR code image from this string or the payment URL
      const qrContent = rawQrValue || data.url
      if (qrContent) {
        try {
          qrCodeUrl = await QRCode.toDataURL(qrContent, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#ffffff',
            },
          })
        } catch (qrError) {
          console.error('Failed to generate QR code:', qrError)
        }
      }
    }

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
 * Only non-empty values are included in the signature
 */
export function verifyWebhookSignature(
  payload: Record<string, string>,
  receivedHmac: string
): boolean {
  if (!HITPAY_SALT) {
    console.error('HITPAY_SALT is not configured')
    return false
  }

  // Remove hmac from payload and filter out empty/null/undefined values
  const { hmac: _, ...payloadWithoutHmac } = payload

  // Filter to only include non-empty string values and sort keys alphabetically
  const filteredPayload = Object.fromEntries(
    Object.entries(payloadWithoutHmac)
      .filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== 'undefined')
  )
  const sortedKeys = Object.keys(filteredPayload).sort()

  // Build the string to sign: key1value1key2value2...
  const stringToSign = sortedKeys
    .map((key) => `${key}${filteredPayload[key]}`)
    .join('')

  // Log for debugging
  console.log('HMAC verification - String to sign:', stringToSign)
  console.log('HMAC verification - Using salt:', HITPAY_SALT.substring(0, 8) + '...')

  // Generate HMAC
  const computedHmac = crypto
    .createHmac('sha256', HITPAY_SALT)
    .update(stringToSign)
    .digest('hex')

  console.log('HMAC verification - Computed:', computedHmac)
  console.log('HMAC verification - Received:', receivedHmac)

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
