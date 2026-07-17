'use client'

import { useState } from 'react'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  priceMonthly: number | null
  priceYearly: number | null
  stripePriceIdMonthly: string | null
  stripePriceIdYearly: string | null
  trialDays: number
  features: string | null
  highlightFeature: string | null
  isHighlighted: boolean
  highlightLabel: string | null
  visible: boolean
  displayOrder: number
  maxPauseDays: number
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

function currencySymbol(currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .formatToParts(0)
    .find((p) => p.type === 'currency')?.value ?? currency
}

export function PlanList({ initialPlans, currency }: { initialPlans: Plan[]; currency: string }) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const EMPTY_PLAN: Omit<Plan, 'id'> = {
    name: '', slug: '', description: '', priceMonthly: null, priceYearly: null,
    stripePriceIdMonthly: null, stripePriceIdYearly: null,
    trialDays: 0, features: '', highlightFeature: '', isHighlighted: false,
    highlightLabel: '', visible: true, displayOrder: plans.length, maxPauseDays: 0,
  }

  async function savePlan(data: Partial<Plan> & { id?: string }) {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/subscriptions/plans', {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      if (data.id) {
        setPlans((p) => p.map((pl) => pl.id === data.id ? json.plan : pl))
      } else {
        setPlans((p) => [...p, json.plan])
      }
      setEditing(null); setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('Remove this subscription plan? Subscribers already on it will not be affected.')) return
    const res = await fetch(`/api/admin/subscriptions/plans?id=${id}`, { method: 'DELETE' })
    if (res.ok) setPlans((p) => p.filter((pl) => pl.id !== id))
  }

  const formPlan = editing ?? EMPTY_PLAN as Plan

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Subscription plans</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Define as many plans as you like. Pricing and features are all yours to set.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="px-3 py-1.5 bg-[#C4AB77] text-white text-xs font-semibold rounded hover:bg-[#7a5c10] transition-colors"
        >
          + Add plan
        </button>
      </div>

      {plans.length === 0 && !showForm && (
        <div className="text-center py-8 text-sm text-gray-400">
          No plans yet. Click <strong>Add plan</strong> to create your first subscription tier.
        </div>
      )}

      {/* Plan cards */}
      <div className="space-y-3 mb-4">
        {plans.map((plan) => {
          const features = plan.features ? JSON.parse(plan.features) as string[] : []
          return (
            <div key={plan.id} className={`border rounded-lg p-4 ${plan.isHighlighted ? 'border-[#C4AB77] bg-amber-50' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{plan.name}</span>
                    {plan.isHighlighted && plan.highlightLabel && (
                      <span className="text-xs bg-[#C4AB77] text-white px-2 py-0.5 rounded">{plan.highlightLabel}</span>
                    )}
                    {!plan.visible && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="font-medium text-gray-900">
                      {plan.priceMonthly == null ? 'Free' : `${formatPrice(plan.priceMonthly, currency)}/mo`}
                    </span>
                    {plan.priceYearly != null && (
                      <span className="text-gray-400">{formatPrice(plan.priceYearly, currency)}/yr</span>
                    )}
                    {plan.trialDays > 0 && (
                      <span className="text-gray-400">{plan.trialDays}-day trial</span>
                    )}
                  </div>
                  {features.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {features.slice(0, 4).map((f: string, i: number) => (
                        <li key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{f}</li>
                      ))}
                      {features.length > 4 && (
                        <li className="text-xs text-gray-400">+{features.length - 4} more</li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(plan); setShowForm(true) }}
                    className="text-xs text-[#C4AB77] hover:underline"
                  >Edit</button>
                  <button
                    onClick={() => deletePlan(plan.id)}
                    className="text-xs text-red-500 hover:underline"
                  >Remove</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div className="border-t border-gray-100 pt-5 mt-2">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            {editing ? `Editing: ${editing.name}` : 'New subscription plan'}
          </h3>
          <PlanForm
            plan={formPlan}
            saving={saving}
            error={error}
            currency={currency}
            onSave={savePlan}
            onCancel={() => { setEditing(null); setShowForm(false); setError(null) }}
          />
        </div>
      )}
    </section>
  )
}

function PlanForm({ plan, saving, error, currency, onSave, onCancel }: {
  plan: Plan
  saving: boolean
  error: string | null
  currency: string
  onSave: (data: Partial<Plan> & { id?: string }) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({ ...plan })
  const f = (key: keyof Plan, val: unknown) => setForm((p) => ({ ...p, [key]: val }))

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setForm((p) => ({
      ...p,
      name,
      slug: p.id ? p.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  // Features as newline-separated list for easy editing
  const featuresText = form.features
    ? (JSON.parse(form.features) as string[]).join('\n')
    : ''

  function handleFeaturesChange(text: string) {
    const arr = text.split('\n').map((s) => s.trim()).filter(Boolean)
    f('features', JSON.stringify(arr))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Plan name" helpText="What subscribers see — e.g. The Correspondent">
          <input type="text" value={form.name} onChange={(e) => handleNameChange(e.target.value)}
            className="input" placeholder="The Correspondent" />
        </Field>
        <Field label="Internal slug" helpText="Auto-generated. Used in code — no spaces.">
          <input type="text" value={form.slug} onChange={(e) => f('slug', e.target.value)}
            className="input font-mono" placeholder="the-correspondent" />
        </Field>
      </div>

      <Field label="Description" helpText="Shown on your pricing page below the plan name.">
        <textarea value={form.description ?? ''} onChange={(e) => f('description', e.target.value)}
          rows={2} className="input" placeholder="Perfect for the curious reader…" />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label={`Monthly price (${currencySymbol(currency)})`} helpText={`In ${currency}. Leave blank for a free plan.`}>
          <input type="number" min={0} step={0.01}
            value={form.priceMonthly != null ? form.priceMonthly / 100 : ''}
            onChange={(e) => f('priceMonthly', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
            className="input" placeholder="0.00" />
        </Field>
        <Field label={`Yearly price (${currencySymbol(currency)})`} helpText="Leave blank if you don't offer yearly billing.">
          <input type="number" min={0} step={0.01}
            value={form.priceYearly != null ? form.priceYearly / 100 : ''}
            onChange={(e) => f('priceYearly', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
            className="input" placeholder="0.00" />
        </Field>
        <Field label="Free trial (days)" helpText="0 = no trial.">
          <input type="number" min={0} value={form.trialDays}
            onChange={(e) => f('trialDays', parseInt(e.target.value) || 0)}
            className="input" />
        </Field>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-4">
        <p className="text-xs font-semibold text-amber-800 uppercase tracking-widest">Stripe Price IDs</p>
        <p className="text-xs text-amber-700">Copy these from the Stripe Dashboard → Products → your plan → Pricing. Required for Stripe Checkout to work. Start with <code className="font-mono bg-amber-100 px-1 rounded">price_</code></p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Monthly Price ID" helpText="The Stripe price ID for monthly billing.">
            <input type="text" value={form.stripePriceIdMonthly ?? ''}
              onChange={(e) => f('stripePriceIdMonthly', e.target.value || null)}
              className="input font-mono" placeholder="price_1ABC…" />
          </Field>
          <Field label="Yearly Price ID" helpText="The Stripe price ID for annual billing. Leave blank if no yearly option.">
            <input type="text" value={form.stripePriceIdYearly ?? ''}
              onChange={(e) => f('stripePriceIdYearly', e.target.value || null)}
              className="input font-mono" placeholder="price_1DEF…" />
          </Field>
        </div>
      </div>

      <Field label="Features list" helpText="One feature per line — shown as bullet points on the pricing page.">
        <textarea value={featuresText} onChange={(e) => handleFeaturesChange(e.target.value)}
          rows={5} className="input font-mono text-xs"
          placeholder={"Monthly coffee selection\nFree shipping\nThe Dispatch editorial\nTasting journal"} />
      </Field>

      <Field label="Highlight feature" helpText="One standout benefit shown prominently — optional.">
        <input type="text" value={form.highlightFeature ?? ''}
          onChange={(e) => f('highlightFeature', e.target.value)}
          className="input" placeholder="Free international shipping" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Badge label" helpText="Shown on the plan card — e.g. Most Popular, Best Value. Leave blank for none.">
          <input type="text" value={form.highlightLabel ?? ''}
            onChange={(e) => f('highlightLabel', e.target.value)}
            className="input" placeholder="Most Popular" />
        </Field>
        <Field label="Max pause duration (days)" helpText="How long subscribers on this plan can pause. 0 = unlimited.">
          <input type="number" min={0} value={form.maxPauseDays}
            onChange={(e) => f('maxPauseDays', parseInt(e.target.value) || 0)}
            className="input" />
        </Field>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isHighlighted}
            onChange={(e) => f('isHighlighted', e.target.checked)}
            className="accent-[#C4AB77]" />
          <span className="text-sm text-gray-700">Highlight this plan (show badge)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.visible}
            onChange={(e) => f('visible', e.target.checked)}
            className="accent-[#C4AB77]" />
          <span className="text-sm text-gray-700">Visible on pricing page</span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave({ ...form, id: form.id || undefined })}
          disabled={saving || !form.name || !form.slug}
          className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save plan'}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({ label, helpText, children }: { label: string; helpText?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-0.5">{label}</label>
      {helpText && <p className="text-xs text-gray-500 mb-1">{helpText}</p>}
      {children}
    </div>
  )
}
