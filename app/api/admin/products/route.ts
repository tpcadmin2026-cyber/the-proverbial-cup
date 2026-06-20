import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { indexProduct } from '@/lib/search'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { variants, ...data } = await req.json()
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
    return NextResponse.json({ product })
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
    return NextResponse.json({ product })
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
    await db.searchIndex.deleteMany({ where: { contentType: 'product', contentId: id } })
    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
