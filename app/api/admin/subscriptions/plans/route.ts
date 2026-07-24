import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { syncStripeProductRecord, syncStripePrice, archiveStripeProduct } from '@/lib/stripeSync'

function stripeErrorMessage(err: unknown): string {
  return `Saved, but Stripe sync failed: ${err instanceof Error ? err.message : 'unknown error'}. You can retry by saving again.`
}

export async function GET() {
  try {
    await requireAdmin()
    const plans = await db.subscriptionPlan.findMany({ orderBy: { displayOrder: 'asc' } })
    return NextResponse.json({ plans })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const data = await req.json()

    let stripeWarning: string | null = null
    try {
      const stripeProductId = await syncStripeProductRecord({
        name: data.name,
        description: data.description,
        existingStripeProductId: data.stripeProductId || null,
        metadata: { slug: data.slug, kind: 'subscription-plan' },
      })
      data.stripeProductId = stripeProductId
      data.stripePriceIdMonthly = await syncStripePrice({
        stripeProductId,
        amountInCents: data.priceMonthly,
        existingStripePriceId: null,
        existingAmountInCents: null,
        recurring: { interval: 'month' },
      })
      data.stripePriceIdYearly = await syncStripePrice({
        stripeProductId,
        amountInCents: data.priceYearly,
        existingStripePriceId: null,
        existingAmountInCents: null,
        recurring: { interval: 'year' },
      })
    } catch (stripeErr) {
      stripeWarning = stripeErrorMessage(stripeErr)
    }

    const plan = await db.subscriptionPlan.create({ data })
    return NextResponse.json({ plan, stripeWarning })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, ...data } = await req.json()

    const existing = await db.subscriptionPlan.findUnique({ where: { id } })

    let stripeWarning: string | null = null
    try {
      const stripeProductId = await syncStripeProductRecord({
        name: data.name,
        description: data.description,
        existingStripeProductId: data.stripeProductId || existing?.stripeProductId || null,
        metadata: { slug: data.slug, kind: 'subscription-plan' },
      })
      data.stripeProductId = stripeProductId
      data.stripePriceIdMonthly = await syncStripePrice({
        stripeProductId,
        amountInCents: data.priceMonthly,
        existingAmountInCents: existing?.priceMonthly ?? null,
        existingStripePriceId: data.stripePriceIdMonthly || existing?.stripePriceIdMonthly || null,
        recurring: { interval: 'month' },
      })
      data.stripePriceIdYearly = await syncStripePrice({
        stripeProductId,
        amountInCents: data.priceYearly,
        existingAmountInCents: existing?.priceYearly ?? null,
        existingStripePriceId: data.stripePriceIdYearly || existing?.stripePriceIdYearly || null,
        recurring: { interval: 'year' },
      })
    } catch (stripeErr) {
      stripeWarning = stripeErrorMessage(stripeErr)
    }

    const plan = await db.subscriptionPlan.update({ where: { id }, data })
    return NextResponse.json({ plan, stripeWarning })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const existing = await db.subscriptionPlan.findUnique({ where: { id } })
    await db.subscriptionPlan.delete({ where: { id } })
    await archiveStripeProduct(existing?.stripeProductId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
