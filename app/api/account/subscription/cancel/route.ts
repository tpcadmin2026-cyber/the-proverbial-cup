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
  if (sub.status === 'cancelled') {
    return NextResponse.json({ error: 'Subscription is already cancelled.' }, { status: 400 })
  }

  const body = await req.json()
  const { reasonLabel, freeText } = body

  const cancelReason = [reasonLabel, freeText].filter(Boolean).join(' — ') || undefined

  await db.userSubscription.update({
    where: { id: sub.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: cancelReason ?? null,
    },
  })

  await logChange({
    eventType: 'subscription',
    title: `Subscription cancelled: ${session.user.email}`,
    actor: session.user.email,
    metadata: { userId: session.user.id, reason: cancelReason },
  })

  return NextResponse.json({ ok: true })
}
