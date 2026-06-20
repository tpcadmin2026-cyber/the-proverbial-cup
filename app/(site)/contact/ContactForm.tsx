'use client'

import { useState } from 'react'

const GRAIN_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

interface Props {
  siteName: string
  heading: string
  subheading: string
  successMessage: string
  contactEmail: string
}

export function ContactForm({ siteName, heading, subheading, successMessage, contactEmail }: Props) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

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
      setStatus('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: GRAIN_BG,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block mb-6">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}>
              {siteName}
            </div>
          </a>
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
            <span className="text-[#C4AB77]">✦</span>
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
          </div>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">{heading}</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44] max-w-lg mx-auto">{subheading}</p>
          {contactEmail && (
            <p className="mt-3 text-sm text-[#4B4C44]">
              Or write directly to <a href={`mailto:${contactEmail}`} className="text-[#C4AB77] hover:underline">{contactEmail}</a>
            </p>
          )}
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#c8c4a8] rounded-lg shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          {status === 'success' ? (
            <div className="px-8 py-12 text-center">
              <div className="text-4xl text-[#C4AB77] mb-4">✦</div>
              <p className="font-playfair text-xl text-[#35291C] mb-2">Message Received</p>
              <p className="font-baskerville italic text-[#4B4C44] text-lg">{successMessage}</p>
              <a href="/" className="inline-block mt-6 text-sm text-[#C4AB77] hover:underline">
                ← Return to The Gazette
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">
                    Email address <span className="text-[#7A564C]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">
                  Subject <span className="text-[#7A564C]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
                  placeholder="Enquiry regarding my subscription"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">
                  Message <span className="text-[#7A564C]">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77] resize-none"
                  placeholder="Your message…"
                />
              </div>

              {status === 'error' && (
                <p className="text-sm text-[#7A564C] bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full bg-[#35291C] text-[#E8E6D8] py-3 rounded font-semibold text-sm tracking-wide hover:bg-[#35291C] transition-colors disabled:opacity-60"
              >
                {status === 'submitting' ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center mt-8 text-xs text-[#4B4C44] space-y-1">
          <p><a href="/" className="text-[#C4AB77] hover:underline">← Return to The Gazette</a></p>
          <p><a href="/help" className="text-[#C4AB77] hover:underline">Browse our Help Desk</a></p>
        </div>
      </div>
    </div>
  )
}
