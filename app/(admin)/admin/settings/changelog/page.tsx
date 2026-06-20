import { AdminHeader } from '@/components/admin/AdminHeader'
import { getChangelog } from '@/lib/changelog'
import { format } from 'date-fns'

const EVENT_STYLES: Record<string, { badge: string; dot: string }> = {
  deploy:          { badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500' },
  feature_toggle:  { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  content_save:    { badge: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  settings_change: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  backup:          { badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  manual:          { badge: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
}

const EVENT_LABELS: Record<string, string> = {
  deploy:          'Deploy',
  feature_toggle:  'Feature toggle',
  content_save:    'Content saved',
  settings_change: 'Settings changed',
  backup:          'Backup',
  manual:          'Note',
}

export default async function ChangelogPage() {
  const entries = await getChangelog({ limit: 100 })

  return (
    <>
      <AdminHeader
        title="Changelog"
        subtitle="A complete, automatic record of every deploy, feature change, content save, and settings update."
      />
      <div className="p-8 max-w-3xl">
        {entries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-400">
            <p className="text-lg">No entries yet</p>
            <p className="text-sm mt-1">Activity will appear here automatically as you use the platform.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />

            <ul className="space-y-6 pl-10">
              {entries.map((entry) => {
                const style = EVENT_STYLES[entry.eventType] ?? EVENT_STYLES.manual
                return (
                  <li key={entry.id} className="relative">
                    {/* Timeline dot */}
                    <span className={`absolute -left-7 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${style.dot}`} />

                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${style.badge}`}>
                            {EVENT_LABELS[entry.eventType] ?? entry.eventType}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">{entry.title}</span>
                        </div>
                        <time className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                          {format(entry.createdAt, 'dd MMM yyyy, HH:mm')}
                        </time>
                      </div>
                      {entry.description && (
                        <p className="mt-2 text-sm text-gray-600">{entry.description}</p>
                      )}
                      {entry.actor && (
                        <p className="mt-1.5 text-xs text-gray-400">By {entry.actor}</p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
