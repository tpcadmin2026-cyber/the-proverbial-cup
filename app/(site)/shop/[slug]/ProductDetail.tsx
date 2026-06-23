'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/components/site/CartContext'

interface Variant { id: string; name: string; priceInCents: number | null; inventory: number | null }

interface Props {
  product: {
    id: string
    slug: string
    name: string
    description: string | null
    priceInCents: number
    compareAtCents: number | null
    inventory: number | null
    variants: Variant[]
  }
  currency: string
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

export function ProductDetail({ product, currency }: Props) {
  const { addItem } = useCart()
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants[0]?.id
  )
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const effectivePrice = selectedVariant?.priceInCents ?? product.priceInCents
  const outOfStock = (selectedVariant?.inventory ?? product.inventory ?? null) === 0

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: selectedVariantId,
      variantName: selectedVariant?.name,
      priceInCents: effectivePrice,
    })
    // Add qty times
    for (let i = 1; i < qty; i++) {
      addItem({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantId: selectedVariantId,
        variantName: selectedVariant?.name,
        priceInCents: effectivePrice,
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden">

      {/* Header */}
      <div className="bg-[#35291C] px-8 py-5">
        <h1
          className="text-[#E8E6D8] leading-tight"
          style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
        >
          {product.name}
        </h1>
      </div>
      <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

      <div className="p-8 space-y-6">

        {/* Image placeholder */}
        <div className="bg-[#f5f2e8] border border-[#e8e4d0] rounded-lg h-64 flex items-center justify-center">
          <span className="text-7xl text-[#c8c4a8]">☕</span>
        </div>

        {/* Description */}
        {product.description && (
          <p className="font-baskerville italic text-[#4B4C44] leading-relaxed text-base">
            {product.description}
          </p>
        )}

        <div className="border-t border-[#e8e4d0] pt-6 space-y-5">

          {/* Variants */}
          {product.variants.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-[#35291C] mb-2">Option</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                      selectedVariantId === v.id
                        ? 'border-[#35291C] bg-[#35291C] text-[#E8E6D8] font-semibold'
                        : 'border-[#c8c4a8] text-[#4B4C44] hover:border-[#35291C]'
                    }`}
                  >
                    {v.name}
                    {v.priceInCents && v.priceInCents !== product.priceInCents && (
                      <span className="ml-1 opacity-70">+{formatPrice(v.priceInCents - product.priceInCents, currency)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price & quantity */}
          <div className="flex items-end gap-6">
            <div>
              <div className="text-xs text-[#C4AB77] uppercase tracking-widest mb-1">Price</div>
              <div className="font-playfair text-3xl text-[#35291C]">
                {formatPrice(effectivePrice, currency)}
              </div>
              {product.compareAtCents && product.compareAtCents > effectivePrice && (
                <div className="text-sm text-[#4B4C44] line-through opacity-60">
                  {formatPrice(product.compareAtCents, currency)}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs text-[#C4AB77] uppercase tracking-widest mb-1">Quantity</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded border border-[#c8c4a8] text-[#35291C] hover:border-[#35291C] transition-colors text-lg font-semibold"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold text-[#35291C]">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 rounded border border-[#c8c4a8] text-[#35291C] hover:border-[#35291C] transition-colors text-lg font-semibold"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to cart */}
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={`flex-1 py-3 text-sm font-semibold rounded transition-colors ${
                added
                  ? 'bg-[#5a7a2e] text-white'
                  : outOfStock
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#C4AB77] text-white hover:bg-[#7a5c12]'
              }`}
            >
              {outOfStock ? 'Out of stock' : added ? '✓ Added to cart' : 'Add to cart'}
            </button>
            <Link
              href="/shop/cart"
              className="px-5 py-3 border-2 border-[#35291C] text-[#35291C] text-sm font-semibold rounded hover:bg-[#f5f2e8] transition-colors"
            >
              View cart
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
