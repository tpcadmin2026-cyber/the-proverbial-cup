export const dynamic = 'force-dynamic'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function ConnectionsSettingsPage() {
  // Extra guard — Master Admin only
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) redirect('/login')
  const session = await db.session.findUnique({ where: { sessionToken: token }, include: { user: true } })
  if (!session || session.user.role !== 'master_admin') redirect('/admin/settings/site')

  // Combine all connection-related settings
  const [backupRows, changelogRows, aiRows, analyticsRows, r2Rows, vercelRows, b2Rows, stripeRows, emailRows] = await Promise.all([
    getGroupSettings('backups'),
    getGroupSettings('changelog'),
    getGroupSettings('ai'),
    getGroupSettings('analytics'),
    getGroupSettings('r2'),
    getGroupSettings('vercel'),
    getGroupSettings('b2'),
    getGroupSettings('stripe'),
    getGroupSettings('email'),
  ])

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
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Media storage — Cloudflare R2</h2>
        </div>
        <SettingsGroupPage rows={r2Rows} />
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
