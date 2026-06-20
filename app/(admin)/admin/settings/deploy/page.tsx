import { AdminHeader } from '@/components/admin/AdminHeader'
import { getRecentBackups } from '@/lib/backup'
import { getChangelog } from '@/lib/changelog'
import { getSetting } from '@/lib/settings'
import { format } from 'date-fns'
import { DeployActions } from './DeployActions'

export default async function DeployPage() {
  const [backups, deploys, vercelToken, vercelProjectId] = await Promise.all([
    getRecentBackups(10),
    getChangelog({ limit: 10, eventType: 'deploy' }),
    getSetting<string>('vercel.token', ''),
    getSetting<string>('vercel.projectId', ''),
  ])

  const vercelConfigured = !!(
    (process.env.VERCEL_TOKEN || vercelToken) &&
    (process.env.VERCEL_PROJECT_ID || vercelProjectId)
  )

  return (
    <>
      <AdminHeader
        title="Deploy"
        subtitle="Deploy your site, manage backups, and roll back if anything goes wrong."
      />
      <div className="p-8 space-y-8 max-w-3xl">
        {/* One-click deploy */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Deploy live site</h2>
          <p className="text-sm text-gray-500 mb-4">
            Publishes all saved changes to your live site. Takes around 60 seconds. A backup is created automatically before deploying.
          </p>
          <DeployActions vercelConfigured={vercelConfigured} />
        </section>

        {/* Backups */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Backups</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 10 backups — kept for 30 days (daily), 12 weeks, 12 months.</p>
            </div>
            <DeployActions vercelConfigured={vercelConfigured} backupOnly />
          </div>
          {backups.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No backups yet. Configure Backblaze B2 in Settings → Connections.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {backups.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                    b.status === 'completed' ? 'bg-green-100 text-green-700'
                    : b.status === 'failed' ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                  <span className="text-gray-600 capitalize">{b.trigger.replace('_', ' ')}</span>
                  {b.retentionTag && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{b.retentionTag}</span>
                  )}
                  <span className="text-gray-400 text-xs ml-auto flex-shrink-0">
                    {format(b.createdAt, 'dd MMM yyyy, HH:mm')}
                  </span>
                  {b.status === 'completed' && b.id && (
                    <DownloadBackupButton backupId={b.id} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deploy history */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Deploy history</h2>
          {deploys.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No deploys recorded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {deploys.map((d) => (
                <li key={d.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{d.title}</span>
                    <span className="text-gray-400 text-xs">{format(d.createdAt, 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                  {d.actor && <p className="text-xs text-gray-400 mt-0.5">By {d.actor}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function DownloadBackupButton({ backupId }: { backupId: string }) {
  return (
    <a
      href={`/api/admin/backup/${backupId}/download`}
      className="text-xs text-[#C4AB77] hover:underline flex-shrink-0"
      target="_blank"
      rel="noopener noreferrer"
    >
      Download
    </a>
  )
}
