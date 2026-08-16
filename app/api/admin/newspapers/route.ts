import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// POST — create a new newspaper issue (a CmsPage with pageType 'newspaper')
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title } = await req.json()
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required.' }, { status: 400 })
    }

    const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const existing = await db.cmsPage.findUnique({ where: { slug: slugBase } })
    const slug = existing ? `${slugBase}-${Date.now()}` : slugBase

    const issue = await db.cmsPage.create({
      data: {
        slug,
        tabLabel: title,
        tabNumeral: '',
        pageOrder: 0,
        pageType: 'newspaper',
        layout: 'columns-1',
        published: false,
        showInNav: false,
      },
    })

    return NextResponse.json({ success: true, issue })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: 'Failed to create issue.' }, { status: 500 })
  }
}
