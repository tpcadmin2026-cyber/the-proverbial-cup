import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

// Admin and Master Admin only — managers and employees cannot access this page
async function requireAdminAccess() {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) redirect('/login')
  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  })
  if (!session || !['admin', 'master_admin'].includes(session.user.role)) {
    redirect('/admin')
  }
  return session.user
}

// Check if an environment variable is configured (non-empty)
function envStatus(key: string): 'configured' | 'missing' {
  const val = process.env[key]
  return val && val.trim() !== '' ? 'configured' : 'missing'
}

const THIRD_PARTIES = [
  { name: 'Stripe',         category: 'Payments',      envKey: 'STRIPE_SECRET_KEY',       docsUrl: 'https://stripe.com' },
  { name: 'Resend',         category: 'Email',          envKey: 'RESEND_API_KEY',           docsUrl: 'https://resend.com' },
  { name: 'Twilio',         category: 'SMS',            envKey: 'TWILIO_AUTH_TOKEN',        docsUrl: 'https://twilio.com' },
  { name: 'Cloudflare R2',  category: 'Media storage',  envKey: 'R2_ACCESS_KEY_ID',         docsUrl: 'https://cloudflare.com/r2' },
  { name: 'Backblaze B2',   category: 'Backups',        envKey: 'B2_APPLICATION_KEY',       docsUrl: 'https://backblaze.com' },
  { name: 'PostHog',        category: 'Analytics',      envKey: 'POSTHOG_API_KEY',          docsUrl: 'https://posthog.com' },
  { name: 'Anthropic',      category: 'AI assistant',   envKey: 'ANTHROPIC_API_KEY',        docsUrl: 'https://anthropic.com' },
  { name: 'Google OAuth',   category: 'Authentication', envKey: 'GOOGLE_CLIENT_ID',         docsUrl: 'https://console.cloud.google.com' },
  { name: 'Vercel',         category: 'Deployment',     envKey: 'VERCEL_TOKEN',             docsUrl: 'https://vercel.com' },
  { name: 'GitHub',         category: 'Version control',envKey: 'GITHUB_TOKEN',             docsUrl: 'https://github.com' },
  { name: 'Neon / Postgres',category: 'Database',       envKey: 'DATABASE_URL',             docsUrl: 'https://neon.tech' },
]

export default async function SystemPage() {
  await requireAdminAccess()

  // Platform stats
  const [
    userCount, subscriberCount, productCount, orderCount,
    ticketCount, kbArticleCount, flagCount, backupCount,
    lastDeploy, lastChangelog, searchIndexCount,
  ] = await Promise.all([
    db.user.count(),
    db.userSubscription.count({ where: { status: 'active' } }),
    db.product.count(),
    db.order.count(),
    db.supportTicket.count(),
    db.kbArticle.count(),
    db.featureFlag.count({ where: { enabled: true } }),
    db.backupRecord.count({ where: { status: 'completed' } }),
    db.changelogEntry.findFirst({ where: { eventType: 'deploy' }, orderBy: { createdAt: 'desc' } }),
    db.changelogEntry.findFirst({ orderBy: { createdAt: 'desc' } }),
    db.searchIndex.count(),
  ])

  // Package versions from env or hardcoded current values
  const versions = {
    platform:  '0.1.0',
    nextjs:    '14.2.4',
    prisma:    '5.22.0',
    node:      process.version,
    env:       process.env.NODE_ENV ?? 'development',
  }

  const connections = THIRD_PARTIES.map((t) => ({
    ...t,
    status: envStatus(t.envKey),
  }))

  const connectedCount = connections.filter((c) => c.status === 'configured').length

  return (
    <>
      <AdminHeader
        title="System"
        subtitle="Platform version, third-party connection status, and database statistics."
      />
      <div className="p-8 max-w-5xl space-y-8">

        {/* Environment banner */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
          versions.env === 'production'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <span className={`w-2 h-2 rounded-full ${versions.env === 'production' ? 'bg-green-500' : 'bg-amber-400'}`} />
          Running in <strong>{versions.env}</strong> mode
          {versions.env !== 'production' && (
            <span className="font-normal ml-1">— connect Vercel to deploy to production</span>
          )}
        </div>

        {/* Version info */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Software versions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Gazette Platform',  value: `v${versions.platform}`,  note: 'Current build' },
              { label: 'Next.js',           value: `v${versions.nextjs}`,    note: 'React framework' },
              { label: 'Prisma ORM',        value: `v${versions.prisma}`,    note: 'Database layer' },
              { label: 'Node.js',           value: versions.node,            note: 'Runtime' },
            ].map((row) => (
              <div key={row.label} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{row.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{row.note}</span>
                </div>
                <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Third-party connections */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Third-party connections</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              connectedCount === connections.length
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {connectedCount} / {connections.length} configured
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {connections.map((c) => (
              <div key={c.name} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{c.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === 'configured' ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      Not configured
                    </span>
                  )}
                  <a
                    href={c.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#C4AB77] hover:underline"
                  >
                    Docs ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              API keys and credentials are added in{' '}
              <a href="/admin/settings/connections" className="text-[#C4AB77] hover:underline">
                Settings → Connections
              </a>.
              Status shown here is read from environment variables.
            </p>
          </div>
        </section>

        {/* Database stats */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Database statistics</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-50">
            {[
              { label: 'Users',             value: userCount },
              { label: 'Active subscribers', value: subscriberCount },
              { label: 'Products',          value: productCount },
              { label: 'Orders',            value: orderCount },
              { label: 'Support tickets',   value: ticketCount },
              { label: 'KB articles',       value: kbArticleCount },
              { label: 'Features enabled',  value: flagCount },
              { label: 'Completed backups', value: backupCount },
              { label: 'Search index',      value: searchIndexCount },
            ].map((stat) => (
              <div key={stat.label} className="px-5 py-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Search index */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Search index</h2>
              <p className="text-xs text-gray-400 mt-0.5">{searchIndexCount} items indexed — rebuild after importing content or when results seem stale.</p>
            </div>
            <RebuildSearchButton />
          </div>
        </section>

        {/* Recent activity summary */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Platform activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="px-5 py-3.5 flex items-center gap-4">
              <span className="flex-1 text-sm text-gray-700">Last deployment</span>
              <span className="text-sm text-gray-500">
                {lastDeploy ? format(lastDeploy.createdAt, 'dd MMM yyyy, HH:mm') : 'No deployments recorded'}
              </span>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-4">
              <span className="flex-1 text-sm text-gray-700">Last activity</span>
              <span className="text-sm text-gray-500">
                {lastChangelog ? format(lastChangelog.createdAt, 'dd MMM yyyy, HH:mm') : 'No activity yet'}
              </span>
            </div>
            <div className="px-5 py-3.5 flex items-center gap-4">
              <span className="flex-1 text-sm text-gray-700">Full changelog</span>
              <a href="/admin/settings/changelog" className="text-sm text-[#C4AB77] hover:underline">
                View all entries →
              </a>
            </div>
          </div>
        </section>

        {/* Stack summary */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Technology stack</h2>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              ['Framework',       'Next.js 14 (React)'],
              ['Database',        'PostgreSQL via Prisma'],
              ['Authentication',  'NextAuth.js v5'],
              ['Payments',        'Stripe'],
              ['Email',           'Resend + React Email'],
              ['SMS',             'Twilio'],
              ['Media storage',   'Cloudflare R2'],
              ['Backups',         'Backblaze B2'],
              ['Analytics',       'PostHog'],
              ['AI',              'Anthropic Claude'],
              ['Deployment',      'Vercel'],
              ['Version control', 'GitHub'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2 py-1 border-b border-gray-50">
                <span className="text-gray-400 w-36 flex-shrink-0 text-xs">{label}</span>
                <span className="text-gray-900 text-xs font-medium">{value}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}

function RebuildSearchButton() {
  // Rendered as a simple form so it works without JS
  return (
    <form action="/api/admin/search/rebuild" method="POST">
      <button
        type="submit"
        className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded hover:bg-gray-50 transition-colors"
      >
        Rebuild index
      </button>
    </form>
  )
}
