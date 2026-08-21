'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SeoPanel } from '@/components/admin/SeoPanel'
import { RichTextEditor } from '@/components/site/RichTextEditor'
import { richTextToPlainText } from '@/lib/richText'

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
  stripePriceId: string | null
  inventory: number | null
  lowStockAlert: number | null
  visible: boolean
  displayOrder: number
  variants: Variant[]
}

interface Props {
  product: Product | null
  currency: string
}

function currencySymbol(currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? currency
}

export function ProductEditor({ product, currency }: Props) {
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
  const [images, setImages] = useState<string[]>(() => {
    if (!product?.images) return []
    try {
      const arr = JSON.parse(product.images)
      return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === 'string') : []
    } catch {
      return []
    }
  })
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadError, setImageUploadError] = useState('')
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

  async function handleImageUpload(file: File) {
    setImageUploading(true)
    setImageUploadError('')
    try {
      const presignRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Upload failed')
      await fetch(presignData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      setImages((prev) => [...prev, presignData.publicUrl])
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setImageUploading(false)
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function moveImageFirst(index: number) {
    setImages((prev) => {
      const next = [...prev]
      const [img] = next.splice(index, 1)
      next.unshift(img)
      return next
    })
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
        images: images.length > 0 ? JSON.stringify(images) : null,
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
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save product.')
      }
      if (json.stripeWarning) alert(json.stripeWarning)
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

        <Field label="Description" helpText="Shown on the product detail page.">
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="A vibrant, fruity coffee from the highlands of Ethiopia…"
            minHeight={160}
          />
        </Field>

        <Field label="Photos" helpText="The first photo is used everywhere this product is shown — the shop grid, the product page, and the Featured Products widget. Add more to give the product page a small gallery.">
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img + i} className="relative w-24 h-24 rounded border border-gray-200 overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-[#35291C] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Primary</span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {i !== 0 && (
                    <button type="button" onClick={() => moveImageFirst(i)} title="Make primary" className="text-white text-xs bg-white/20 hover:bg-white/30 rounded px-1.5 py-1">★</button>
                  )}
                  <button type="button" onClick={() => removeImage(i)} title="Remove" className="text-white text-xs bg-white/20 hover:bg-white/30 rounded px-1.5 py-1">✕</button>
                </div>
              </div>
            ))}
            <label className={`w-24 h-24 flex flex-col items-center justify-center gap-1 rounded border-2 border-dashed text-xs font-semibold transition-colors ${imageUploading ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-400 hover:border-[#C4AB77] hover:text-[#C4AB77] cursor-pointer'}`}>
              {imageUploading ? 'Uploading…' : (<><span className="text-xl leading-none">⬆</span>Add photo</>)}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={imageUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = '' }}
              />
            </label>
          </div>
          {imageUploadError && <p className="text-xs text-red-600 mt-2">{imageUploadError}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={`Price (${currencySymbol(currency)})`} helpText={`The selling price in ${currency} — e.g. 12.50.`}>
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
          <Field label={`Compare-at price (${currencySymbol(currency)})`} helpText="Original / was price shown as a strikethrough. Leave blank if not on sale.">
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Price ({currencySymbol(currency)}, optional)</label>
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">Stripe Price ID <span className="font-normal text-gray-400">(auto)</span></label>
              <input
                type="text"
                value={v.stripePriceId ?? ''}
                onChange={(e) => updateVariant(i, 'stripePriceId', e.target.value || null)}
                placeholder="auto-created on save"
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

        <Field label="Stripe Product ID" helpText="Created automatically in Stripe when you save — no need to touch this. Only paste a prod_… ID here if you want to link to a product that already exists in Stripe.">
          <input
            type="text"
            value={stripeProductId}
            onChange={(e) => setStripeProductId(e.target.value)}
            placeholder="auto-created on save"
            className="input font-mono"
          />
          {product?.stripePriceId && (
            <p className="text-xs text-gray-400 mt-1">Base price: <span className="font-mono">{product.stripePriceId}</span></p>
          )}
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
          defaultDescription={richTextToPlainText(description).slice(0, 160)}
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
