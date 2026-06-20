'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Reason { id: string; label: string; allowFreeText: boolean }

interface Props {
  planName: string
  reasons: Reason[]
}

export function CancelForm({ planName, reasons }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'reason' | 'confirm' | 'done'>('reason')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [freeText, setFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = reasons.find((r) => r.id === selectedId)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reasonId: selectedId,
          reasonLabel: selected?.label,
          freeText: selected?.allowFreeText ? freeText : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to cancel subscription')
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-lg mx-auto">
        <Link href="/account" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
          ← Back to account
        </Link>

        <div className="mt-6 bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden">
          <div className="bg-[#7A564C] px-8 py-5 text-center">
            <div className="text-red-300 text-sm tracking-widest mb-1">Subscription Management</div>
            <h1 className="font-playfair text-xl text-[#E8E6D8] tracking-wide">Cancel Subscription</h1>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#5a1212] via-[#7A564C] to-[#5a1212]" />

          <div className="px-8 py-7">

            {step === 'reason' && (
              <div className="space-y-5">
                <p className="font-baskerville italic text-[#4B4C44] leading-relaxed">
                  We are sorry to hear you wish to cancel your <strong>{planName}</strong> subscription.
                  Before you go, would you share your reason?
                </p>

                <div className="space-y-2">
                  {reasons.map((r) => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedId === r.id
                          ? 'border-[#7A564C] bg-red-50'
                          : 'border-[#e8e4d0] hover:border-[#c8c4a8] hover:bg-[#faf9f5]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.id}
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                        className="accent-[#7A564C]"
                      />
                      <span className="text-sm text-[#35291C]">{r.label}</span>
                    </label>
                  ))}
                </div>

                {selected?.allowFreeText && (
                  <div>
                    <label className="block text-sm font-semibold text-[#35291C] mb-1">
                      Please tell us more (optional)
                    </label>
                    <textarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      rows={3}
                      className="input resize-none"
                      placeholder="Any additional details would be most helpful…"
                    />
                  </div>
                )}

                <button
                  onClick={() => setStep('confirm')}
                  disabled={!selectedId}
                  className="w-full py-3 bg-[#7A564C] text-white text-sm font-semibold rounded hover:bg-[#6a1818] transition-colors disabled:opacity-40"
                >
                  Continue to cancellation
                </button>
                <p className="text-center text-xs">
                  <Link href="/account/pause" className="text-[#C4AB77] hover:underline">
                    Actually, I'd prefer to pause instead
                  </Link>
                </p>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-5">
                <div className="border border-red-200 rounded-lg p-5 bg-red-50 text-center">
                  <p className="text-sm font-semibold text-red-800 mb-1">This will cancel your subscription</p>
                  <p className="text-xs text-red-600">
                    Your <strong>{planName}</strong> subscription will end. You will lose access to subscriber benefits.
                  </p>
                </div>
                <p className="font-baskerville italic text-[#4B4C44] text-sm text-center leading-relaxed">
                  Your subscription will remain active until the end of the current billing period.
                  You can re-subscribe at any time.
                </p>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('reason')}
                    className="flex-1 py-2.5 border border-[#c8c4a8] rounded text-sm text-[#4B4C44] hover:border-[#35291C] transition-colors"
                  >
                    Go back
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#7A564C] text-white text-sm font-semibold rounded hover:bg-[#6a1818] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Cancelling…' : 'Yes, cancel subscription'}
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center space-y-4">
                <div className="text-3xl text-[#C4AB77]">✦</div>
                <h2 className="font-playfair text-xl text-[#35291C]">Subscription Cancelled</h2>
                <p className="font-baskerville italic text-[#4B4C44] leading-relaxed">
                  Your subscription has been cancelled. We are sorry to see you go, and hope
                  we may welcome you back to The Gazette in future.
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => router.push('/account')}
                    className="px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
                  >
                    Return to account
                  </button>
                  <Link
                    href="/pricing"
                    className="text-xs text-[#C4AB77] hover:underline text-center"
                  >
                    View subscription plans
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
