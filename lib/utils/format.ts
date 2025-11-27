/**
 * Format currency (SGD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeStyle: 'short',
  }).format(new Date(date))
}

/**
 * Format date only
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-SG', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
}

/**
 * Generate order number from UUID
 */
export function generateOrderNumber(id: string): string {
  // Take first 8 characters of UUID and convert to uppercase
  return id.substring(0, 8).toUpperCase()
}

/**
 * Validate customer initials
 */
export function validateInitials(initials: string): boolean {
  const trimmed = initials.trim()
  return trimmed.length >= 2 && trimmed.length <= 3 && /^[A-Za-z]+$/.test(trimmed)
}

/**
 * Format customer initials (uppercase)
 */
export function formatInitials(initials: string): string {
  return initials.trim().toUpperCase()
}
