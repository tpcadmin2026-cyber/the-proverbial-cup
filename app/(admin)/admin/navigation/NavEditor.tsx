'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { NavItem } from '@prisma/client'

interface CmsPageRef { id: string; tabLabel: string; tabNumeral: string; pageOrder: number; published: boolean }

interface Props {
  navItems: NavItem[]
  pages: CmsPageRef[]
}

const QUICK_LINKS = [
  { label: 'Our Shop',       numeral: '⊡', href: '/shop'       },
  { label: 'Subscribe',      numeral: '★', href: '/pricing'     },
  { label: 'Help Desk',      numeral: '?', href: '/help'        },
  { label: 'Contact Us',     numeral: '✉', href: '/contact'     },
  { label: 'Newsletter',     numeral: '◎', href: '/newsletter'  },
  { label: 'Waitlist',       numeral: '◉', href: '/waitlist'    },
  { label: 'Find Your Plan', numeral: '✦', href: '/quiz'        },
  { label: 'My Account',     numeral: '◈', href: '/account'     },
]

export function NavEditor({ navItems: initial, pages }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<NavItem[]>(initial)
  const [saving, setSaving] = useState<string | null>(null)

  // All tabs in the order they'll appear: pages + nav items, sorted by their order values
  const allTabs = [
    ...pages.map(p => ({ kind: 'page' as const, id: p.id, label: p.tabLabel, numeral: p.tabNumeral, order: p.pageOrder, published: p.published })),
    ...items.map(n => ({ kind: 'link' as const, id: n.id, label: n.label, numeral: n.numeral, order: n.navOrder, href: n.href, visible: n.visible })),
  ].sort((a, b) => a.order - b.order)

  async function save(id: string, patch: Partial<NavItem>) {
    setSaving(id)
    await fetch(`/api/admin/navigation/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
    setSaving(null)
  }

  async function remove(id: string) {
    if (!confirm('Remove this navigation link?')) return
    await fetch(`/api/admin/navigation/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function addQuick(link: typeof QUICK_LINKS[0]) {
    const existing = items.find(i => i.href === link.href)
    if (existing) {
      await save(existing.id, { visible: true })
      return
    }
    const maxOrder = Math.max(0, ...items.map(i => i.navOrder))
    const res = await fetch('/api/admin/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...link, navOrder: maxOrder + 10 }),
    })
    const item = await res.json()
    setItems(prev => [...prev, item])
  }

  async function addCustom() {
    const maxOrder = Math.max(0, ...items.map(i => i.navOrder))
    const res = await fetch('/api/admin/navigation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'New Link', numeral: '→', href: '/page', navOrder: maxOrder + 10 }),
    })
    const item = await res.json()
    setItems(prev => [...prev, item])
  }

  return (
    <div className="max-w-4xl space-y-8">

      {/* Live preview of the tab order */}
      <div className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
        <div className="px-5 py-4">
          <div className="text-xs font-semibold text-[#C4AB77] uppercase tracking-widest mb-3">Tab order preview</div>
          <div className="text-xs text-[#C4AB77] mb-3">This shows how all tabs will appear in the navigation, left to right. Newspaper pages are shown in grey.</div>
          <div className="flex flex-wrap gap-2">
            {allTabs.map(tab => (
              <div
                key={tab.id}
                className={`px-3 py-1.5 rounded text-xs font-medium border ${
                  tab.kind === 'page'
                    ? 'bg-[#f5f2e8] border-[#c8c4a8] text-[#4B4C44]'
                    : tab.visible
                    ? 'bg-[#35291C] border-[#35291C] text-[#E8E6D8]'
                    : 'bg-white border-dashed border-[#c8c4a8] text-[#C4AB77]'
                }`}
              >
                <span className="opacity-60 mr-1">{tab.numeral}</span>
                {tab.label}
                {tab.kind === 'page' && !tab.published && <span className="ml-1 opacity-50">(draft)</span>}
                {tab.kind === 'link' && !tab.visible && <span className="ml-1 opacity-50">(hidden)</span>}
              </div>
            ))}
            {allTabs.length === 0 && <span className="text-xs text-[#C4AB77] italic">No tabs yet.</span>}
          </div>
        </div>
      </div>

      {/* Quick-add common pages */}
      <div className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
        <div className="px-5 py-4">
          <div className="text-xs font-semibold text-[#C4AB77] uppercase tracking-widest mb-1">Quick add</div>
          <div className="text-xs text-[#C4AB77] mb-3">Click to add a common page link to your navigation.</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map(link => {
              const exists = items.find(i => i.href === link.href)
              const isVisible = exists?.visible
              return (
                <button
                  key={link.href}
                  onClick={() => addQuick(link)}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    isVisible
                      ? 'bg-green-50 border-green-300 text-green-700 cursor-default'
                      : exists
                      ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                      : 'border-[#c8c4a8] text-[#4B4C44] hover:border-[#C4AB77] hover:text-[#C4AB77]'
                  }`}
                >
                  {isVisible ? '✓ ' : exists ? '↑ Show ' : '+ '}{link.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Nav item editor */}
      <div className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden">
        <div className="h-0.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
        <div className="px-5 py-4 border-b border-[#e8e4d0] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#C4AB77] uppercase tracking-widest">Navigation links</div>
            <div className="text-xs text-[#C4AB77] mt-0.5">Edit labels, order, and visibility. Order values interleave with page order numbers.</div>
          </div>
          <button
            onClick={addCustom}
            className="px-3 py-1.5 text-xs border border-[#C4AB77] text-[#C4AB77] rounded hover:bg-[#C4AB77] hover:text-white transition-colors"
          >
            + Custom link
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm font-baskerville italic text-[#C4AB77]">
            No navigation links yet. Use Quick Add above or add a custom link.
          </div>
        ) : (
          <div className="divide-y divide-[#f5f2e8]">
            {items.sort((a, b) => a.navOrder - b.navOrder).map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">

                {/* Visible toggle */}
                <button
                  onClick={() => save(item.id, { visible: !item.visible })}
                  title={item.visible ? 'Hide from nav' : 'Show in nav'}
                  className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center border transition-colors ${
                    item.visible ? 'border-green-300 bg-green-50 text-green-700' : 'border-[#c8c4a8] bg-white text-[#C4AB77]'
                  }`}
                >
                  {item.visible ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  )}
                </button>

                {/* Numeral */}
                <input
                  defaultValue={item.numeral}
                  onBlur={e => save(item.id, { numeral: e.target.value })}
                  title="Tab icon or short label"
                  className="w-10 text-center border border-[#c8c4a8] rounded px-1 py-1 text-sm focus:outline-none focus:border-[#C4AB77]"
                />

                {/* Label */}
                <input
                  defaultValue={item.label}
                  onBlur={e => save(item.id, { label: e.target.value })}
                  placeholder="Tab label"
                  className="flex-1 min-w-32 border border-[#c8c4a8] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#C4AB77]"
                />

                {/* URL */}
                <input
                  defaultValue={item.href}
                  onBlur={e => save(item.id, { href: e.target.value })}
                  placeholder="/page or https://..."
                  className="flex-1 min-w-40 border border-[#c8c4a8] rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-[#C4AB77] text-[#4B4C44]"
                />

                {/* Order */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[#C4AB77]">Order:</span>
                  <input
                    type="number"
                    defaultValue={item.navOrder}
                    onBlur={e => save(item.id, { navOrder: Number(e.target.value) })}
                    title="Lower number = appears earlier. Interleaves with page order."
                    className="w-16 border border-[#c8c4a8] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#C4AB77]"
                  />
                </div>

                {/* Open in new tab */}
                <label className="flex items-center gap-1.5 text-xs text-[#4B4C44] cursor-pointer" title="Open in new browser tab">
                  <input
                    type="checkbox"
                    checked={item.openInNewTab}
                    onChange={e => save(item.id, { openInNewTab: e.target.checked })}
                    className="accent-[#C4AB77]"
                  />
                  New tab
                </label>

                {/* Saving indicator */}
                {saving === item.id && <span className="text-xs text-[#C4AB77] italic">Saving…</span>}

                {/* Delete */}
                <button
                  onClick={() => remove(item.id)}
                  title="Remove link"
                  className="text-red-400 hover:text-red-600 transition-colors text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help note about page order interleaving */}
      <div className="bg-[#fdfbf5] border border-[#e8e4d0] rounded-lg px-5 py-4 text-xs text-[#4B4C44]">
        <strong className="text-[#C4AB77]">How order works:</strong> Newspaper pages have their own order numbers (Front Page = 1, second page = 2, etc.). Navigation links use the Order field above. A link with order 5 appears between page 4 and page 6. Use gaps of 10 between items so you have room to insert between them later.
      </div>
    </div>
  )
}
