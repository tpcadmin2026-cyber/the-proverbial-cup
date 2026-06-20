import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { TicketActions } from './TicketActions'

interface Props {
  params: Promise<{ ticketId: string }>
}

const STATUS_STYLES: Record<string, string> = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting:     'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
}

const PRIORITY_STYLES: Record<string, string> = {
  low:    'bg-gray-100 text-gray-500',
  normal: 'bg-blue-50 text-blue-600',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default async function TicketDetailPage({ params }: Props) {
  const { ticketId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  const session = token ? await db.session.findUnique({ where: { sessionToken: token }, include: { user: true } }) : null
  const adminEmail = session?.user?.email ?? 'admin'

  const [ticket, admins] = await Promise.all([
    db.supportTicket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    }),
    db.user.findMany({
      where: { role: { in: ['admin', 'master_admin', 'manager', 'employee'] } },
      select: { email: true, name: true },
      orderBy: { email: 'asc' },
    }),
  ])

  if (!ticket) notFound()

  return (
    <>
      <AdminHeader
        title={`Ticket #${ticketId.slice(-6).toUpperCase()}`}
        subtitle={ticket.subject}
      />
      <div className="p-8 max-w-3xl space-y-6">

        {/* Meta card */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">From</div>
            <div className="font-medium text-gray-900 truncate">{ticket.customerEmail}</div>
            {ticket.customerName && <div className="text-xs text-gray-400">{ticket.customerName}</div>}
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Priority</div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${PRIORITY_STYLES[ticket.priority] ?? ''}`}>
              {ticket.priority}
            </span>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Opened</div>
            <div className="text-gray-700">{format(ticket.createdAt, 'dd MMM yyyy')}</div>
          </div>
          {ticket.assignedTo && (
            <div className="col-span-2">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Assigned to</div>
              <div className="text-gray-700">{ticket.assignedTo}</div>
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="space-y-3">
          {/* Original message */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">{ticket.customerEmail}</span>
              <span>{format(ticket.createdAt, 'dd MMM yyyy, HH:mm')}</span>
            </div>
            <div className="px-4 py-4 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{ticket.body}</div>
          </div>

          {/* Replies */}
          {ticket.messages.map((msg) => (
            <div key={msg.id} className={`border rounded-lg overflow-hidden ${msg.isAdmin ? 'border-[#c8c4a8] bg-[#faf9f4]' : 'border-gray-200 bg-white'}`}>
              <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${msg.isAdmin ? 'bg-[#f5f2e8] border-[#e8e4d0] text-[#C4AB77]' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                <span className="font-medium">{msg.isAdmin ? `${msg.author} (team)` : msg.author}</span>
                <span>{format(msg.createdAt, 'dd MMM yyyy, HH:mm')}</span>
              </div>
              <div className="px-4 py-4 text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{msg.body}</div>
            </div>
          ))}
        </div>

        {/* Actions: reply, status, priority, assign */}
        <TicketActions
          ticketId={ticket.id}
          currentStatus={ticket.status}
          currentPriority={ticket.priority}
          currentAssignee={ticket.assignedTo ?? ''}
          adminEmail={adminEmail}
          admins={admins}
        />

      </div>
    </>
  )
}
