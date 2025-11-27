'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { CartItem, CartCustomization, Item } from '@/lib/types'
import {
  addToCart as addToCartUtil,
  removeFromCart as removeFromCartUtil,
  updateCartItemQuantity as updateCartItemQuantityUtil,
  calculateCartTotal,
  getCartItemCount,
} from '@/lib/utils/cart'

interface CartContextType {
  items: CartItem[]
  addItem: (item: Item, customizations: CartCustomization[], quantity?: number) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, quantity: number) => void
  clear: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'korii-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isHydrated, setIsHydrated] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setItems(parsed)
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error)
      }
    }
    setIsHydrated(true)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isHydrated])

  const addItem = (item: Item, customizations: CartCustomization[], quantity = 1) => {
    setItems((current) => addToCartUtil(current, item, customizations, quantity))
  }

  const removeItem = (index: number) => {
    setItems((current) => removeFromCartUtil(current, index))
  }

  const updateQuantity = (index: number, quantity: number) => {
    setItems((current) => updateCartItemQuantityUtil(current, index, quantity))
  }

  const clear = () => {
    setItems([])
  }

  const getTotal = () => calculateCartTotal(items)

  const getItemCount = () => getCartItemCount(items)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
