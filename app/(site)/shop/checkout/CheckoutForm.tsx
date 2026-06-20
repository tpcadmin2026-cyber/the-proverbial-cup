'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/site/CartContext'

interface FormData {
  name: string
  email: string
  address1: string
  address2: string
  city: string
  postcode: string
  country: string
}

function formatPrice(cents: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(cents / 100)
}

const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export function CheckoutForm() {
  const router = useRouter()
  const { items, totalCents, clear } = useCart()

  const [form, setForm] = useState<FormData>({
    name: '', email: '', address1: '', address2: '',
    city: '', postcode: '', country: 'GB',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  const f = (key: keyof FormData, val: string) => setForm((p) => ({ ...p, [key]: val }))

  if (items.length === 0 && !orderId) {
    return (
      <div className="min-h-screen py-16 px-6" style={{ backgroundColor: '#E8E6D8', backgroundImage: grain, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}>
        <div className="max-w-lg mx-auto text-center py-20 space-y-4">
          <p className="font-baskerville italic text-[#4B4C44] text-lg">Your cart is empty. Please add items before proceeding to checkout.</p>
          <Link href="/shop" className="inline-block px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors">
            Browse the Emporium
          </Link>
        </div>
      </div>
    )
  }

  if (orderId) {
    return (
      <div className="min-h-screen py-16 px-6" style={{ backgroundColor: '#E8E6D8', backgroundImage: grain, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}>
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden">
            <div className="bg-[#35291C] px-8 py-5 text-center">
              <h1 className="font-playfair text-xl text-[#E8E6D8]">Order Received</h1>
            </div>
            <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
            <div className="px-8 py-10 text-center space-y-4">
              <div className="text-4xl text-[#C4AB77]">✦</div>
              <h2 className="font-playfair text-2xl text-[#35291C]">Thank you, {form.name.split(' ')[0]}</h2>
              <p className="font-baskerville italic text-[#4B4C44] leading-relaxed">
                Your order has been received and is now in our capable hands.
                A confirmation shall be dispatched to <strong>{form.email}</strong> directly.
              </p>
              <p className="text-xs text-[#C4AB77] font-semibold">Order reference: {orderId.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-[#4B4C44] italic">
                Payment will be taken once our payment system is fully connected.
              </p>
              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
                >
                  Return to The Gazette
                </button>
                <Link href="/shop" className="text-xs text-[#C4AB77] hover:underline text-center">
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email,
          shippingAddress: {
            address1: form.address1,
            address2: form.address2,
            city: form.city,
            postcode: form.postcode,
            country: form.country,
          },
          lineItems: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            name: i.name,
            variantName: i.variantName,
            priceInCents: i.priceInCents,
            quantity: i.quantity,
          })),
          totalCents,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order')
      clear()
      setOrderId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-16 px-6" style={{ backgroundColor: '#E8E6D8', backgroundImage: grain, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/shop/cart" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
          ← Back to cart
        </Link>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* Form */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden">
              <div className="bg-[#35291C] px-6 py-4">
                <h1 className="font-playfair text-lg text-[#E8E6D8] tracking-wide">Shipping Details</h1>
              </div>
              <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#35291C] mb-1">Full name</label>
                  <input type="text" required value={form.name} onChange={(e) => f('name', e.target.value)} className="input" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#35291C] mb-1">Email address</label>
                  <input type="email" required value={form.email} onChange={(e) => f('email', e.target.value)} className="input" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#35291C] mb-1">Address line 1</label>
                  <input type="text" required value={form.address1} onChange={(e) => f('address1', e.target.value)} className="input" placeholder="Street address" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#35291C] mb-1">Address line 2 <span className="font-normal text-[#C4AB77]">(optional)</span></label>
                  <input type="text" value={form.address2} onChange={(e) => f('address2', e.target.value)} className="input" placeholder="Apartment, flat, etc." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#35291C] mb-1">City / Town</label>
                    <input type="text" required value={form.city} onChange={(e) => f('city', e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#35291C] mb-1">Postcode</label>
                    <input type="text" required value={form.postcode} onChange={(e) => f('postcode', e.target.value)} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#35291C] mb-1">Country</label>
                  <select value={form.country} onChange={(e) => f('country', e.target.value)} className="input">
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="AU">Australia</option>
                    <option value="CA">Canada</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="NL">Netherlands</option>
                    <option value="IE">Ireland</option>
                  </select>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c12] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Placing order…' : 'Place order'}
                  </button>
                  <p className="text-xs text-center text-[#4B4C44] mt-2 italic">
                    No payment is taken now — your order will be confirmed once Stripe is connected.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden sticky top-6">
              <div className="bg-[#35291C] px-5 py-3">
                <h2 className="font-playfair text-sm text-[#E8E6D8] tracking-wide">Order Summary</h2>
              </div>
              <div className="p-5 space-y-3">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId ?? ''}`} className="flex justify-between text-sm gap-2">
                    <span className="text-[#4B4C44] flex-1 leading-snug">
                      {item.name}
                      {item.variantName && <span className="text-[#C4AB77]"> · {item.variantName}</span>}
                      <span className="text-[#C4AB77]"> × {item.quantity}</span>
                    </span>
                    <span className="text-[#35291C] font-semibold whitespace-nowrap">
                      {formatPrice(item.priceInCents * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-[#e8e4d0] pt-3 flex justify-between font-semibold">
                  <span className="font-playfair text-sm text-[#4B4C44]">Total</span>
                  <span className="font-playfair text-lg text-[#35291C]">{formatPrice(totalCents)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
