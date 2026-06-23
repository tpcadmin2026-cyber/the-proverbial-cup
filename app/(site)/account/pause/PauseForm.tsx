'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Props {
  planName: string
  maxPauseDays: number
  currentStatus: string
}

export function PauseForm({ planName, maxPauseDays }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'pick' | 'confirm' | 'done'>('pick')
  const [resumeDate, setResumeDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate min/max dates
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 1)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + (maxPauseDays > 0 ? maxPauseDays : 180))

  const minStr = minDate.toISOString().split('T')[0]
  const maxStr = maxDate.toISOString().split('T')[0]

  function formatDisplay(iso: string) {
    if (!iso) return ''
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/account/subscription/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to pause subscription')
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
          <div className="bg-[#35291C] px-8 py-5 text-center">
            <div className="text-[#C4AB77] text-sm tracking-widest mb-1">Subscription Management</div>
            <h1 className="font-playfair text-xl text-[#E8E6D8] tracking-wide">Pause Your Subscription</h1>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          <div className="px-8 py-7">

            {step === 'pick' && (
              <div className="space-y-5">
                <p className="font-baskerville italic text-[#4B4C44] leading-relaxed">
                  Your <strong>{planName}</strong> subscription will be paused until the date you select.
                  No charge will be made during the pause period.
                </p>
                <div>
                  <label className="block text-sm font-semibold text-[#35291C] mb-2">
                    Resume deliveries on
                  </label>
                  <input
                    type="date"
                    value={resumeDate}
                    min={minStr}
                    max={maxStr}
                    onChange={(e) => setResumeDate(e.target.value)}
                    className="input"
                  />
                  {maxPauseDays > 0 && (
                    <p className="text-xs text-[#C4AB77] mt-1">
                      Maximum pause length: {maxPauseDays} days
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!resumeDate}
                  className="w-full py-3 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
                <p className="text-center text-xs">
                  <Link href="/account/cancel" className="text-[#7A564C] hover:underline">
                    I'd rather cancel my subscription
                  </Link>
                </p>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-5">
                <div className="border border-[#c8c4a8] rounded-lg p-5 bg-[#faf9f5] text-center">
                  <p className="text-sm text-[#4B4C44] mb-1">Your subscription will pause until</p>
                  <p className="font-playfair text-lg text-[#35291C]">{formatDisplay(resumeDate)}</p>
                </div>
                <p className="font-baskerville italic text-[#4B4C44] text-sm text-center leading-relaxed">
                  You will receive a reminder email before your subscription resumes.
                  You may cancel or adjust the pause at any time from your account.
                </p>
                {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('pick')}
                    className="flex-1 py-2.5 border border-[#c8c4a8] rounded text-sm text-[#4B4C44] hover:border-[#35291C] transition-colors"
                  >
                    Change date
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Pausing…' : 'Confirm pause'}
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center space-y-4">
                <div className="text-3xl text-[#C4AB77]">✦</div>
                <h2 className="font-playfair text-xl text-[#35291C]">Subscription Paused</h2>
                <p className="font-baskerville italic text-[#4B4C44] leading-relaxed">
                  Your subscription has been paused. Deliveries will resume on{' '}
                  <strong>{formatDisplay(resumeDate)}</strong>. We shall send a reminder beforehand.
                </p>
                <button
                  onClick={() => router.push('/account')}
                  className="mt-4 px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
                >
                  Return to account
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
