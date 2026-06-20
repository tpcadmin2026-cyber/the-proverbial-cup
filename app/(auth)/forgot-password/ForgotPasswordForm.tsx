'use client'

import { useState } from 'react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      // Always show success — don't reveal whether the email exists
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="text-3xl text-[#C4AB77]">✦</div>
        <p className="text-sm text-[#4B4C44]">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
          Please check your inbox — or your terminal if running locally.
        </p>
        <p className="text-xs text-gray-400">The link expires in 30 minutes.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Email address</label>
        <input
          type="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input" placeholder="you@example.com"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
