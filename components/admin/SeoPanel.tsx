'use client'

import { useState, useEffect } from 'react'

interface SeoPanelProps {
  contentType: 'article' | 'product' | 'plan'
  contentId: string
  defaultTitle?: string
  defaultDescription?: string
}

interface SeoMeta {
  focusKeyword:   string
  altKeywords:    string
  seoTitle:       string
  seoDescription: string
  canonicalUrl:   string
  ogImage:        string
  noIndex:        boolean
  searchBoost:    number
}

const BOOST_OPTIONS = [
  { value: 0.25, label: '0.25× — Hidden (rarely surfaces)' },
  { value: 0.5,  label: '0.5× — Low priority' },
  { value: 1.0,  label: '1.0× — Normal (default)' },
  { value: 1.5,  label: '1.5× — Slightly elevated' },
  { value: 2.0,  label: '2.0× — High priority' },
  { value: 3.0,  label: '3.0× — Featured (always near top)' },
]

export function SeoPanel({ contentType, contentId, defaultTitle = '', defaultDescription = '' }: SeoPanelProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState('')
  const [meta, setMeta] = useState<SeoMeta>({
    focusKeyword: '', altKeywords: '', seoTitle: '', seoDescription: '',
    canonicalUrl: '', ogImage: '', noIndex: false, searchBoost: 1.0,
  })

  // Load existing SEO meta when panel is opened
  useEffect(() => {
    if (!open || !contentId) return
    fetch(`/api/admin/seo?contentType=${contentType}&contentId=${contentId}`)
      .then(r => r.json())
      .then(({ meta: m }) => { if (m) setMeta({ focusKeyword: m.focusKeyword ?? '', altKeywords: m.altKeywords ?? '', seoTitle: m.seoTitle ?? '', seoDescription: m.seoDescription ?? '', canonicalUrl: m.canonicalUrl ?? '', ogImage: m.ogImage ?? '', noIndex: m.noIndex ?? false, searchBoost: m.searchBoost ?? 1.0 }) })
      .catch(() => {})
  }, [open, contentType, contentId])

  const descLen = meta.seoDescription.length
  const titleLen = (meta.seoTitle || defaultTitle).length

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId, ...meta }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]'
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1'

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">SEO &amp; Search optimisation</p>
          <p className="text-xs text-gray-500 mt-0.5">Control how this content appears in search results — on your site and on Google.</p>
        </div>
        <span className="text-gray-400 text-lg ml-4">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">

          {/* Focus keyword */}
          <div>
            <label className={labelCls}>
              Focus keyword
              <span className="ml-2 font-normal normal-case text-gray-400">The single most important search term for this content</span>
            </label>
            <input type="text" value={meta.focusKeyword} onChange={e => setMeta(m => ({ ...m, focusKeyword: e.target.value }))} className={inputCls} placeholder="e.g. Ethiopian coffee subscription" />
            <p className="text-xs text-gray-400 mt-1">Exact matches to this keyword are ranked highest in search results.</p>
          </div>

          {/* Alt keywords */}
          <div>
            <label className={labelCls}>Secondary keywords <span className="font-normal normal-case text-gray-400">comma-separated</span></label>
            <input type="text" value={meta.altKeywords} onChange={e => setMeta(m => ({ ...m, altKeywords: e.target.value }))} className={inputCls} placeholder="e.g. single origin, specialty coffee, morning blend" />
          </div>

          {/* SEO title */}
          <div>
            <label className={labelCls}>
              SEO title
              <span className="ml-2 font-normal normal-case text-gray-400">Overrides the heading in browser tabs and Google results</span>
            </label>
            <input type="text" value={meta.seoTitle} onChange={e => setMeta(m => ({ ...m, seoTitle: e.target.value }))} className={inputCls} placeholder={defaultTitle} />
            <p className={`text-xs mt-1 ${titleLen > 60 ? 'text-amber-600' : 'text-gray-400'}`}>
              {titleLen}/60 characters {titleLen > 60 ? '— Google will truncate this' : '— ideal under 60'}
            </p>
          </div>

          {/* Meta description */}
          <div>
            <label className={labelCls}>
              Meta description
              <span className="ml-2 font-normal normal-case text-gray-400">The snippet shown in Google and site search results</span>
            </label>
            <textarea rows={3} value={meta.seoDescription} onChange={e => setMeta(m => ({ ...m, seoDescription: e.target.value }))} className={`${inputCls} resize-y`} placeholder={defaultDescription || 'Write a clear, enticing summary of what this page offers…'} />
            <p className={`text-xs mt-1 ${descLen > 160 ? 'text-amber-600' : descLen > 0 && descLen < 120 ? 'text-amber-500' : 'text-gray-400'}`}>
              {descLen}/160 characters {descLen > 160 ? '— Google will truncate this' : descLen > 0 && descLen < 120 ? '— aim for 120–160 characters' : '— ideal 120–160'}
            </p>
          </div>

          {/* OG Image */}
          <div>
            <label className={labelCls}>Social share image (OG image)</label>
            <input type="url" value={meta.ogImage} onChange={e => setMeta(m => ({ ...m, ogImage: e.target.value }))} className={inputCls} placeholder="https://… (1200×630 recommended)" />
          </div>

          {/* Canonical URL */}
          <div>
            <label className={labelCls}>Canonical URL <span className="font-normal normal-case text-gray-400">only needed if this content appears at multiple URLs</span></label>
            <input type="url" value={meta.canonicalUrl} onChange={e => setMeta(m => ({ ...m, canonicalUrl: e.target.value }))} className={inputCls} placeholder="https://yoursite.com/this-page" />
          </div>

          {/* Search boost */}
          <div>
            <label className={labelCls}>Search ranking boost</label>
            <select value={meta.searchBoost} onChange={e => setMeta(m => ({ ...m, searchBoost: parseFloat(e.target.value) }))} className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]">
              {BOOST_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Multiplies this item&apos;s relevance score. Use sparingly — boosting everything boosts nothing.</p>
          </div>

          {/* No-index */}
          <div className="flex items-start gap-3">
            <input type="checkbox" id={`noindex-${contentId}`} checked={meta.noIndex} onChange={e => setMeta(m => ({ ...m, noIndex: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#C4AB77] focus:ring-[#C4AB77]" />
            <div>
              <label htmlFor={`noindex-${contentId}`} className="text-sm font-medium text-gray-800 cursor-pointer">Hide from search engines and site search</label>
              <p className="text-xs text-gray-400">Adds noindex to the page and excludes it from your site&apos;s search results. Use for private or thin content.</p>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors">
              {saving ? 'Saving…' : 'Save SEO settings'}
            </button>
            {saved  && <span className="text-sm text-green-600">✓ Saved — search index updated</span>}
            {error  && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
