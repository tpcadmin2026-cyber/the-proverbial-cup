export const dynamic = 'force-dynamic'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { db } from '@/lib/db'
import { getGroupSettings } from '../_shared'

// Credential-shaped fields that predate the masked "secret" input type — self-heals
// existing rows (seeded as plain "text") to the masked type the first time this
// page loads, so nothing needs a hand-run migration on already-deployed databases.
const SECRET_KEYS = [
  'email.apiKey', 'vercel.token',
  'b2.keyId', 'b2.appKey', 'stripe.secretKey', 'ai.apiKey',
  'analytics.posthogKey', 'stripe.webhookSecret',
]

export default async function ConnectionsSettingsPage() {
  await db.setting.updateMany({
    where: { key: { in: SECRET_KEYS }, inputType: { not: 'secret' } },
    data: { inputType: 'secret' },
  })

  // Combine all connection-related settings
  const [backupRows, changelogRows, aiRows, analyticsRows, vercelRows, b2Rows, stripeRows, emailRows] = await Promise.all([
    getGroupSettings('backups'),
    getGroupSettings('changelog'),
    getGroupSettings('ai'),
    getGroupSettings('analytics'),
    getGroupSettings('vercel'),
    getGroupSettings('b2'),
    getGroupSettings('stripe'),
    getGroupSettings('email'),
  ])

  // Unlike everything else on this page, media storage credentials are env-var
  // only (no database fallback) — kept out of the DB on purpose since they're
  // service-role keys with full storage access. So this is a status card, not
  // an editable form.
  const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

  return (
    <>
      <AdminHeader
        title="Connections"
        subtitle="API keys, third-party credentials, and integration settings. Master Admin access only."
      />
      <div className="px-8 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#7A564C] text-white text-xs font-semibold rounded">
          ⚠ IT access only — changes here affect live integrations
        </div>
      </div>
      <div className="space-y-0">
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email — Resend</h2>
        </div>
        <SettingsGroupPage rows={emailRows.filter(r => r.key === 'email.apiKey' || r.key === 'email.fromAddress' || r.key === 'email.fromName' || r.key === 'email.replyTo')} />
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">AI assistant — Anthropic</h2>
        </div>
        <SettingsGroupPage rows={aiRows.filter(r => r.key === 'ai.apiKey' || r.key === 'ai.model')} />
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Analytics — PostHog</h2>
        </div>
        <SettingsGroupPage rows={analyticsRows.filter(r => r.key === 'analytics.posthogKey' || r.key === 'analytics.posthogHost')} />
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Payments — Stripe</h2>
        </div>
        <SettingsGroupPage rows={stripeRows} />
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Media storage — Supabase Storage</h2>
        </div>
        <div className="px-8 pb-6">
          <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-block w-2 h-2 rounded-full ${supabaseConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm font-semibold text-gray-900">
                {supabaseConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              File uploads (media library, product images, CMS image blocks, masthead logo) use Supabase Storage.
              Unlike the settings above, these credentials are set as environment variables only — not editable
              here — since they're service-role keys with full storage access.
            </p>
            <p className="text-xs text-gray-500">
              Set these in Railway → your service → Variables:
            </p>
            <ul className="text-xs font-mono text-gray-600 mt-1.5 space-y-0.5">
              <li>SUPABASE_URL</li>
              <li>SUPABASE_SERVICE_KEY</li>
              <li>SUPABASE_BUCKET <span className="font-sans text-gray-400">(optional — defaults to &quot;media&quot;)</span></li>
            </ul>
          </div>
        </div>
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Backups — Backblaze B2</h2>
        </div>
        <SettingsGroupPage rows={b2Rows} />
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Deployment — Vercel</h2>
        </div>
        <SettingsGroupPage rows={vercelRows} />
        <div className="px-8 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Backup policy</h2>
        </div>
        <SettingsGroupPage rows={backupRows} />
        <div className="px-8 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Changelog tracking</h2>
        </div>
        <SettingsGroupPage rows={changelogRows} />
      </div>
    </>
  )
}
