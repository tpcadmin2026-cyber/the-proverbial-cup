'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

interface Step { stepKey: string; label: string; order: number; completed: boolean; skipped: boolean }

interface Props {
  steps: Step[]
  currentStepKey: string
}

// Step content definitions — what fields each step shows
const STEP_CONTENT: Record<string, {
  title: string
  description: string
  fields: Array<{ key: string; label: string; helpText: string; type: string; placeholder?: string }>
}> = {
  site_identity: {
    title: 'Welcome — let\'s set up your site',
    description: 'Tell us a little about your site. You can change all of this later in Settings.',
    fields: [
      { key: 'site.name',         label: 'Site name',       helpText: 'The name of your website.', type: 'text', placeholder: 'The Victorian Illustrated Gazette' },
      { key: 'site.tagline',      label: 'Tagline',         helpText: 'A short phrase that captures your brand.', type: 'text', placeholder: 'Truth, Honour, Industry' },
      { key: 'site.contactEmail', label: 'Contact email',   helpText: 'Where you want to receive messages from visitors.', type: 'email', placeholder: 'hello@yoursite.com' },
    ],
  },
  template: {
    title: 'Choose your template',
    description: 'Select the visual design for your site. More templates can be added later.',
    fields: [],
  },
  stripe: {
    title: 'Payments (Stripe)',
    description: 'Connect Stripe to accept subscription payments and one-off purchases. You can skip this and add it later in Settings → Payments.',
    fields: [
      { key: '_stripe_secret', label: 'Stripe secret key', helpText: 'Find this in your Stripe dashboard under Developers → API keys. Starts with sk_', type: 'password', placeholder: 'sk_live_…' },
      { key: '_stripe_pub',    label: 'Stripe publishable key', helpText: 'The public key from the same page. Starts with pk_', type: 'text', placeholder: 'pk_live_…' },
    ],
  },
  email: {
    title: 'Email delivery',
    description: 'Set up how your site sends emails — order confirmations, subscription reminders, and more. You can skip this and configure it later in Settings → Email.',
    fields: [
      { key: 'email.provider',    label: 'Email provider', helpText: 'Which service will send your emails.', type: 'text', placeholder: 'resend' },
      { key: 'email.apiKey',      label: 'API key',        helpText: 'Your email provider\'s API key.', type: 'password', placeholder: 're_…' },
      { key: 'email.fromName',    label: 'From name',      helpText: 'The sender name shown in your recipients\' inboxes.', type: 'text', placeholder: 'The Victorian Illustrated Gazette' },
      { key: 'email.fromAddress', label: 'From email',     helpText: 'The email address your messages come from.', type: 'email', placeholder: 'dispatch@yourgazette.com' },
    ],
  },
  anthropic: {
    title: 'AI assistant (optional)',
    description: 'Add an Anthropic API key to power the AI chat widget and AI-assisted features. You can skip this and add it later.',
    fields: [
      { key: '_anthropic_key', label: 'Anthropic API key', helpText: 'Find this at console.anthropic.com. Starts with sk-ant-', type: 'password', placeholder: 'sk-ant-…' },
    ],
  },
  features: {
    title: 'Choose your features',
    description: 'Select which parts of the platform you want active. You can turn any of these on or off at any time from the Features panel.',
    fields: [],
  },
}

// Features shown in the features step
const FEATURE_OPTIONS = [
  { key: 'subscriptions',    label: 'Subscriptions',          description: 'Coffee subscription plans with recurring billing.' },
  { key: 'ecommerce',        label: 'Online shop',            description: 'Sell individual products, gift sets, and equipment.' },
  { key: 'ai_chat',          label: 'AI chat assistant',      description: 'A chat widget that answers visitor questions.' },
  { key: 'contact_form',     label: 'Contact form',           description: 'A simple form for visitors to get in touch.' },
  { key: 'newsletter',       label: 'Newsletter sign-up',     description: 'Collect email addresses for your newsletter.' },
  { key: 'knowledge_base',   label: 'Knowledge base',         description: 'Searchable help articles for customers.' },
  { key: 'support_tickets',  label: 'Support tickets',        description: 'Let customers submit and track support requests.' },
  { key: 'feature_requests', label: 'Feature requests',       description: 'Let customers suggest and upvote new features.' },
  { key: 'analytics',        label: 'Analytics',              description: 'Visitor stats and revenue tracking.' },
]

interface TemplateMeta { name: string; description: string; generatedAt: string }

export function SetupWizard({ steps, currentStepKey }: Props) {
  const router = useRouter()
  const [activeKey, setActiveKey] = useState(currentStepKey)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set(['contact_form', 'analytics']))
  const [templateData, setTemplateData] = useState<object | null>(null)
  const [templateMeta, setTemplateMeta] = useState<TemplateMeta | null>(null)
  const [templateError, setTemplateError] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleTemplateFile(file: File) {
    setTemplateError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (!data.templateVersion || !data.settings) throw new Error('Not a valid template file')
        setTemplateData(data)
        setTemplateMeta({ name: data.meta?.name ?? 'Unknown', description: data.meta?.description ?? '', generatedAt: data.generatedAt ?? '' })
      } catch {
        setTemplateError('This does not appear to be a valid template file. Please upload a .json file exported from this platform.')
      }
    }
    reader.readAsText(file)
  }

  const stepContent = STEP_CONTENT[activeKey]
  const stepIndex = steps.findIndex((s) => s.stepKey === activeKey)

  async function advance(skip = false) {
    setSaving(true)
    setError(null)
    try {
      // Build settings updates from field values
      const settings: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(fieldValues)) {
        if (!k.startsWith('_')) settings[k] = v
      }

      // Feature toggles
      if (activeKey === 'features') {
        for (const f of FEATURE_OPTIONS) {
          settings[`feature.${f.key}`] = selectedFeatures.has(f.key)
        }
      }

      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepKey: activeKey,
          completed: !skip,
          skipped: skip,
          settings,
          template: activeKey === 'template' ? templateData : undefined,
        }),
      })
      const data = await res.json()
      if (data.allDone) {
        router.push('/admin')
        return
      }

      // Move to next step
      const nextStep = steps[stepIndex + 1]
      if (nextStep) setActiveKey(nextStep.stepKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (!stepContent) return null

  return (
    <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center p-6">
      {/* Background grain matching the template */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }} />

      <div className="relative w-full max-w-xl">
        {/* Step progress */}
        <div className="flex items-center gap-1.5 mb-6 justify-center">
          {steps.map((s, i) => (
            <div
              key={s.stepKey}
              className={clsx(
                'h-1.5 rounded-full transition-all',
                s.completed || s.skipped ? 'bg-[#C4AB77] w-6' :
                s.stepKey === activeKey ? 'bg-[#35291C] w-6' : 'bg-[#b8b090] w-3'
              )}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-[#c8c4a8] shadow-lg p-8">
          {/* Masthead ornament */}
          <div className="text-center mb-6">
            <div className="text-[#C4AB77] text-lg tracking-widest">✦ ✦ ✦</div>
            <div className="text-xs text-[#C4AB77] uppercase tracking-widest mt-1 font-medium">
              Gazette Platform · Setup
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#35291C] mb-2">{stepContent.title}</h1>
          <p className="text-sm text-[#4B4C44] mb-6">{stepContent.description}</p>

          {/* Fields */}
          {stepContent.fields.length > 0 && (
            <div className="space-y-4 mb-6">
              {stepContent.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-semibold text-gray-900 mb-0.5">{field.label}</label>
                  <p className="text-xs text-gray-500 mb-1">{field.helpText}</p>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={fieldValues[field.key] ?? ''}
                    onChange={(e) => setFieldValues((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C4AB77]"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Template picker */}
          {activeKey === 'template' && (
            <div className="mb-6 space-y-3">
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleTemplateFile(f) }}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-[#C4AB77] transition-colors"
              >
                {templateMeta ? (
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{templateMeta.name}</div>
                    {templateMeta.description && <div className="text-xs text-gray-500 italic mt-0.5">{templateMeta.description}</div>}
                    {templateMeta.generatedAt && (
                      <div className="text-xs text-gray-400 mt-1">
                        Exported {new Date(templateMeta.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    <div className="text-xs text-[#C4AB77] mt-1">Click to choose a different file</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    Drop a <code className="font-mono text-xs bg-gray-100 px-1 rounded">.json</code> template file here,{' '}
                    or <span className="text-[#C4AB77] underline">click to browse</span>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleTemplateFile(f) }} />
              {templateError && <p className="text-xs text-red-600">{templateError}</p>}
              <p className="text-xs text-gray-400">
                Upload a template exported from another site on this platform — or skip this step to start from the default configuration.
              </p>
            </div>
          )}

          {/* Feature checkboxes */}
          {activeKey === 'features' && (
            <div className="space-y-2 mb-6">
              {FEATURE_OPTIONS.map((f) => (
                <label key={f.key} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.has(f.key)}
                    onChange={(e) => {
                      setSelectedFeatures((prev) => {
                        const next = new Set(prev)
                        if (e.target.checked) next.add(f.key); else next.delete(f.key)
                        return next
                      })
                    }}
                    className="mt-0.5 accent-[#C4AB77]"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{f.label}</div>
                    <div className="text-xs text-gray-500">{f.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => advance(false)}
              disabled={saving}
              className="flex-1 py-2.5 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : stepIndex === steps.length - 1 ? 'Finish setup →' : 'Continue →'}
            </button>
            <button
              onClick={() => advance(true)}
              disabled={saving}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>
          </div>

          <p className="text-xs text-center text-gray-400 mt-4">
            Step {stepIndex + 1} of {steps.length} — every step is optional and can be completed later in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
