import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'

export default async function PauseCancelPage() {
  const [pauseReminders, cancelReasons] = await Promise.all([
    db.pauseReminder.findMany({ orderBy: { order: 'asc' } }),
    db.cancelReason.findMany({ orderBy: { order: 'asc' } }),
  ])

  return (
    <>
      <AdminHeader
        title="Pause & cancel"
        subtitle="Configure the reminder schedule sent to pausing subscribers, and the cancel reason options."
      />
      <div className="p-8 max-w-3xl space-y-8">

        {/* Pause reminders */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Pause reminder emails</h2>
          <p className="text-xs text-gray-500 mb-4">
            Sent automatically before a subscriber's pause ends. Written in a Victorian voice — editable in Phase 3.
          </p>
          <ul className="space-y-3">
            {pauseReminders.map((r) => (
              <li key={r.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {r.daysBeforeResume === 0 ? 'On the day of resumption' : `${r.daysBeforeResume} days before resume`}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {r.active ? 'Active' : 'Off'}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">Subject: {r.subject}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{r.bodyText}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">Full copy editor for reminders coming in Phase 3.</p>
        </section>

        {/* Cancel reasons */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Cancellation reasons</h2>
          <p className="text-xs text-gray-500 mb-4">
            Shown during the cancel flow. Selections are recorded in analytics.
          </p>
          <ul className="space-y-2">
            {cancelReasons.map((r) => (
              <li key={r.id} className="flex items-center gap-3 text-sm py-1">
                <span className="text-gray-300 w-4 text-right">{r.order}.</span>
                <span className="flex-1 text-gray-900">{r.label}</span>
                {r.allowFreeText && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">+ free text</span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-3">Add, reorder, and edit reasons coming in Phase 3.</p>
        </section>
      </div>
    </>
  )
}
