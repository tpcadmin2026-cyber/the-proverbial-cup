'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sign-in failed')

      if (redirect) {
        router.push(redirect)
      } else if (data.role === 'master_admin' || data.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/account')
      }
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
        <label className="block text-sm font-semibold text-gray-900 mb-1">Email address</label>
        <input
          type="email" required autoComplete="email"
          value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="input" placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Password</label>
        <input
          type="password" required autoComplete="current-password"
          value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="input" placeholder="Your password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
