import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getStripeAsync } from '@/lib/stripe'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest) {
  if (!await isEnabled('ecommerce')) return NextResponse.json({ error: 'Shop is not enabled.' }, { status: 403 })
  const stripe = await getStripeAsync()
  if (!stripe) {
    return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: { include: { plan: true } } } } },
  })
  if (!session || session.expires < new Date()) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })

  const user = session.user
  const { mode, planSlug, lineItems } = await req.json()

  const [successUrl, cancelUrl, currency] = await Promise.all([
    getSetting<string>('stripe.successUrl', '/account?payment=success'),
    getSetting<string>('stripe.cancelUrl', '/pricing'),
    getSetting<string>('payments.currency', 'GBP'),
  ])

  const baseUrl = req.nextUrl.origin

  if (mode === 'subscription' && planSlug) {
    const plan = await db.subscriptionPlan.findUnique({ where: { slug: planSlug, visible: true } })
    if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })

    const priceId = plan.stripePriceIdMonthly
    if (!priceId) return NextResponse.json({ error: 'This plan is not yet connected to Stripe.' }, { status: 400 })

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name ?? undefined })
      customerId = customer.id
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}${successUrl}`,
      cancel_url: `${baseUrl}${cancelUrl}`,
      metadata: { userId: user.id, planSlug, planId: plan.id },
      subscription_data: plan.trialDays > 0 ? { trial_period_days: plan.trialDays } : undefined,
    })

    return NextResponse.json({ url: checkoutSession.url })
  }

  if (mode === 'payment' && lineItems?.length) {
    // One-time shop checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems.map((item: { name: string; amount: number; quantity: number; stripePriceId?: string }) =>
        item.stripePriceId
          ? { price: item.stripePriceId, quantity: item.quantity }
          : {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: { name: item.name },
                unit_amount: item.amount,
              },
              quantity: item.quantity,
            }
      ),
      success_url: `${baseUrl}/shop/checkout?success=1`,
      cancel_url: `${baseUrl}/shop/cart`,
      customer_email: user.email,
      metadata: { userId: user.id },
      shipping_address_collection: { allowed_countries: ['GB', 'US', 'CA', 'AU', 'DE', 'FR'] },
    })

    return NextResponse.json({ url: checkoutSession.url })
  }

  return NextResponse.json({ error: 'Invalid checkout request.' }, { status: 400 })
}
