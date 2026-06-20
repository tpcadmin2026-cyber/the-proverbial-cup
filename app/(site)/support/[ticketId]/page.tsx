import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { format } from 'date-fns'
import { CustomerReplyForm } from './CustomerReplyForm'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Support Request' }
}

const STATUS_STYLES: Record<string, string> = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting:     'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function SupportTicketPage({ params }: { params: Promise<{ ticketId: string }> }) {
  if (!await isEnabled('support_tickets')) notFound()

  const { ticketId } = await params
  const siteName = await getSetting<string>('site.name', 'My Site')

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!ticket) notFound()

  // Verify the viewer owns this ticket (or is logged in and matches email)
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  let canReply = false

  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      select: { expires: true, user: { select: { email: true, role: true } } },
    })
    if (session && session.expires > new Date()) {
      const isAdmin = ['admin', 'master_admin', 'manager', 'employee'].includes(session.user.role)
      if (isAdmin || session.user.email === ticket.customerEmail) {
        canReply = true
      }
    }
  }

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
              {siteName}
            </div>
          </Link>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2">
            <h1 className="font-playfair text-2xl text-[#35291C] tracking-wide">Support Request</h1>
          </div>
        </div>

        {/* Ticket header */}
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-playfair text-lg text-[#35291C]">{ticket.subject}</p>
              <p className="text-xs text-[#C4AB77] mt-1">
                Ref #{ticket.id.slice(-8).toUpperCase()} · {format(ticket.createdAt, 'dd MMM yyyy')}
              </p>
            </div>
            <span className={`flex-shrink-0 text-xs px-2 py-1 rounded font-medium capitalize ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {ticket.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Thread */}
        <div className="space-y-3 mb-6">
          {/* Original message */}
          <div className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-[#faf9f4] border-b border-[#e8e4d0] flex justify-between text-xs text-[#C4AB77]">
              <span className="font-semibold text-[#35291C]">{ticket.customerName ?? ticket.customerEmail}</span>
              <span>{format(ticket.createdAt, 'dd MMM yyyy, HH:mm')}</span>
            </div>
            <div className="px-4 py-4 text-sm text-[#35291C] font-baskerville leading-relaxed whitespace-pre-wrap">{ticket.body}</div>
          </div>

          {/* Replies */}
          {ticket.messages.map((msg) => (
            <div key={msg.id} className={`border rounded-lg overflow-hidden ${msg.isAdmin ? 'border-[#C4AB77] bg-[#fdf8ee]' : 'border-[#c8c4a8] bg-white'}`}>
              <div className={`px-4 py-2 border-b flex justify-between text-xs ${msg.isAdmin ? 'bg-[#f5edd5] border-[#e8d88a] text-[#7A564C]' : 'bg-[#faf9f4] border-[#e8e4d0] text-[#C4AB77]'}`}>
                <span className="font-semibold text-[#35291C]">{msg.isAdmin ? `${msg.author} (Support Team)` : msg.author}</span>
                <span>{format(msg.createdAt, 'dd MMM yyyy, HH:mm')}</span>
              </div>
              <div className="px-4 py-4 text-sm text-[#35291C] font-baskerville leading-relaxed whitespace-pre-wrap">{msg.body}</div>
            </div>
          ))}
        </div>

        {/* Reply form for the ticket owner */}
        {canReply && ticket.status !== 'closed' && (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-6">
            <h2 className="font-playfair text-base text-[#35291C] mb-4">Add a Reply</h2>
            <CustomerReplyForm ticketId={ticket.id} author={ticket.customerEmail} />
          </div>
        )}

        {ticket.status === 'closed' && (
          <div className="bg-[#faf9f4] border border-[#c8c4a8] rounded-lg p-4 text-center">
            <p className="font-baskerville italic text-[#4B4C44] text-sm">This request has been closed. To raise a new enquiry, please <Link href="/support" className="text-[#C4AB77] hover:underline">submit a new request</Link>.</p>
          </div>
        )}

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/support" className="text-[#C4AB77] hover:underline">← Back to Support</Link>
        </div>
      </div>
    </div>
  )
}
