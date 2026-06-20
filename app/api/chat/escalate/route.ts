import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/posthog'

export async function POST(req: NextRequest) {
  try {
    const { sessionId, name, email } = await req.json()
    if (!sessionId || !email) return NextResponse.json({ error: 'sessionId and email required' }, { status: 400 })

    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    // Build transcript for the ticket body
    const transcript = session.messages
      .map(m => `${m.role === 'user' ? (name || 'Visitor') : 'Cornelius'}: ${m.content}`)
      .join('\n\n')

    const ticket = await db.supportTicket.create({
      data: {
        subject: 'Chat escalation — visitor requested human support',
        body: `This ticket was escalated from a Cornelius AI chat session.\n\n--- Transcript ---\n\n${transcript}`,
        customerEmail: email,
        customerName: name || null,
        priority: 'normal',
      },
    })

    // Mark messages as escalated
    await db.chatMessage.updateMany({ where: { sessionId }, data: { escalated: true } })

    await trackEvent(email, 'chat_escalated', { ticketId: ticket.id, messageCount: session.messages.length })

    return NextResponse.json({ success: true, ticketId: ticket.id })
  } catch {
    return NextResponse.json({ error: 'Failed to escalate chat.' }, { status: 500 })
  }
}
