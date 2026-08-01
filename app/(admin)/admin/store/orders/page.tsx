import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'
import { format } from 'date-fns'

interface Props {
  searchParams: Promise<{ archived?: string }>
}

export default async function OrdersPage({ searchParams }: Props) {
  const { archived: showArchived } = await searchParams
  const archived = showArchived === '1'
  const orders = await db.order.findMany({ where: { archived }, orderBy: { createdAt: 'desc' }, take: 50 })

  return (
    <>
      <AdminHeader title="Orders" subtitle="All customer orders — view status, add tracking, and process refunds." />
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-end mb-4">
          <Link
            href={archived ? '/admin/store/orders' : '/admin/store/orders?archived=1'}
            className="text-xs text-[#C4AB77] hover:underline"
          >
            {archived ? '← Back to active orders' : 'View archived orders →'}
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            {archived ? 'No archived orders.' : 'No orders yet. Orders will appear here once customers start purchasing.'}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {orders.map((o) => (
              <Link key={o.id} href={`/admin/store/orders/${o.id}`} className="flex items-center gap-4 px-5 py-4 text-sm hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{o.customerEmail}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{format(o.createdAt, 'dd MMM yyyy')}{o.trackingNumber ? ` · Tracking: ${o.trackingNumber}` : ''}</div>
                </div>
                <div className="text-gray-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: o.currency }).format(o.totalCents / 100)}</div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                  o.status === 'paid'      ? 'bg-green-100 text-green-700' :
                  o.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                  o.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{o.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
