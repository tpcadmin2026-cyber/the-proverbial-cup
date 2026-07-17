import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStripeAsync } from '@/lib/stripe'
import { logChange } from '@/lib/changelog'
import { trackEvent } from '@/lib/posthog'
import { sendSubscriptionConfirmationEmail, sendOrderConfirmationEmail, sendNewOrderAdminEmail } from '@/lib/auth-utils'
import { createNotification } from '@/lib/notifications'
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
            const currency = session.currency?.toUpperCase() ?? 'USD'
            const price = cents != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100) : ''
            await sendSubscriptionConfirmationEmail({
              email: user.email,
              name: user.name ?? undefined,
              planName: plan.name,
              price,
              billingInterval: interval,
              baseUrl,
            }).catch(console.error)
            await createNotification({
              type: 'subscription',
              title: `New subscriber — ${plan.name}`,
              body: `${user.email} · ${interval}${price ? ` · ${price}` : ''}`,
              refId: user.id,
              metadata: { userId: user.id, email: user.email, name: user.name, planName: plan.name, interval, price },
            })
          }
        }

        if (session.mode === 'payment') {
          const user = userId ? await db.user.findUnique({ where: { id: userId } }) : null
          const amountTotal = session.amount_total ?? 0
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

          const stripeLineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
          const orderItems = stripeLineItems.data.map((li) => ({
            name: li.description ?? 'Item',
            quantity: li.quantity ?? 1,
            price: ((li.amount_total ?? 0) / 100).toFixed(2),
          }))

          const order = await db.order.create({
            data: {
              customerEmail: session.customer_details?.email ?? user?.email ?? '',
              customerName: session.customer_details?.name ?? user?.name ?? null,
              lineItems: JSON.stringify(orderItems),
              totalCents: amountTotal,
              currency: session.currency?.toUpperCase() ?? 'USD',
              status: 'paid',
              stripePaymentId: session.payment_intent as string ?? null,
              shippingAddress: session.shipping_details ? JSON.stringify(session.shipping_details) : null,
            },
          })
          const orderNumber = order.id.slice(-8).toUpperCase()
          const totalFormatted = `${(amountTotal / 100).toFixed(2)}`
          if (user?.email) await trackEvent(user.email, 'order_placed', { total: amountTotal / 100 })
          const orderEmail = session.customer_details?.email ?? user?.email
          const orderName = session.customer_details?.name ?? user?.name ?? undefined
          if (orderEmail) {
            await sendOrderConfirmationEmail({
              email: orderEmail,
              name: orderName,
              orderNumber,
              items: orderItems,
              subtotal: totalFormatted,
              total: totalFormatted,
            }).catch(console.error)
          }
          await createNotification({
            type: 'order',
            title: `New order #${orderNumber} — $${totalFormatted}`,
            body: `${orderItems.length} item(s) from ${orderEmail ?? 'guest'}`,
            refId: order.id,
            metadata: { orderId: order.id, customerEmail: orderEmail, customerName: orderName, items: orderItems, total: totalFormatted },
          })
          if (orderEmail) {
            await sendNewOrderAdminEmail({
              orderNumber,
              customerName: orderName,
              customerEmail: orderEmail,
              items: orderItems,
              total: totalFormatted,
              baseUrl,
              orderId: order.id,
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
