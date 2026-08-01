import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Newsletter' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { NewsletterTable } from './NewsletterTable'

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

          <NewsletterTable subscribers={subscribers} />
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
