import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSetting } from '@/lib/settings'
import { sendHtmlEmail } from '@/lib/auth-utils'
import React from 'react'

// POST — send launch notification to all un-notified entries (or specific ids)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { ids, subject, message } = body as { ids?: string[]; subject: string; message: string }

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
    }

    const where = ids?.length ? { id: { in: ids } } : { notified: false }
    const entries = await db.waitlistEntry.findMany({ where, select: { id: true, email: true, name: true } })

    if (entries.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No entries to notify.' })
    }

    const [siteName, siteUrl] = await Promise.all([
      getSetting<string>('site.name', 'The Proverbial Cup'),
      getSetting<string>('site.url', ''),
    ])

    let sent = 0
    const failed: string[] = []

    for (const entry of entries) {
      try {
        const greeting = entry.name ? `Dear ${entry.name},` : 'Dear Subscriber,'
        const paragraphs = message.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

        const emailHtml = React.createElement(
          'div',
          { style: { fontFamily: 'Georgia, serif', color: '#35291C', maxWidth: '600px', margin: '0 auto' } },
          React.createElement('div', { style: { borderTop: '4px solid #35291C', borderBottom: '1px solid #C4AB77', padding: '12px 0', marginBottom: '32px', textAlign: 'center' as const } },
            React.createElement('h1', { style: { fontFamily: 'Georgia, serif', fontSize: '24px', margin: 0, color: '#35291C' } }, siteName)
          ),
          React.createElement('p', { style: { fontSize: '16px', marginBottom: '16px' } }, greeting),
          ...paragraphs.map((p, i) =>
            React.createElement('p', { key: i, style: { fontSize: '16px', lineHeight: '1.7', marginBottom: '16px' } }, p)
          ),
          siteUrl ? React.createElement('div', { style: { marginTop: '32px', textAlign: 'center' as const } },
            React.createElement('a', {
              href: siteUrl,
              style: { background: '#35291C', color: '#E8E6D8', padding: '12px 28px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' }
            }, `Visit ${siteName}`)
          ) : null,
          React.createElement('hr', { style: { border: 'none', borderTop: '1px solid #e8e4d0', margin: '32px 0' } }),
          React.createElement('p', { style: { fontSize: '12px', color: '#4B4C44' } },
            `You received this because you joined the ${siteName} waitlist.`
          )
        )

        await sendHtmlEmail({ to: entry.email, subject, react: emailHtml as React.ReactElement })
        await db.waitlistEntry.update({ where: { id: entry.id }, data: { notified: true } })
        sent++
      } catch {
        failed.push(entry.email)
      }
    }

    return NextResponse.json({ sent, failed, total: entries.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
