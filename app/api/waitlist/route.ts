import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { trackEvent } from '@/lib/posthog'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest) {
  if (!await isEnabled('waitlist')) return NextResponse.json({ error: 'Waitlist is not enabled.' }, { status: 403 })
  try {
    const { email, name, message } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'An email address is required.' }, { status: 400 })
    }

    const existing = await db.waitlistEntry.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: true, position: existing.position, alreadyOnList: true })
    }

    const count = await db.waitlistEntry.count()
    const position = count + 1

    await db.waitlistEntry.create({
      data: { email, name: name || null, message: message || null, position },
    })

    await trackEvent(email, 'waitlist_join', { position })
    return NextResponse.json({ success: true, position })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
