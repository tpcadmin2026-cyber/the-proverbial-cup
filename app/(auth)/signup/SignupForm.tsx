'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const f = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sign-up failed')
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
        <h2 className="font-bold text-[#35291C]">Account created</h2>
        <p className="text-sm text-[#4B4C44]">
          A verification link has been sent to <strong>{form.email}</strong>.
          Please check your inbox — or your terminal if you are running locally — and click
          the link to activate your account.
        </p>
        <button
          onClick={() => router.push(plan ? `/login?redirect=/subscribe/${plan}` : '/login')}
          className="mt-4 w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          Go to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Full name</label>
        <input
          type="text" required autoComplete="name"
          value={form.name} onChange={(e) => f('name', e.target.value)}
          className="input" placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Email address</label>
        <input
          type="email" required autoComplete="email"
          value={form.email} onChange={(e) => f('email', e.target.value)}
          className="input" placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Password</label>
        <input
          type="password" required autoComplete="new-password"
          value={form.password} onChange={(e) => f('password', e.target.value)}
          className="input" placeholder="At least 8 characters, one uppercase, one number"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">Confirm password</label>
        <input
          type="password" required autoComplete="new-password"
          value={form.confirm} onChange={(e) => f('confirm', e.target.value)}
          className="input" placeholder="Repeat your password"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit" disabled={loading}
        className="w-full py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-xs text-center text-gray-400">
        By creating an account you agree to our{' '}
        <a href="/terms" className="text-[#C4AB77] hover:underline">Terms</a> and{' '}
        <a href="/privacy" className="text-[#C4AB77] hover:underline">Privacy Policy</a>.
      </p>
    </form>
  )
}
