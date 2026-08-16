import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/posthog'
import { isEnabled } from '@/lib/features'
import { generateToken, sendNewsletterConfirmationEmail } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  if (!await isEnabled('newsletter')) return NextResponse.json({ error: 'Newsletter sign-up is not enabled.' }, { status: 403 })
  try {
    const { email, name } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'An email address is required.' }, { status: 400 })
    }

    const existing = await db.newsletterSubscriber.findUnique({ where: { email } })
    if (existing && !existing.unsubscribedAt && existing.confirmed) {
      return NextResponse.json({ success: true, alreadySubscribed: true })
    }

    const confirmToken = generateToken()

    await db.newsletterSubscriber.upsert({
      where: { email },
      update: { name: name || null, unsubscribedAt: null, confirmToken },
      create: { email, name: name || null, source: 'website', confirmToken },
    })

    const confirmUrl = `${req.nextUrl.origin}/api/newsletter/confirm?token=${confirmToken}&email=${encodeURIComponent(email)}`
    await sendNewsletterConfirmationEmail({ email, name: name || undefined, confirmUrl }).catch(console.error)

    await trackEvent(email, 'newsletter_signup', { name: name || null })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
