import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, author, tags, category, published, featured } = body

    const existing = await db.blogPost.findUnique({ where: { id }, select: { published: true, publishedAt: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const post = await db.blogPost.update({
      where: { id },
      data: {
        title, slug,
        excerpt: excerpt || null,
        content: content || '',
        coverImage: coverImage || null,
        author: author || '',
        tags: tags || '',
        category: category || '',
        published,
        featured,
        // Set publishedAt the first time a post goes live
        publishedAt: published && !existing.publishedAt ? new Date() : existing.publishedAt,
      },
    })
    return NextResponse.json({ post })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    await db.blogPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
