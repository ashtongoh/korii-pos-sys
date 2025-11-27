// HitPay API Types

export interface HitPayConfig {
  apiKey: string
  apiUrl: string
  salt: string
}

// Payment Request - what we send to HitPay
export interface HitPayPaymentRequest {
  amount: number
  currency: string
  payment_methods: string[]
  generate_qr?: boolean
  name?: string
  email?: string
  phone?: string
  purpose?: string
  reference_number?: string
  redirect_url?: string
  webhook?: string
  expires_after?: string
  expiry_date?: string
  send_email?: string
  send_sms?: string
  allow_repeated_payments?: string
}

// QR Code data in the response
export interface HitPayQRCodeData {
  qr_code?: string // The QR code image URL or data
  qr_code_url?: string // Alternative field name
}

// Payment Response - what HitPay returns
export interface HitPayPaymentResponse {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  amount: string
  currency: string
  status: string
  purpose: string | null
  reference_number: string | null
  payment_methods: string[]
  url: string // HitPay hosted payment page URL
  redirect_url: string | null
  webhook: string | null
  send_sms: boolean
  send_email: boolean
  sms_status: string
  email_status: string
  allow_repeated_payments: boolean
  expiry_date: string | null
  created_at: string
  updated_at: string
  qr_code_data?: HitPayQRCodeData
  qr_code?: string // Some responses include this at top level
}

// Webhook payload - what HitPay sends when payment completes
export interface HitPayWebhookPayload {
  payment_id: string
  payment_request_id: string
  phone: string | null
  amount: string
  currency: string
  status: string
  reference_number: string | null
  hmac: string
}

// Our internal types for creating payments
export interface CreatePaymentParams {
  amount: number
  sessionId: string
  orderId: string
  customerName?: string
  webhookUrl?: string
}

export interface CreatePaymentResult {
  success: boolean
  hitpayPaymentId?: string
  hitpayUrl?: string
  qrCodeUrl?: string
  expiresAt?: string
  error?: string
}
