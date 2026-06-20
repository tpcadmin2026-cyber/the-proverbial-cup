'use client'

import Link from 'next/link'
import { useCart } from '@/components/site/CartContext'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(cents / 100)
}

export function CartView() {
  const { items, totalCents, updateQuantity, removeItem } = useCart()

  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: grain, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link href="/shop" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
          ← Continue shopping
        </Link>

        <div className="mt-6 bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden">
          <div className="bg-[#35291C] px-8 py-5 text-center">
            <h1 className="font-playfair text-xl text-[#E8E6D8] tracking-wide">Your Cart</h1>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          <div className="px-8 py-7">
            {items.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="text-4xl text-[#c8c4a8]">⊡</div>
                <p className="font-baskerville italic text-[#4B4C44] text-lg">Your cart is presently empty.</p>
                <Link
                  href="/shop"
                  className="inline-block px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
                >
                  Browse the Emporium
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Items */}
                <ul className="divide-y divide-[#e8e4d0]">
                  {items.map((item) => {
                    const key = `${item.productId}-${item.variantId ?? ''}`
                    return (
                      <li key={key} className="py-4 flex items-start gap-4">
                        {/* Icon placeholder */}
                        <div className="w-14 h-14 rounded-lg bg-[#f5f2e8] border border-[#e8e4d0] flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl text-[#c8c4a8]">☕</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link href={`/shop/${item.slug}`} className="font-semibold text-sm text-[#35291C] hover:text-[#C4AB77] transition-colors line-clamp-2">
                            {item.name}
                          </Link>
                          {item.variantName && (
                            <p className="text-xs text-[#C4AB77] mt-0.5">{item.variantName}</p>
                          )}
                          <p className="text-sm text-[#4B4C44] mt-1">{formatPrice(item.priceInCents)} each</p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                              className="w-6 h-6 rounded border border-[#c8c4a8] text-xs hover:border-[#35291C] transition-colors"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                              className="w-6 h-6 rounded border border-[#c8c4a8] text-xs hover:border-[#35291C] transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-playfair text-sm text-[#35291C]">
                            {formatPrice(item.priceInCents * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="text-xs text-[#7A564C] hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* Total */}
                <div className="border-t-2 border-[#35291C] pt-4 flex items-center justify-between">
                  <span className="font-playfair text-sm text-[#4B4C44] uppercase tracking-wide">Total</span>
                  <span className="font-playfair text-2xl text-[#35291C]">{formatPrice(totalCents)}</span>
                </div>

                <p className="text-xs text-[#4B4C44] italic text-center">
                  Shipping calculated at checkout. UK delivery typically 3–5 working days.
                </p>

                <Link
                  href="/shop/checkout"
                  className="block w-full text-center py-3 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c12] transition-colors"
                >
                  Proceed to checkout →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
