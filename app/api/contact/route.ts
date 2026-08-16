import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/posthog'
import { isEnabled } from '@/lib/features'
import { getSetting } from '@/lib/settings'
import { sendTicketNotificationEmail } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  if (!await isEnabled('contact_form')) return NextResponse.json({ error: 'Contact form is not enabled.' }, { status: 403 })
  try {
    const { name, email, subject, message } = await req.json()

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Email, subject, and message are required.' }, { status: 400 })
    }

    const ticket = await db.supportTicket.create({
      data: {
        subject,
        body: message,
        customerEmail: email,
        customerName: name || null,
        status: 'open',
        priority: 'normal',
      },
    })

    await trackEvent(email, 'contact_submitted', { subject, ticketId: ticket.id })

    const notifyEmail = await getSetting<string>('site.contactEmail', '')
    if (notifyEmail) {
      const baseUrl = req.nextUrl.origin
      await sendTicketNotificationEmail({
        to: notifyEmail,
        kind: 'new',
        subject,
        message: `From: ${name || email} <${email}>\n\n${message}`,
        ticketUrl: `${baseUrl}/admin/support/tickets/${ticket.id}`,
      }).catch(console.error)
    }

    return NextResponse.json({ success: true, ticketId: ticket.id })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
