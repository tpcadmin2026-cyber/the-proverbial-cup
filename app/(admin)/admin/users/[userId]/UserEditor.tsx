'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SubscriptionPlan } from '@prisma/client'

const ROLES = ['subscriber', 'customer', 'employee', 'manager', 'admin', 'master_admin']
const ROLE_DESCRIPTIONS: Record<string, string> = {
  master_admin: 'Full access including IT panels',
  admin:        'Full operations — no IT panels',
  manager:      'Content, orders, support, subscribers',
  employee:     'Frontline — support, drafts, orders',
  subscriber:   'Site member with active subscription',
  customer:     'One-off purchaser, no subscription',
}

interface Props {
  user: { id: string; name: string; role: string }
  plans: SubscriptionPlan[]
  subscription: { planId: string; status: string } | null
}

export function UserEditor({ user, plans, subscription }: Props) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState(user.role)
  const [planId, setPlanId] = useState(subscription?.planId ?? '')
  const [subStatus, setSubStatus] = useState(subscription?.status ?? 'active')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, planId: planId || null, subStatus: subscription ? subStatus : undefined }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save.')
      }
      setSaved(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Edit user</h3>
      </div>
      <div className="p-5 space-y-4">

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.replace('_', ' ')} — {ROLE_DESCRIPTIONS[r]}</option>
            ))}
          </select>
        </div>

        {plans.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Subscription plan <span className="font-normal text-gray-400">(assign or change manually)</span>
            </label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
            >
              <option value="">No subscription</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {subscription && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subscription status</label>
            <select
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
            >
              {['active', 'paused', 'cancelled', 'past_due', 'trialing'].map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        </div>
      </div>
    </div>
  )
}
