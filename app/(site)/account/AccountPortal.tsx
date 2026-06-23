'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Plan {
  name: string
  slug: string
  priceMonthly: number | null
  priceYearly: number | null
  features: string | null
  maxPauseDays: number
}

interface Subscription {
  status: string
  billingInterval: string
  currentPeriodEnd: string | null
  pauseResumesAt: string | null
  cancelledAt: string | null
  trialEndsAt: string | null
  plan: Plan
}

interface UserData {
  id: string
  email: string
  name: string | null
  notifyByEmail: boolean
  notifyBySms: boolean
  phoneNumber: string | null
}

interface Props {
  user: UserData
  subscription: Subscription | null
  siteName: string
  currency: string
}

type Tab = 'overview' | 'profile' | 'password' | 'danger'

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    trialing: 'bg-blue-100 text-blue-800',
    paused: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-orange-100 text-orange-800',
    cancelled: 'bg-red-100 text-red-800',
    past_due: 'bg-red-100 text-red-800',
  }
  return map[status] ?? 'bg-gray-100 text-gray-800'
}

// ── Billing portal button ─────────────────────────────────────────────────────

function BillingPortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/stripe/billing-portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'Billing portal unavailable')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={openPortal}
        disabled={loading}
        className="px-4 py-2 text-sm border border-[#C4AB77] text-[#C4AB77] rounded hover:bg-[#C4AB77] hover:text-white transition-colors disabled:opacity-50"
      >
        {loading ? 'Opening…' : 'Manage billing'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab({ subscription, currency, onNavigate }: {
  subscription: Subscription | null
  currency: string
  onNavigate: (tab: Tab) => void
}) {
  if (!subscription) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="text-[#C4AB77] text-4xl">✦</div>
        <h3 className="font-playfair text-xl text-[#35291C]">No Active Subscription</h3>
        <p className="font-baskerville italic text-[#4B4C44] max-w-sm mx-auto leading-relaxed">
          You do not currently hold a subscription to The Gazette.
          View our plans to commence your subscription.
        </p>
        <Link
          href="/pricing"
          className="inline-block mt-4 px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors"
        >
          View subscription plans
        </Link>
      </div>
    )
  }

  const features: string[] = subscription.plan.features ? JSON.parse(subscription.plan.features) : []

  return (
    <div className="space-y-6">
      {/* Plan summary */}
      <div className="border border-[#c8c4a8] rounded-lg overflow-hidden">
        <div className="bg-[#35291C] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#C4AB77] tracking-widest uppercase mb-0.5">Your Plan</div>
            <div className="font-playfair text-lg text-[#E8E6D8]">{subscription.plan.name}</div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusBadge(subscription.status)}`}>
            {subscription.status.replace('_', ' ')}
          </span>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#4B4C44]">Billing</span>
            <span className="text-[#35291C] font-medium capitalize">{subscription.billingInterval}</span>
          </div>
          {subscription.plan.priceMonthly != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#4B4C44]">
                {subscription.billingInterval === 'yearly' ? 'Annual charge' : 'Monthly charge'}
              </span>
              <span className="text-[#35291C] font-medium">
                {subscription.billingInterval === 'yearly' && subscription.plan.priceYearly
                  ? formatPrice(subscription.plan.priceYearly, currency)
                  : formatPrice(subscription.plan.priceMonthly, currency)}
              </span>
            </div>
          )}
          {subscription.currentPeriodEnd && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#4B4C44]">Next billing date</span>
              <span className="text-[#35291C] font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          )}
          {subscription.trialEndsAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#4B4C44]">Trial ends</span>
              <span className="text-[#5a7a2e] font-medium">{formatDate(subscription.trialEndsAt)}</span>
            </div>
          )}
          {subscription.pauseResumesAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#4B4C44]">Subscription resumes</span>
              <span className="text-[#C4AB77] font-medium">{formatDate(subscription.pauseResumesAt)}</span>
            </div>
          )}
          {subscription.status === 'pending' && (
            <p className="text-xs text-[#C4AB77] italic border-t border-[#e8e4d0] pt-3">
              Your subscription is reserved and will be activated once payment is set up.
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[#C4AB77] tracking-widest uppercase mb-3">
            What&apos;s included
          </h4>
          <ul className="space-y-1.5">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#35291C]">
                <span className="text-[#C4AB77] shrink-0">✦</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Manage actions */}
      {(subscription.status === 'active' || subscription.status === 'trialing') && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-[#e8e4d0]">
          <BillingPortalButton />
          <Link
            href="/account/pause"
            className="px-4 py-2 text-sm border border-[#c8c4a8] rounded text-[#4B4C44] hover:border-[#35291C] hover:bg-[#f5f2e8] transition-colors"
          >
            Pause subscription
          </Link>
          <Link
            href="/account/cancel"
            className="px-4 py-2 text-sm border border-[#c8c4a8] rounded text-[#4B4C44] hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            Cancel subscription
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Tab: Profile ──────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: UserData }) {
  const [form, setForm] = useState({
    name: user.name ?? '',
    phoneNumber: user.phoneNumber ?? '',
    notifyByEmail: user.notifyByEmail,
    notifyBySms: user.notifyBySms,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setMessage({ type: 'ok', text: 'Your details have been updated.' })
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-semibold text-[#35291C] mb-1">Full name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="input"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#35291C] mb-1">Email address</label>
        <input
          type="email"
          value={user.email}
          disabled
          className="input opacity-60 cursor-not-allowed"
        />
        <p className="text-xs text-[#C4AB77] mt-1">Email address cannot be changed here. Contact support if needed.</p>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#35291C] mb-1">Phone number (optional)</label>
        <input
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
          className="input"
          placeholder="+44 7700 000000"
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#35291C]">Notifications</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.notifyByEmail}
            onChange={(e) => setForm((p) => ({ ...p, notifyByEmail: e.target.checked }))}
            className="w-4 h-4 accent-[#C4AB77]"
          />
          <span className="text-sm text-[#4B4C44]">Email notifications</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.notifyBySms}
            onChange={(e) => setForm((p) => ({ ...p, notifyBySms: e.target.checked }))}
            className="w-4 h-4 accent-[#C4AB77]"
          />
          <span className="text-sm text-[#4B4C44]">SMS notifications</span>
        </label>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

// ── Tab: Password ─────────────────────────────────────────────────────────────

function PasswordTab() {
  const [form, setForm] = useState({ current: '', password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setMessage({ type: 'err', text: 'New passwords do not match.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: form.current, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to change password')
      setMessage({ type: 'ok', text: 'Password changed successfully.' })
      setForm({ current: '', password: '', confirm: '' })
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5 max-w-md">
      <div>
        <label className="block text-sm font-semibold text-[#35291C] mb-1">Current password</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={form.current}
          onChange={(e) => setForm((p) => ({ ...p, current: e.target.value }))}
          className="input"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#35291C] mb-1">New password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          className="input"
          placeholder="At least 8 characters, one uppercase, one number"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#35291C] mb-1">Confirm new password</label>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          className="input"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
      >
        {saving ? 'Changing password…' : 'Change password'}
      </button>
    </form>
  )
}

// ── Tab: Danger Zone ──────────────────────────────────────────────────────────

function DangerTab({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirm !== userEmail) {
      setError('Email address does not match.')
      return
    }
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      router.push('/?deleted=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-md">
      <div className="border border-red-200 rounded-lg p-5 bg-red-50">
        <h3 className="font-semibold text-red-800 mb-2">Delete account</h3>
        <p className="text-sm text-red-700 leading-relaxed mb-4">
          This will permanently delete your account and cancel any active subscription.
          This action cannot be undone.
        </p>
        <form onSubmit={handleDelete} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-red-800 mb-1">
              Type your email address to confirm: <span className="font-mono">{userEmail}</span>
            </label>
            <input
              type="email"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input border-red-300 focus:border-red-500"
              placeholder={userEmail}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={deleting || confirm !== userEmail}
            className="px-6 py-2.5 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting account…' : 'Delete my account permanently'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AccountPortal({ user, subscription, siteName, currency }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'My Subscription' },
    { key: 'profile', label: 'Profile' },
    { key: 'password', label: 'Password' },
    { key: 'danger', label: 'Account' },
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href="/" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
              ← {siteName}
            </Link>
            <h1 className="font-playfair text-2xl text-[#35291C] mt-2">Your Account</h1>
            <p className="text-sm text-[#4B4C44] mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[#4B4C44] hover:text-[#35291C] border border-[#c8c4a8] px-3 py-1.5 rounded hover:border-[#35291C] transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-md overflow-hidden">

          {/* Victorian header bar */}
          <div className="h-1.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          {/* Tabs */}
          <div className="flex border-b border-[#e8e4d0]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-xs font-semibold tracking-wide transition-colors ${
                  activeTab === tab.key
                    ? 'text-[#35291C] border-b-2 border-[#C4AB77] bg-[#faf9f5]'
                    : 'text-[#C4AB77] hover:text-[#35291C] hover:bg-[#faf9f5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <OverviewTab subscription={subscription} currency={currency} onNavigate={setActiveTab} />
            )}
            {activeTab === 'profile' && <ProfileTab user={user} />}
            {activeTab === 'password' && <PasswordTab />}
            {activeTab === 'danger' && <DangerTab userEmail={user.email} />}
          </div>

        </div>
      </div>
    </div>
  )
}
