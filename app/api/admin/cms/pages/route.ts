import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { tabLabel, tabNumeral, pageOrder, layout, sectionLabel, published, showInNav, blocks } = await req.json()

    if (!tabLabel || !tabNumeral) {
      return NextResponse.json({ error: 'Tab label and numeral are required.' }, { status: 400 })
    }

    const slug = tabLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const existing = await db.cmsPage.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const page = await db.cmsPage.create({
      data: {
        slug: finalSlug,
        tabLabel,
        tabNumeral,
        pageOrder: pageOrder ?? 1,
        layout: layout ?? 'columns-3',
        sectionLabel: sectionLabel || null,
        published: published ?? false,
        showInNav: showInNav ?? true,
        blocks: {
          create: (blocks ?? []).map((b: { blockType: string; content?: string; column?: number; visible?: boolean; blockOrder: number }) => ({
            blockType: b.blockType,
            content: b.content ?? null,
            column: b.column ?? 1,
            visible: b.visible ?? true,
            blockOrder: b.blockOrder,
          })),
        },
      },
    })

    return NextResponse.json({ success: true, page })
  } catch {
    return NextResponse.json({ error: 'Failed to create page.' }, { status: 500 })
  }
}
