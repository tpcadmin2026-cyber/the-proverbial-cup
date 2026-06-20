import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { indexArticle } from '@/lib/search'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title, body, categoryId, published } = await req.json()
    if (!title || !body || !categoryId) {
      return NextResponse.json({ error: 'Title, body, and category are required.' }, { status: 400 })
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Handle slug collisions
    const existing = await db.kbArticle.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug

    const article = await db.kbArticle.create({
      data: { title, body, categoryId, published: published ?? false, slug: finalSlug },
    })
    await indexArticle(article.id).catch(console.error)
    return NextResponse.json({ success: true, article })
  } catch {
    return NextResponse.json({ error: 'Failed to create article.' }, { status: 500 })
  }
}
