'use client'

import { useState } from 'react'

interface Props {
  successMessage: string
  prefillEmail?: string
}

export function SupportForm({ successMessage, prefillEmail }: Props) {
  const [form, setForm] = useState({ name: '', email: prefillEmail ?? '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [ticketId, setTicketId] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setTicketId(data.ticketId ?? '')
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
        <p className="font-playfair text-lg text-[#35291C] mb-2">Request Submitted</p>
        <p className="font-baskerville italic text-[#4B4C44]">{successMessage}</p>
        {ticketId && (
          <p className="mt-4 text-sm text-[#4B4C44]">
            Reference:{' '}
            <a href={`/support/${ticketId}`} className="text-[#C4AB77] hover:underline font-semibold">
              #{ticketId.slice(-8).toUpperCase()}
            </a>
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Your name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Email <span className="text-[#7A564C]">*</span></label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Subject <span className="text-[#7A564C]">*</span></label>
        <input
          type="text"
          required
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
          placeholder="Brief description of your issue"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Message <span className="text-[#7A564C]">*</span></label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77] resize-none"
          placeholder="Describe your issue in as much detail as possible…"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-[#7A564C] bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-[#35291C] text-[#E8E6D8] py-3 rounded font-semibold text-sm tracking-wide hover:bg-[#4B4C44] transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Submit Request'}
      </button>
    </form>
  )
}
