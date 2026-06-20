import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Newsletter' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { format } from 'date-fns'

export default async function NewsletterPage() {
  const [subscribers, totalCount, confirmedCount, unsubCount] = await Promise.all([
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.count({ where: { confirmed: true, unsubscribedAt: null } }),
    db.newsletterSubscriber.count({ where: { unsubscribedAt: { not: null } } }),
  ])

  return (
    <>
      <AdminHeader
        title="Newsletter"
        subtitle="Everyone who has signed up to receive correspondence from the Gazette."
      />
      <div className="p-8 space-y-6 max-w-5xl">

        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total sign-ups"    value={totalCount} />
          <StatCard label="Confirmed"         value={confirmedCount} color="text-green-700" />
          <StatCard label="Unsubscribed"      value={unsubCount} color="text-gray-400" />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Subscribers</h2>
            <span className="text-xs text-gray-400">{totalCount} total</span>
          </div>

          {subscribers.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No subscribers yet. Sign-ups will appear here as readers enrol at <strong>/newsletter</strong>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Signed up</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{sub.email}</td>
                      <td className="px-5 py-3 text-gray-500">{sub.name ?? '—'}</td>
                      <td className="px-5 py-3 text-xs text-gray-400 capitalize">{sub.source}</td>
                      <td className="px-5 py-3">
                        {sub.unsubscribedAt ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Unsubscribed</span>
                        ) : sub.confirmed ? (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Confirmed</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {format(sub.createdAt, 'dd MMM yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
