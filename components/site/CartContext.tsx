'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  variantName?: string
  priceInCents: number
  quantity: number
  slug: string
}

interface CartContextValue {
  items: CartItem[]
  count: number
  totalCents: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void
  removeItem: (productId: string, variantId?: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'gazette-cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch { /* ignore */ }
  }, [items, hydrated])

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.productId === newItem.productId && i.variantId === newItem.variantId
      )
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId && i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)))
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i
        )
      )
    }
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variantId === variantId)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalCents = items.reduce((sum, i) => sum + i.priceInCents * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, totalCents, addItem, updateQuantity, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
