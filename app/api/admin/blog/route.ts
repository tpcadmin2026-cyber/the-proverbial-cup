import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const posts = await db.blogPost.findMany({
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, slug: true, title: true, category: true,
        published: true, featured: true, publishedAt: true, createdAt: true,
      },
    })
    return NextResponse.json({ posts })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, author, tags, category, published, featured } = body
    const post = await db.blogPost.create({
      data: {
        title, slug,
        excerpt: excerpt || null,
        content: content || '',
        coverImage: coverImage || null,
        author: author || '',
        tags: tags || '',
        category: category || '',
        published: published ?? false,
        featured: featured ?? false,
        publishedAt: published ? new Date() : null,
      },
    })
    return NextResponse.json({ post })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
