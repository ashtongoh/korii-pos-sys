// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PREPARING: 'preparing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

// Payment methods
export const PAYMENT_METHOD = {
  CASH: 'cash',
  PAYNOW: 'paynow',
} as const

// Payment session statuses
export const PAYMENT_SESSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  EXPIRED: 'expired',
  FAILED: 'failed',
} as const

// Payment session expiry (15 minutes)
export const PAYMENT_SESSION_EXPIRY_MINUTES = 15

// Customer initials validation
export const CUSTOMER_INITIALS_MIN_LENGTH = 2
export const CUSTOMER_INITIALS_MAX_LENGTH = 3

// Order polling interval for merchant dashboard (milliseconds)
export const ORDER_POLLING_INTERVAL = 1000

// Payment confirmation wait time (seconds)
export const PAYMENT_CONFIRMATION_WAIT_TIME = 10

// Email monitoring settings
export const EMAIL_POLL_INTERVAL = parseInt(
  process.env.EMAIL_POLL_INTERVAL_MS || '15000',
  10
)

// PayNow configuration
export const PAYNOW_CONFIG = {
  UEN: process.env.PAYNOW_UEN || '',
  MERCHANT_NAME: process.env.PAYNOW_MERCHANT_NAME || 'Korii Matcha',
}
