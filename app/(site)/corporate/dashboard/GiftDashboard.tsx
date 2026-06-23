'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

interface Gift {
  id: string
  recipientEmail: string
  recipientName: string | null
  planName: string
  status: string
  note: string | null
  createdAt: string
  activatedAt: string | null
  expiresAt: string | null
}

interface Plan { id: string; name: string; priceMonthly: number | null }

interface Props {
  accountId: string
  gifts: Gift[]
  plans: Plan[]
  currency: string
}

function fmt(cents: number | null, currency: string) {
  if (cents == null) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

export function GiftDashboard({ accountId, gifts: initial, plans, currency }: Props) {
  const router = useRouter()
  const [gifts, setGifts] = useState(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ recipientEmail: '', recipientName: '', planId: plans[0]?.id ?? '', note: '' })
  const [addStatus, setAddStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [addError, setAddError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddStatus('saving')
    setAddError('')
    try {
      const res = await fetch(`/api/corporate/${accountId}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setGifts((prev) => [data.gift, ...prev])
      setForm({ recipientEmail: '', recipientName: '', planId: plans[0]?.id ?? '', note: '' })
      setShowAdd(false)
      setAddStatus('idle')
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Something went wrong.')
      setAddStatus('error')
    }
  }

  async function handleCancel(giftId: string) {
    if (!confirm('Cancel this gift subscription?')) return
    await fetch(`/api/corporate/${accountId}/gifts/${giftId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    setGifts((prev) => prev.map((g) => g.id === giftId ? { ...g, status: 'cancelled' } : g))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-playfair text-xl text-[#35291C]">Gift Subscriptions</h2>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="bg-[#35291C] text-[#E8E6D8] px-4 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors"
        >
          {showAdd ? 'Cancel' : '+ Add Gift'}
        </button>
      </div>

      {/* Add gift form */}
      {showAdd && (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-6">
          <h3 className="font-playfair text-base text-[#35291C] mb-4">Send a Gift Subscription</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Recipient email <span className="text-[#7A564C]">*</span></label>
                <input
                  type="email"
                  required
                  value={form.recipientEmail}
                  onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                  className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
                  placeholder="recipient@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Recipient name</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
                  placeholder="John Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Plan <span className="text-[#7A564C]">*</span></label>
              <select
                value={form.planId}
                onChange={(e) => setForm({ ...form, planId: e.target.value })}
                className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {fmt(p.priceMonthly, currency)}/mo</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Personal note</label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] resize-none"
                placeholder="A short message to include with the gift notification…"
              />
            </div>

            {addStatus === 'error' && <p className="text-sm text-[#7A564C]">{addError}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={addStatus === 'saving'}
                className="bg-[#35291C] text-[#E8E6D8] px-5 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors disabled:opacity-60"
              >
                {addStatus === 'saving' ? 'Sending…' : 'Send Gift'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded text-sm text-[#4B4C44] border border-[#c8c4a8] hover:bg-[#f5f2e8] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gifts list */}
      {gifts.length === 0 ? (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
          <p className="font-baskerville italic text-[#4B4C44]">No gift subscriptions yet. Add your first recipient above.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#c8c4a8] rounded-lg divide-y divide-[#e8e4d0]">
          {gifts.map((g) => (
            <div key={g.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-playfair text-sm text-[#35291C]">{g.recipientName ?? g.recipientEmail}</p>
                {g.recipientName && <p className="text-xs text-[#C4AB77]">{g.recipientEmail}</p>}
                <p className="text-xs text-[#4B4C44] mt-0.5">{g.planName} · Added {format(new Date(g.createdAt), 'dd MMM yyyy')}</p>
                {g.note && <p className="text-xs text-[#4B4C44] italic mt-0.5">"{g.note}"</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_STYLES[g.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {g.status}
                </span>
                {g.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(g.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
