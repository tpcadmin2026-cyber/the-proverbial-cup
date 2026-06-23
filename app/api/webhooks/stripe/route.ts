import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripeAsync } from '@/lib/stripe'
import { logChange } from '@/lib/changelog'
import { trackEvent } from '@/lib/posthog'
import { sendSubscriptionConfirmationEmail, sendOrderConfirmationEmail } from '@/lib/auth-utils'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = await getStripeAsync()
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    event = webhookSecret && sig
      ? stripe.webhooks.constructEvent(body, sig, webhookSecret)
      : JSON.parse(body) // allow unsigned events in dev without secret
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, planId, planSlug } = session.metadata ?? {}

        if (session.mode === 'subscription' && userId && planId) {
          const stripeSubId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

          await db.userSubscription.upsert({
            where: { userId },
            update: { status: 'active', stripeSubscriptionId: stripeSubId ?? null, planId },
            create: { userId, planId, status: 'active', stripeSubscriptionId: stripeSubId ?? null, billingInterval: 'monthly' },
          })
          await db.user.update({ where: { id: userId }, data: { role: 'subscriber', stripeCustomerId: session.customer as string } })

          const user = await db.user.findUnique({ where: { id: userId }, include: { subscription: { include: { plan: true } } } })
          await logChange({ eventType: 'subscription', title: `Subscription activated: ${user?.email}`, actor: 'stripe', metadata: { planSlug } })
          if (user?.email) await trackEvent(user.email, 'subscription_activated', { planSlug })
          if (user?.email && user.subscription?.plan) {
            const plan = user.subscription.plan
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
            const interval = user.subscription.billingInterval ?? 'monthly'
            const cents = interval === 'yearly' ? plan.priceYearly : plan.priceMonthly
            const price = cents != null ? `£${(cents / 100).toFixed(2)}` : ''
            await sendSubscriptionConfirmationEmail({
              email: user.email,
              name: user.name ?? undefined,
              planName: plan.name,
              price,
              billingInterval: interval,
              baseUrl,
            }).catch(console.error)
          }
        }

        if (session.mode === 'payment' && userId) {
          const user = await db.user.findUnique({ where: { id: userId } })
          const amountTotal = session.amount_total ?? 0
          await db.order.create({
            data: {
              customerEmail: session.customer_details?.email ?? user?.email ?? '',
              customerName: session.customer_details?.name ?? user?.name ?? null,
              lineItems: JSON.stringify([]),
              totalCents: amountTotal,
              currency: session.currency?.toUpperCase() ?? 'USD',
              status: 'paid',
              stripePaymentId: session.payment_intent as string ?? null,
              shippingAddress: session.shipping_details ? JSON.stringify(session.shipping_details) : null,
            },
          })
          if (user?.email) await trackEvent(user.email, 'order_placed', { total: amountTotal / 100 })
          const orderEmail = session.customer_details?.email ?? user?.email
          if (orderEmail) {
            await sendOrderConfirmationEmail({
              email: orderEmail,
              name: session.customer_details?.name ?? user?.name ?? undefined,
              orderNumber: String(Date.now()).slice(-8),
              items: [],
              subtotal: `${(amountTotal / 100).toFixed(2)}`,
              total: `${(amountTotal / 100).toFixed(2)}`,
            }).catch(console.error)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status === 'canceled' ? 'cancelled' : sub.status
        await db.userSubscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await db.userSubscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: 'cancelled', cancelledAt: new Date() },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        if (subId) {
          await db.userSubscription.updateMany({
            where: { stripeSubscriptionId: subId },
            data: { status: 'past_due' },
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('[stripe webhook] handler error', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
