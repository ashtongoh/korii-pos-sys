export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          display_order: number
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_order: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_order?: number
          image_url?: string | null
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          base_price: number
          image_url: string | null
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          base_price: number
          image_url?: string | null
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          base_price?: number
          image_url?: string | null
          available?: boolean
          updated_at?: string
        }
      }
      customization_groups: {
        Row: {
          id: string
          name: string
          type: 'single' | 'multiple'
          required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'single' | 'multiple'
          required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'single' | 'multiple'
          required?: boolean
          updated_at?: string
        }
      }
      customization_options: {
        Row: {
          id: string
          group_id: string
          name: string
          price_modifier: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          price_modifier?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          price_modifier?: number
          updated_at?: string
        }
      }
      item_customization_groups: {
        Row: {
          item_id: string
          group_id: string
          created_at: string
        }
        Insert: {
          item_id: string
          group_id: string
          created_at?: string
        }
        Update: {
          item_id?: string
          group_id?: string
        }
      }
      orders: {
        Row: {
          id: string
          session_id: string
          customer_initials: string
          status: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
          payment_method: 'cash' | 'paynow'
          total_amount: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          customer_initials: string
          status?: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
          payment_method: 'cash' | 'paynow'
          total_amount: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          customer_initials?: string
          status?: 'pending' | 'paid' | 'preparing' | 'completed' | 'cancelled'
          payment_method?: 'cash' | 'paynow'
          total_amount?: number
          completed_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string
          quantity: number
          customizations_json: Json
          item_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_id: string
          quantity: number
          customizations_json: Json
          item_total: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string
          quantity?: number
          customizations_json?: Json
          item_total?: number
        }
      }
      payment_sessions: {
        Row: {
          id: string
          session_id: string
          order_id: string | null
          qr_data: string
          status: 'pending' | 'confirmed' | 'expired' | 'failed'
          amount: number
          expires_at: string
          confirmed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          order_id?: string | null
          qr_data: string
          status?: 'pending' | 'confirmed' | 'expired' | 'failed'
          amount: number
          expires_at: string
          confirmed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          order_id?: string | null
          qr_data?: string
          status?: 'pending' | 'confirmed' | 'expired' | 'failed'
          amount?: number
          expires_at?: string
          confirmed_at?: string | null
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'barista'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'barista'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'barista'
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
