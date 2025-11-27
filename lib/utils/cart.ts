import { CartItem, CartCustomization, Item } from '@/lib/types'

/**
 * Calculate item total with customizations
 */
export function calculateItemTotal(
  item: Item,
  customizations: CartCustomization[],
  quantity: number
): number {
  const basePrice = Number(item.base_price)
  const customizationsTotal = customizations.reduce(
    (sum, c) => sum + Number(c.price_modifier),
    0
  )
  return (basePrice + customizationsTotal) * quantity
}

/**
 * Calculate cart total
 */
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.item_total, 0)
}

/**
 * Add item to cart
 */
export function addToCart(
  cart: CartItem[],
  item: Item,
  customizations: CartCustomization[],
  quantity: number = 1
): CartItem[] {
  const item_total = calculateItemTotal(item, customizations, quantity)

  // Check if exact same item with same customizations exists
  const existingIndex = cart.findIndex((cartItem) =>
    isSameCartItem(cartItem, item, customizations)
  )

  if (existingIndex >= 0) {
    // Update quantity and total
    const updated = [...cart]
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantity: updated[existingIndex].quantity + quantity,
      item_total: calculateItemTotal(
        item,
        customizations,
        updated[existingIndex].quantity + quantity
      ),
    }
    return updated
  }

  // Add new item
  return [
    ...cart,
    {
      item,
      quantity,
      customizations,
      item_total,
    },
  ]
}

/**
 * Remove item from cart by index
 */
export function removeFromCart(cart: CartItem[], index: number): CartItem[] {
  return cart.filter((_, i) => i !== index)
}

/**
 * Update item quantity in cart
 */
export function updateCartItemQuantity(
  cart: CartItem[],
  index: number,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(cart, index)
  }

  const updated = [...cart]
  updated[index] = {
    ...updated[index],
    quantity,
    item_total: calculateItemTotal(
      updated[index].item,
      updated[index].customizations,
      quantity
    ),
  }
  return updated
}

/**
 * Clear cart
 */
export function clearCart(): CartItem[] {
  return []
}

/**
 * Check if two cart items are the same (including customizations)
 */
function isSameCartItem(
  cartItem: CartItem,
  item: Item,
  customizations: CartCustomization[]
): boolean {
  if (cartItem.item.id !== item.id) {
    return false
  }

  if (cartItem.customizations.length !== customizations.length) {
    return false
  }

  // Check if all customizations match
  const sortedCartCustomizations = [...cartItem.customizations].sort(
    (a, b) => a.option_id.localeCompare(b.option_id)
  )
  const sortedCustomizations = [...customizations].sort((a, b) =>
    a.option_id.localeCompare(b.option_id)
  )

  return sortedCartCustomizations.every(
    (c, i) => c.option_id === sortedCustomizations[i].option_id
  )
}

/**
 * Get cart item count
 */
export function getCartItemCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}
