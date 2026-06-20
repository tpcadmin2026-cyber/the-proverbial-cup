import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { logChange } from '@/lib/changelog'
import { trackEvent } from '@/lib/posthog'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest) {
  if (!await isEnabled('subscriptions')) return NextResponse.json({ error: 'Subscriptions are not enabled.' }, { status: 403 })
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) return NextResponse.json({ error: 'You must be logged in to subscribe.' }, { status: 401 })

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: true } } },
  })
  if (!session || session.expires < new Date()) {
    return NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  const user = session.user
  if (user.subscription) {
    return NextResponse.json({ error: 'You already have an active subscription.' }, { status: 400 })
  }

  const body = await req.json()
  const { planSlug } = body
  if (!planSlug) return NextResponse.json({ error: 'Plan is required.' }, { status: 400 })

  const plan = await db.subscriptionPlan.findUnique({ where: { slug: planSlug, visible: true } })
  if (!plan) return NextResponse.json({ error: 'Subscription plan not found.' }, { status: 404 })

  // Create subscription in pending state (Stripe will confirm it later)
  await db.userSubscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status: 'pending',
      billingInterval: 'monthly',
    },
  })

  // Upgrade user role to subscriber if they were just a customer/visitor
  if (user.role === 'customer' || user.role === 'subscriber') {
    await db.user.update({ where: { id: user.id }, data: { role: 'subscriber' } })
  }

  await logChange({
    eventType: 'subscription',
    title: `${user.email} reserved subscription: ${plan.name}`,
    actor: user.email,
    metadata: { userId: user.id, planId: plan.id, planName: plan.name },
  })

  await trackEvent(user.email, 'subscription_started', { plan: plan.name, planSlug: plan.slug })
  return NextResponse.json({ ok: true })
}
