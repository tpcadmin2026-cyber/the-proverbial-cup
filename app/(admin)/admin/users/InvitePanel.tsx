'use client'

import { useState } from 'react'

export function InvitePanel() {
  const [form, setForm] = useState({ email: '', role: 'admin' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setResult({ link: data.link })
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Invite a team member</h2>
      <p className="text-xs text-gray-500 mb-4">
        Send an invitation to give someone admin access. They will receive a link to create their account.
        Until Resend is connected, the invite link appears here for you to copy and send manually.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email address</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="input" placeholder="colleague@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
          <select
            value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="input w-40"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="master_admin">Master Admin</option>
          </select>
        </div>
        <button
          type="submit" disabled={loading}
          className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Sending…' : 'Send invitation'}
        </button>
      </form>

      {result?.error && (
        <p className="mt-3 text-sm text-red-600">{result.error}</p>
      )}

      {result?.link && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            ✓ Invitation created — copy this link and send it to {form.email}:
          </p>
          <div className="flex gap-2">
            <input
              type="text" readOnly value={result.link}
              className="input text-xs font-mono bg-white flex-1"
            />
            <button
              onClick={() => navigator.clipboard.writeText(result.link!)}
              className="px-3 py-1.5 text-xs bg-amber-800 text-white rounded hover:bg-amber-900 transition-colors whitespace-nowrap"
            >
              Copy link
            </button>
          </div>
          <p className="text-xs text-amber-700 mt-2">This link expires in 72 hours.</p>
        </div>
      )}
    </section>
  )
}
