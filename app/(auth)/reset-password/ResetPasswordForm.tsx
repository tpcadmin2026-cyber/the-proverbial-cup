'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to reset password')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="text-3xl text-[#C4AB77]">✦</div>
        <p className="text-sm text-[#4B4C44]">Your password has been updated successfully.</p>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          Sign in with new password
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">New password</label>
        <input
          type="password" required autoComplete="new-password"
          value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="input" placeholder="At least 8 characters, one uppercase, one number"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Confirm new password</label>
        <input
          type="password" required autoComplete="new-password"
          value={form.confirm} onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          className="input" placeholder="Repeat your new password"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  )
}
