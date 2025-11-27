import { Database } from './database.types'

// Convenience types
export type Category = Database['public']['Tables']['categories']['Row']
export type Item = Database['public']['Tables']['items']['Row']
export type CustomizationGroup = Database['public']['Tables']['customization_groups']['Row']
export type CustomizationOption = Database['public']['Tables']['customization_options']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type PaymentSession = Database['public']['Tables']['payment_sessions']['Row']
export type AdminUser = Database['public']['Tables']['admin_users']['Row']

// Extended types with relations
export type ItemWithCategory = Item & {
  category: Category
}

export type ItemWithCustomizations = Item & {
  category: Category
  customization_groups: (CustomizationGroup & {
    options: CustomizationOption[]
  })[]
}

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    item: Item
  })[]
}

// Cart types
export interface CartCustomization {
  group_id: string
  group_name: string
  option_id: string
  option_name: string
  price_modifier: number
}

export interface CartItem {
  item: Item
  quantity: number
  customizations: CartCustomization[]
  item_total: number
}

export interface Cart {
  items: CartItem[]
  total: number
}

// Order status types
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
export type PaymentMethod = 'cash' | 'paynow'
export type PaymentSessionStatus = 'pending' | 'confirmed' | 'expired' | 'failed'

// PayNow types
export interface PayNowData {
  uen: string
  amount: number
  reference: string // This will be the session_id
  editable: boolean
  expiry: string
}
