import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { indexProduct } from '@/lib/search'
import { syncStripeProductRecord, syncStripePrice, archiveStripeProduct } from '@/lib/stripeSync'

function stripeErrorMessage(err: unknown): string {
  return `Saved, but Stripe sync failed: ${err instanceof Error ? err.message : 'unknown error'}. You can retry by saving again.`
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { variants, ...data } = await req.json()

    let stripeWarning: string | null = null
    try {
      const stripeProductId = await syncStripeProductRecord({
        name: data.name,
        description: data.description,
        existingStripeProductId: data.stripeProductId || null,
        metadata: { slug: data.slug },
      })
      data.stripeProductId = stripeProductId
      data.stripePriceId = await syncStripePrice({
        stripeProductId,
        amountInCents: data.priceInCents,
        existingStripePriceId: null,
        existingAmountInCents: null,
      })
      if (variants?.length) {
        for (const v of variants) {
          v.stripePriceId = await syncStripePrice({
            stripeProductId,
            amountInCents: v.priceInCents ?? data.priceInCents,
            existingStripePriceId: null,
            existingAmountInCents: null,
          })
        }
      }
    } catch (stripeErr) {
      stripeWarning = stripeErrorMessage(stripeErr)
    }

    const product = await db.product.create({
      data: {
        ...data,
        variants: variants?.length
          ? { create: variants }
          : undefined,
      },
      include: { variants: true },
    })
    await indexProduct(product.id)
    return NextResponse.json({ product, stripeWarning })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, variants, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const existing = await db.product.findUnique({ where: { id }, include: { variants: true } })

    let stripeWarning: string | null = null
    try {
      const stripeProductId = await syncStripeProductRecord({
        name: data.name,
        description: data.description,
        existingStripeProductId: data.stripeProductId || existing?.stripeProductId || null,
        metadata: { slug: data.slug },
      })
      data.stripeProductId = stripeProductId
      data.stripePriceId = await syncStripePrice({
        stripeProductId,
        amountInCents: data.priceInCents,
        existingAmountInCents: existing?.priceInCents ?? null,
        existingStripePriceId: data.stripePriceId || existing?.stripePriceId || null,
      })
      if (variants?.length) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i]
          const prevVariant = existing?.variants[i]
          v.stripePriceId = await syncStripePrice({
            stripeProductId,
            amountInCents: v.priceInCents ?? data.priceInCents,
            existingAmountInCents: prevVariant ? (prevVariant.priceInCents ?? existing!.priceInCents) : null,
            existingStripePriceId: v.stripePriceId || prevVariant?.stripePriceId || null,
          })
        }
      }
    } catch (stripeErr) {
      stripeWarning = stripeErrorMessage(stripeErr)
    }

    // Replace variants: delete all then re-create
    const product = await db.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } })
      return tx.product.update({
        where: { id },
        data: {
          ...data,
          variants: variants?.length
            ? { create: variants }
            : undefined,
        },
        include: { variants: true },
      })
    })
    await indexProduct(product.id)
    return NextResponse.json({ product, stripeWarning })
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
    const existing = await db.product.findUnique({ where: { id } })
    await db.searchIndex.deleteMany({ where: { contentType: 'product', contentId: id } })
    await db.product.delete({ where: { id } })
    await archiveStripeProduct(existing?.stripeProductId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
