import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/posthog'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest) {
  if (!await isEnabled('newsletter')) return NextResponse.json({ error: 'Newsletter sign-up is not enabled.' }, { status: 403 })
  try {
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'An email address is required.' }, { status: 400 })
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } })
    if (existing && !existing.unsubscribedAt) {
      return NextResponse.json({ success: true, alreadySubscribed: true })
    }

    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { name: name || null, unsubscribedAt: null },
      create: { email, name: name || null, source: 'website' },
    })

    await trackEvent(email, 'newsletter_signup', { name: name || null })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
