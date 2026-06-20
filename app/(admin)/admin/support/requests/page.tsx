import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Feature Requests' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { RequestActions } from './RequestActions'

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
      <AdminHeader
        title="Feature Requests"
        subtitle="Customer idea submissions. Update status to keep the board accurate."
      />
      <div className="p-8 max-w-4xl">
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No feature requests yet. Enable Feature Requests in Features so customers can submit ideas.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {requests.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-start gap-4">
                {/* Upvote count */}
                <div className="flex-shrink-0 text-center min-w-[40px]">
                  <div className="text-lg font-bold text-[#35291C]">▲</div>
                  <div className="text-sm font-semibold text-[#4B4C44]">{r.upvotes}</div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                  {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{r.submittedBy ?? 'Anonymous'}</span>
                    <span className="text-xs text-gray-400">{format(r.createdAt, 'dd MMM yyyy')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                  <RequestActions requestId={r.id} currentStatus={r.status} currentPublic={r.isPublic} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
