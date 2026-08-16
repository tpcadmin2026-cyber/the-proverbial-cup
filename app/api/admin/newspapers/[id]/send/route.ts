import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { sendHtmlEmail } from '@/lib/auth-utils'
import { NewspaperIssue } from '@/emails/NewspaperIssue'
import React from 'react'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params

    const issue = await db.cmsPage.findUnique({
      where: { id },
      include: { blocks: { where: { visible: true }, orderBy: { blockOrder: 'asc' } } },
    })
    if (!issue || issue.pageType !== 'newspaper') {
      return NextResponse.json({ error: 'Issue not found.' }, { status: 404 })
    }
    if (issue.blocks.length === 0) {
      return NextResponse.json({ error: 'This issue has no content yet.' }, { status: 400 })
    }

    const subscribers = await db.newsletterSubscriber.findMany({
      where: { confirmed: true, unsubscribedAt: null },
      select: { id: true, email: true },
    })
    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No confirmed subscribers to send to.' }, { status: 400 })
    }

    let sent = 0
    const failed: string[] = []

    for (const sub of subscribers) {
      try {
        const unsubscribeUrl = `${req.nextUrl.origin}/api/newsletter/unsubscribe?id=${sub.id}`
        const emailEl = React.createElement(NewspaperIssue, {
          title: issue.tabLabel,
          blocks: issue.blocks.map((b) => ({ blockType: b.blockType, content: b.content ?? '' })),
          unsubscribeUrl,
        })
        await sendHtmlEmail({ to: sub.email, subject: issue.tabLabel, react: emailEl as React.ReactElement })
        sent++
      } catch {
        failed.push(sub.email)
      }
    }

    await db.cmsPage.update({ where: { id }, data: { sentAt: new Date() } })

    return NextResponse.json({ sent, failed, total: subscribers.length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: 'Failed to send issue.' }, { status: 500 })
  }
}
