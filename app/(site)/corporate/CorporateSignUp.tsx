'use client'

import { useState } from 'react'

interface Plan { id: string; name: string; priceMonthly: number | null; priceYearly: number | null }

interface Props {
  plans: Plan[]
  currency: string
}

function fmt(cents: number | null, currency: string) {
  if (cents == null) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

export function CorporateSignUp({ plans, currency }: Props) {
  const [form, setForm] = useState({ companyName: '', contactEmail: '', contactName: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      const res = await fetch('/api/corporate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setStatus('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-3xl text-[#C4AB77] mb-3">✦</div>
        <p className="font-playfair text-xl text-[#35291C] mb-2">Registration Received</p>
        <p className="font-baskerville italic text-[#4B4C44]">
          Thank you. Our team will be in touch at the email address provided within one working day to set up your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Company name <span className="text-[#7A564C]">*</span></label>
          <input
            type="text"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
            placeholder="Acme Ltd"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Your name</label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
            placeholder="Jane Smith"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Work email <span className="text-[#7A564C]">*</span></label>
        <input
          type="email"
          required
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
          placeholder="jane@company.com"
        />
      </div>

      {/* Plans overview */}
      {plans.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-2">Available plans</label>
          <div className="grid sm:grid-cols-3 gap-2">
            {plans.map((p) => (
              <div key={p.id} className="border border-[#c8c4a8] rounded p-3 text-center bg-[#faf9f4]">
                <p className="font-playfair text-sm text-[#35291C]">{p.name}</p>
                <p className="text-xs text-[#C4AB77] mt-0.5">{fmt(p.priceMonthly, currency)}/mo</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Anything else?</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] resize-none"
          placeholder="How many recipients, any special requirements, preferred start date…"
        />
      </div>

      {status === 'error' && <p className="text-sm text-[#7A564C]">{error}</p>}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-[#35291C] text-[#E8E6D8] py-3 rounded font-semibold text-sm tracking-wide hover:bg-[#4B4C44] transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting…' : 'Register Company'}
      </button>
    </form>
  )
}
