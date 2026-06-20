'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SeoPanel } from '@/components/admin/SeoPanel'

interface Variant {
  id?: string
  name: string
  priceInCents: number | null
  inventory: number | null
  stripePriceId: string | null
}

interface Product {
  id: string
  slug: string
  name: string
  category: string
  description: string | null
  priceInCents: number
  compareAtCents: number | null
  images: string | null
  stripeProductId: string | null
  inventory: number | null
  lowStockAlert: number | null
  visible: boolean
  displayOrder: number
  variants: Variant[]
}

interface Props {
  product: Product | null
}

export function ProductEditor({ product }: Props) {
  const router = useRouter()
  const isNew = !product

  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [priceInCents, setPriceInCents] = useState<number | ''>(
    product ? product.priceInCents : ''
  )
  const [compareAtCents, setCompareAtCents] = useState<number | ''>(
    product?.compareAtCents ?? ''
  )
  const [inventory, setInventory] = useState<number | ''>(product?.inventory ?? '')
  const [lowStockAlert, setLowStockAlert] = useState<number | ''>(product?.lowStockAlert ?? '')
  const [stripeProductId, setStripeProductId] = useState(product?.stripeProductId ?? '')
  const [visible, setVisible] = useState(product?.visible ?? true)
  const [displayOrder, setDisplayOrder] = useState(product?.displayOrder ?? 0)
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  function handleNameChange(val: string) {
    setName(val)
    if (isNew) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function addVariant() {
    setVariants((v) => [...v, { name: '', priceInCents: null, inventory: null, stripePriceId: '' }])
  }

  function updateVariant(index: number, field: keyof Variant, value: unknown) {
    setVariants((v) => v.map((vt, i) => i === index ? { ...vt, [field]: value } : vt))
  }

  function removeVariant(index: number) {
    setVariants((v) => v.filter((_, i) => i !== index))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        id: product?.id,
        name,
        slug,
        category: category || '',
        description: description || null,
        priceInCents: Number(priceInCents) || 0,
        compareAtCents: compareAtCents !== '' ? Number(compareAtCents) : null,
        inventory: inventory !== '' ? Number(inventory) : null,
        lowStockAlert: lowStockAlert !== '' ? Number(lowStockAlert) : null,
        stripeProductId: stripeProductId || null,
        visible,
        displayOrder: Number(displayOrder),
        variants: variants.map(({ id: _id, ...v }) => ({
          ...v,
          // strip id from new variants (created via PUT replace strategy)
          priceInCents: v.priceInCents !== null ? Number(v.priceInCents) : null,
          inventory: v.inventory !== null ? Number(v.inventory) : null,
          stripePriceId: v.stripePriceId || null,
        })),
      }
      const res = await fetch('/api/admin/products', {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to save product.')
      }
      router.push('/admin/store/products')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!product) return
    if (!confirm('Delete this product permanently? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/admin/products?id=${product.id}`, { method: 'DELETE' })
    router.push('/admin/store/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="p-8 max-w-3xl space-y-6">

      {/* Core details */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Product details</h2>

        <Field label="Product name" helpText="Shown to customers in the shop and on order confirmations.">
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="Ethiopian Yirgacheffe — 250g"
            className="input"
          />
        </Field>

        <Field label="Slug" helpText="URL-safe identifier — auto-generated from the name. Used in the shop URL: /shop/your-slug.">
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="ethiopian-yirgacheffe-250g"
              className="input font-mono flex-1"
            />
            {product && slug && (
              <a
                href={`/shop/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-xs font-semibold text-[#C4AB77] border border-[#C4AB77] rounded hover:bg-amber-50 transition-colors whitespace-nowrap"
              >
                Preview ↗
              </a>
            )}
          </div>
        </Field>

        <Field label="Category" helpText="Group products in the shop — e.g. Coffee, Tea, Equipment, Gifts. Leave blank for uncategorised.">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Coffee"
            list="category-suggestions"
            className="input"
          />
          <datalist id="category-suggestions">
            <option value="Coffee" />
            <option value="Tea" />
            <option value="Equipment" />
            <option value="Gifts" />
            <option value="Subscriptions" />
            <option value="Accessories" />
          </datalist>
        </Field>

        <Field label="Description" helpText="Shown on the product detail page. Supports basic markdown: **bold**, *italic*, bullet lists.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="A vibrant, fruity coffee from the highlands of Ethiopia…"
            className="input resize-y"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (£)" helpText="The selling price in pounds — e.g. 12.50.">
            <input
              type="number"
              min={0}
              step={0.01}
              value={priceInCents !== '' ? priceInCents / 100 : ''}
              onChange={(e) => setPriceInCents(e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')}
              required
              placeholder="12.50"
              className="input"
            />
          </Field>
          <Field label="Compare-at price (£)" helpText="Original / was price shown as a strikethrough. Leave blank if not on sale.">
            <input
              type="number"
              min={0}
              step={0.01}
              value={compareAtCents !== '' ? compareAtCents / 100 : ''}
              onChange={(e) => setCompareAtCents(e.target.value ? Math.round(parseFloat(e.target.value) * 100) : '')}
              placeholder="15.00"
              className="input"
            />
          </Field>
        </div>
      </section>

      {/* Inventory */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Inventory</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stock level" helpText="How many units you have. Leave blank if you don't track stock.">
            <input
              type="number"
              min={0}
              value={inventory}
              onChange={(e) => setInventory(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="50"
              className="input"
            />
          </Field>
          <Field label="Low-stock alert threshold" helpText="Show a low-stock warning in the admin when stock falls to this number.">
            <input
              type="number"
              min={0}
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(e.target.value ? parseInt(e.target.value) : '')}
              placeholder="5"
              className="input"
            />
          </Field>
        </div>
      </section>

      {/* Variants */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Variants</h2>
            <p className="text-xs text-gray-500 mt-0.5">Optional — use for sizes, grinds, or bundle options. Leave empty for a single-option product.</p>
          </div>
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-1.5 text-xs font-semibold text-[#C4AB77] border border-[#C4AB77] rounded hover:bg-amber-50 transition-colors"
          >
            + Add variant
          </button>
        </div>
        {variants.length === 0 && (
          <p className="text-xs text-gray-400 py-2">No variants — customers buy the product as-is.</p>
        )}
        {variants.map((v, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 items-start border border-gray-100 rounded p-3">
            <div className="col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Variant name</label>
              <input
                type="text"
                value={v.name}
                onChange={(e) => updateVariant(i, 'name', e.target.value)}
                placeholder="Whole bean — 250g"
                className="input text-xs"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price (£, optional)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={v.priceInCents !== null ? v.priceInCents / 100 : ''}
                onChange={(e) => updateVariant(i, 'priceInCents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                placeholder="Inherits"
                className="input text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stock</label>
              <input
                type="number"
                min={0}
                value={v.inventory ?? ''}
                onChange={(e) => updateVariant(i, 'inventory', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="—"
                className="input text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe Price ID</label>
              <input
                type="text"
                value={v.stripePriceId ?? ''}
                onChange={(e) => updateVariant(i, 'stripePriceId', e.target.value || null)}
                placeholder="price_…"
                className="input text-xs font-mono"
              />
            </div>
            <div className="col-span-1 pt-5">
              <button
                type="button"
                onClick={() => removeVariant(i)}
                className="text-xs text-red-400 hover:text-red-600"
                title="Remove variant"
              >✕</button>
            </div>
          </div>
        ))}
      </section>

      {/* Stripe & visibility */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Stripe & visibility</h2>

        <Field label="Stripe Product ID" helpText="Optional — paste the prod_… ID from Stripe. Used to link this product to a Stripe product for payment processing.">
          <input
            type="text"
            value={stripeProductId}
            onChange={(e) => setStripeProductId(e.target.value)}
            placeholder="prod_…"
            className="input font-mono"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Display order" helpText="Lower numbers appear first in the shop. Use whole numbers — e.g. 1, 2, 3.">
            <input
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              className="input"
            />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisible(e.target.checked)}
                className="accent-[#C4AB77]"
              />
              <span className="text-sm text-gray-700">Visible in the shop</span>
            </label>
          </div>
        </div>
      </section>

      {/* SEO — only shown when editing an existing product */}
      {product && (
        <SeoPanel
          contentType="product"
          contentId={product.id}
          defaultTitle={name}
          defaultDescription={description.replace(/[#*_\[\]]/g, '').slice(0, 160)}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/store/products')}
          className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Cancel
        </button>
        {product && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto px-4 py-2 text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete product'}
          </button>
        )}
      </div>

      {!product && (
        <p className="text-xs text-gray-400">After saving, you can add SEO settings from the product edit page.</p>
      )}
    </form>
  )
}

function Field({ label, helpText, children }: { label: string; helpText?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-0.5">{label}</label>
      {helpText && <p className="text-xs text-gray-500 mb-1">{helpText}</p>}
      {children}
    </div>
  )
}
