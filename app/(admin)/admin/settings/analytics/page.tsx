import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'
import { getSetting } from '@/lib/settings'

const TRACKED_EVENTS = [
  { event: 'user_signup',            trigger: 'New account created' },
  { event: 'newsletter_signup',      trigger: 'Newsletter sign-up form submitted' },
  { event: 'waitlist_join',          trigger: 'Waitlist sign-up form submitted' },
  { event: 'subscription_started',   trigger: 'Subscription reservation created (pre-Stripe)' },
  { event: 'subscription_activated', trigger: 'Stripe checkout completed — subscription plan' },
  { event: 'order_placed',           trigger: 'Stripe checkout completed — one-off purchase' },
  { event: 'contact_submitted',      trigger: 'Contact form submitted' },
  { event: 'chat_escalated',         trigger: 'Cornelius chat escalated to support ticket' },
]

export default async function AnalyticsSettingsPage() {
  const rows = await getGroupSettings('analytics')

  const [apiKey, host, enabled] = await Promise.all([
    getSetting<string>('analytics.posthogKey', ''),
    getSetting<string>('analytics.posthogHost', 'https://us.i.posthog.com'),
    getSetting<boolean>('analytics.enabled', true),
  ])

  const effectiveKey = process.env.POSTHOG_API_KEY || apiKey
  const isConfigured = !!effectiveKey
  const usingEnvVar  = !!process.env.POSTHOG_API_KEY && !apiKey

  return (
    <>
      <AdminHeader
        title="Analytics"
        subtitle="PostHog connection, tracking settings, and event reference."
      />

      {/* Connection status */}
      <div className="px-8 pt-6 pb-2">
        <div className="border border-gray-200 rounded-lg p-5 bg-white space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isConfigured && enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-sm font-semibold text-gray-800">
              {isConfigured && enabled
                ? 'PostHog connected'
                : !isConfigured
                ? 'PostHog not configured — enter your API key below'
                : 'Analytics disabled — toggle "Enable analytics" to activate'}
            </span>
          </div>
          {isConfigured && (
            <div className="text-xs text-gray-500 space-y-1 pl-[22px]">
              <div>Key: <span className="font-mono">{effectiveKey.slice(0, 12)}…</span>{usingEnvVar && ' (from POSTHOG_API_KEY env var)'}</div>
              <div>Host: <span className="font-mono">{host}</span></div>
            </div>
          )}
          {isConfigured && (
            <div className="pl-[22px]">
              <a
                href="https://us.posthog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#7A564C] underline hover:no-underline"
              >
                Open PostHog dashboard →
              </a>
            </div>
          )}
        </div>
      </div>

      <SettingsGroupPage rows={rows} />

      {/* Tracked events reference */}
      <div className="px-8 pt-2 pb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Tracked events</h2>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/2">Event name</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">When it fires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {TRACKED_EVENTS.map(({ event, trigger }) => (
                <tr key={event} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-800">{event}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
