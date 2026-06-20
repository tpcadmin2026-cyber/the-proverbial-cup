import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { indexArticle, indexProduct, indexPlan, indexPage } from '@/lib/search'

// POST /api/admin/seo — save SEO metadata for a content item and re-index it
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { contentType, contentId, ...fields } = await req.json()

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 })
    }

    const data = {
      focusKeyword:   fields.focusKeyword   ?? undefined,
      altKeywords:    fields.altKeywords    ?? undefined,
      seoTitle:       fields.seoTitle       ?? undefined,
      seoDescription: fields.seoDescription ?? undefined,
      canonicalUrl:   fields.canonicalUrl   ?? undefined,
      ogImage:        fields.ogImage        ?? undefined,
      noIndex:        typeof fields.noIndex === 'boolean' ? fields.noIndex : undefined,
      searchBoost:    typeof fields.searchBoost === 'number' ? fields.searchBoost : undefined,
    }

    await db.seoMeta.upsert({
      where: { contentType_contentId: { contentType, contentId } },
      create: { contentType, contentId, ...data },
      update: { ...data, updatedAt: new Date() },
    })

    // Re-index the content item so changes are immediately searchable
    switch (contentType) {
      case 'article': await indexArticle(contentId); break
      case 'product': await indexProduct(contentId); break
      case 'plan':    await indexPlan(contentId);    break
      case 'page':    await indexPage(contentId);    break
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// GET /api/admin/seo?contentType=article&contentId=xxx — load existing SEO meta
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const contentType = req.nextUrl.searchParams.get('contentType')
    const contentId   = req.nextUrl.searchParams.get('contentId')
    if (!contentType || !contentId) return NextResponse.json({ meta: null })

    const meta = await db.seoMeta.findUnique({
      where: { contentType_contentId: { contentType, contentId } },
    })
    return NextResponse.json({ meta })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
