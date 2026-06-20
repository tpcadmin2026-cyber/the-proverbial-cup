import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'
import { format } from 'date-fns'

const STATUS_STYLES: Record<string, string> = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting:     'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
}

export default async function TicketsPage() {
  const tickets = await db.supportTicket.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  const openCount = tickets.filter((t) => t.status === 'open').length

  return (
    <>
      <AdminHeader title="Support tickets" subtitle="All customer support requests — respond, assign, and close tickets." />
      <div className="p-8 max-w-4xl">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{openCount}</div>
            <div className="text-sm text-gray-500 mt-1">Open</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{tickets.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total tickets</div>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No tickets yet. Enable Support Tickets in Features so customers can submit questions.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {tickets.map((t) => (
              <Link key={t.id} href={`/admin/support/tickets/${t.id}`} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.customerEmail} · {format(t.createdAt, 'dd MMM yyyy')}</p>
                  {t.assignedTo && <p className="text-xs text-gray-400 mt-0.5">Assigned to {t.assignedTo}</p>}
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
