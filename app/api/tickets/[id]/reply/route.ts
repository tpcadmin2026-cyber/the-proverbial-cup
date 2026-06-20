import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isEnabled('support_tickets')) return NextResponse.json({ error: 'Support tickets are not enabled.' }, { status: 403 })
  try {
    const { id } = await params
    const { body, author } = await req.json()

    if (!body?.trim()) return NextResponse.json({ error: 'Reply body is required.' }, { status: 400 })

    const ticket = await db.supportTicket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 })

    // Verify caller owns the ticket or is an authenticated user
    const cookieStore = await cookies()
    const token = cookieStore.get('authjs.session-token')?.value
    if (token) {
      const session = await db.session.findUnique({
        where: { sessionToken: token },
        select: { expires: true, user: { select: { email: true, role: true } } },
      })
      if (!session || session.expires < new Date()) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
      }
      const isAdmin = ['admin', 'master_admin', 'manager', 'employee'].includes(session.user.role)
      if (!isAdmin && session.user.email !== ticket.customerEmail) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
      }
    }

    await db.ticketMessage.create({
      data: { ticketId: id, body: body.trim(), author: author ?? ticket.customerEmail, isAdmin: false },
    })

    // Move back to open if resolved/waiting so admin sees it again
    if (['resolved', 'waiting'].includes(ticket.status)) {
      await db.supportTicket.update({ where: { id }, data: { status: 'open', updatedAt: new Date() } })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send reply.' }, { status: 500 })
  }
}
