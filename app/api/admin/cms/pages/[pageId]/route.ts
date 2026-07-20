import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    await requireAdmin()
    const { pageId } = await params
    const {
      tabLabel, tabNumeral, pageOrder, layout, sectionLabel, published, showInNav,
      publishAt, seoTitle, seoDescription, seoImage, customCss, customJs,
      blocks,
    } = await req.json()

    // Delete all existing blocks and recreate from the submitted list
    await db.contentBlock.deleteMany({ where: { pageId } })

    const page = await db.cmsPage.update({
      where: { id: pageId },
      data: {
        ...(tabLabel !== undefined && { tabLabel }),
        ...(tabNumeral !== undefined && { tabNumeral }),
        ...(pageOrder !== undefined && { pageOrder }),
        ...(layout !== undefined && { layout }),
        ...(sectionLabel !== undefined && { sectionLabel: sectionLabel || null }),
        ...(published !== undefined && { published }),
        ...(showInNav !== undefined && { showInNav }),
        ...(publishAt !== undefined && { publishAt: publishAt ? new Date(publishAt) : null }),
        ...(seoTitle !== undefined && { seoTitle: seoTitle || null }),
        ...(seoDescription !== undefined && { seoDescription: seoDescription || null }),
        ...(seoImage !== undefined && { seoImage: seoImage || null }),
        ...(customCss !== undefined && { customCss: customCss || null }),
        ...(customJs !== undefined && { customJs: customJs || null }),
        blocks: {
          create: (blocks ?? []).map((b: { blockType: string; content?: string; column?: number; colSpan?: number; visible?: boolean; blockOrder: number }) => ({
            blockType: b.blockType,
            content: b.content ?? null,
            column: b.column ?? 1,
            colSpan: b.colSpan ?? 1,
            visible: b.visible ?? true,
            blockOrder: b.blockOrder,
          })),
        },
      },
    })

    return NextResponse.json({ success: true, page })
  } catch {
    return NextResponse.json({ error: 'Failed to update page.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    await requireAdmin()
    const { pageId } = await params
    await db.cmsPage.delete({ where: { id: pageId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete page.' }, { status: 500 })
  }
}
