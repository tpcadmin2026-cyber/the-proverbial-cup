import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'

const STATUS_STYLES: Record<string, string> = {
  under_review: 'bg-yellow-100 text-yellow-700',
  planned:      'bg-blue-100 text-blue-700',
  in_progress:  'bg-purple-100 text-purple-700',
  shipped:      'bg-green-100 text-green-700',
  declined:     'bg-gray-100 text-gray-500',
}

export default async function FeatureRequestsPage() {
  const requests = await db.featureRequest.findMany({ orderBy: { upvotes: 'desc' } })

  return (
    <>
      <AdminHeader title="Feature requests" subtitle="Ideas submitted by customers — update status to keep them informed." />
      <div className="p-8 max-w-3xl">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No feature requests yet. Enable Feature Requests in Features to let customers submit ideas.
          </div>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.id} className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{r.title}</div>
                  {r.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</div>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">▲ {r.upvotes}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Coming in Phase 4:</strong> Status management, public roadmap page, and customer comment threads.
        </div>
      </div>
    </>
  )
}
