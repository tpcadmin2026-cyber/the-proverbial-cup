import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Dashboard' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { getChangelog } from '@/lib/changelog'
import { getRecentBackups } from '@/lib/backup'
import { db } from '@/lib/db'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default async function AdminOverviewPage() {
  const [recentLog, backups, pages, userCount, openTickets] = await Promise.all([
    getChangelog({ limit: 8 }),
    getRecentBackups(3),
    db.cmsPage.findMany({ orderBy: { pageOrder: 'asc' }, include: { _count: { select: { blocks: true } } } }),
    db.user.count(),
    db.supportTicket.count({ where: { status: 'open' } }),
  ])


  return (
    <>
      <AdminHeader
        title="Overview"
        subtitle="A summary of your site's activity and health."
      />
      <div className="p-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total users" value={String(userCount)} note="All time" />
          <StatCard label="Active subscribers" value="—" note="Connect Stripe to see this" />
          <StatCard label="Open tickets" value={String(openTickets)} note="Support inbox" />
          <StatCard label="Published pages" value={String(pages.filter(p => p.published).length)} note={`${pages.length} total`} />
        </div>

        {/* Pages quick-access */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Newspaper pages</h2>
            <Link href="/admin/content/pages/new" className="text-xs font-semibold text-[#C4AB77] hover:underline">+ Add page</Link>
          </div>
          {pages.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-400 text-center italic">
              No pages yet. <Link href="/admin/content/pages/new" className="text-[#C4AB77] hover:underline">Add your first page</Link> to start building the Gazette.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pages.map((page) => (
                <div key={page.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="font-playfair text-gray-300 w-6 text-center shrink-0 text-sm">{page.tabNumeral}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{page.tabLabel}</span>
                    <span className="text-xs text-gray-400 ml-2">{page._count.blocks} block{page._count.blocks !== 1 ? 's' : ''}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {page.published ? 'Live' : 'Draft'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/content/pages/${page.id}`} className="text-xs text-gray-400 hover:text-[#C4AB77] hover:underline">
                      Settings
                    </Link>
                    {page.published && (
                      <Link
                        href={`/?cms_edit=${page.id}`}
                        target="_blank"
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-[#35291C] text-[#E8E6D8] rounded hover:bg-[#35291C] transition-colors"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit on site
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent activity */}
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Recent activity</h2>
            {recentLog.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentLog.map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3 text-sm">
                    <EventBadge type={entry.eventType} />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{entry.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {entry.actor} · {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Last backups */}
          <section className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Recent backups</h2>
            {backups.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No backups yet. Configure Backblaze B2 in Settings → Connections.</p>
            ) : (
              <ul className="space-y-3">
                {backups.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.status}
                    </span>
                    <span className="text-gray-600">{b.trigger}</span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {formatDistanceToNow(b.createdAt, { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
      {note && <div className="text-xs text-gray-400 mt-0.5">{note}</div>}
    </div>
  )
}

function EventBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    deploy:          'bg-blue-100 text-blue-700',
    feature_toggle:  'bg-purple-100 text-purple-700',
    content_save:    'bg-green-100 text-green-700',
    settings_change: 'bg-yellow-100 text-yellow-700',
    backup:          'bg-gray-100 text-gray-600',
    manual:          'bg-gray-100 text-gray-600',
  }
  const labels: Record<string, string> = {
    deploy:          'Deploy',
    feature_toggle:  'Feature',
    content_save:    'Content',
    settings_change: 'Settings',
    backup:          'Backup',
    manual:          'Note',
  }
  return (
    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {labels[type] ?? type}
    </span>
  )
}
