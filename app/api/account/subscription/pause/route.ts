import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { logChange } from '@/lib/changelog'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: true } } },
  })
  if (!session || session.expires < new Date()) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
  }

  const sub = session.user.subscription
  if (!sub) return NextResponse.json({ error: 'No active subscription.' }, { status: 400 })
  if (sub.status !== 'active' && sub.status !== 'trialing') {
    return NextResponse.json({ error: 'Subscription cannot be paused in its current state.' }, { status: 400 })
  }

  const body = await req.json()
  const { resumeDate } = body
  if (!resumeDate) return NextResponse.json({ error: 'Resume date is required.' }, { status: 400 })

  const resumeAt = new Date(resumeDate + 'T12:00:00')
  if (isNaN(resumeAt.getTime()) || resumeAt <= new Date()) {
    return NextResponse.json({ error: 'Resume date must be in the future.' }, { status: 400 })
  }

  await db.userSubscription.update({
    where: { id: sub.id },
    data: {
      status: 'paused',
      pausedAt: new Date(),
      pauseResumesAt: resumeAt,
    },
  })

  await logChange({
    eventType: 'subscription',
    title: `Subscription paused: ${session.user.email}`,
    actor: session.user.email,
    metadata: { userId: session.user.id, resumeDate },
  })

  return NextResponse.json({ ok: true })
}
