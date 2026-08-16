import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendTicketNotificationEmail } from '@/lib/auth-utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    await requireAdmin()
    const { ticketId } = await params
    const { action, body, author } = await req.json()

    if (action === 'reply') {
      if (!body?.trim()) return NextResponse.json({ error: 'Reply body is required.' }, { status: 400 })
      const ticket = await db.ticketMessage.create({
        data: { ticketId, body, author: author ?? 'admin', isAdmin: true },
        include: { ticket: true },
      })
      // Move to in_progress if still open
      await db.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'in_progress', updatedAt: new Date() },
      })

      const baseUrl = req.nextUrl.origin
      await sendTicketNotificationEmail({
        to: ticket.ticket.customerEmail,
        kind: 'reply',
        subject: ticket.ticket.subject,
        message: body.trim(),
        fromName: author ?? 'Our team',
        ticketUrl: `${baseUrl}/support/${ticketId}`,
      }).catch(console.error)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    await requireAdmin()
    const { ticketId } = await params
    const { status, priority, assignedTo } = await req.json()

    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 })
  }
}
