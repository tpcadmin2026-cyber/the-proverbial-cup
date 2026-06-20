'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AcceptInviteForm({ token, email, role }: { token: string; email: string; role: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, role, name: form.name, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to accept invitation')
      router.push('/admin')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Your name</label>
        <input
          type="text" required value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="input" placeholder="Your full name"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Email</label>
        <input type="email" value={email} disabled className="input bg-gray-50 text-gray-400" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Create a password</label>
        <input
          type="password" required value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="input" placeholder="At least 8 characters, one uppercase, one number"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Confirm password</label>
        <input
          type="password" required value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          className="input" placeholder="Repeat your password"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Setting up account…' : 'Accept invitation & sign in'}
      </button>
    </form>
  )
}
