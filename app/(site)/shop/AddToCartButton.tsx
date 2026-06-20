'use client'

import { useState } from 'react'
import { useCart } from '@/components/site/CartContext'

interface Props {
  product: { id: string; slug: string; name: string; priceInCents: number }
  variantId?: string
  variantName?: string
}

export function AddToCartButton({ product, variantId, variantName }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId,
      variantName,
      priceInCents: product.priceInCents,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAdd}
      className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
        added
          ? 'bg-[#5a7a2e] text-white'
          : 'bg-[#35291C] text-[#E8E6D8] hover:bg-[#35291C]'
      }`}
    >
      {added ? '✓ Added' : 'Add to cart'}
    </button>
  )
}
