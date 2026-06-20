import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  await requireAdmin()
  const posts = await db.readingRoomPost.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(posts)
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title, slug, excerpt, content, coverImage, published } = await req.json()
    if (!title?.trim() || !slug?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Title, slug, and content are required.' }, { status: 400 })
    }

    const post = await db.readingRoomPost.create({
      data: {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt?.trim() || null,
        content: content.trim(),
        coverImage: coverImage?.trim() || null,
        published: published ?? false,
        publishedAt: published ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (err: unknown) {
    const isUniqueViolation = err instanceof Error && err.message.includes('Unique constraint')
    if (isUniqueViolation) return NextResponse.json({ error: 'That slug is already in use.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to create post.' }, { status: 500 })
  }
}
