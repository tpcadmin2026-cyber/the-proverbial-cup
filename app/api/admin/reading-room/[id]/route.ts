import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { title, slug, excerpt, content, coverImage, published } = await req.json()

    const existing = await db.readingRoomPost.findUnique({ where: { id }, select: { published: true } })
    const wasPublished = existing?.published ?? false

    const post = await db.readingRoomPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(slug !== undefined && { slug: slug.trim() }),
        ...(excerpt !== undefined && { excerpt: excerpt?.trim() || null }),
        ...(content !== undefined && { content: content.trim() }),
        ...(coverImage !== undefined && { coverImage: coverImage?.trim() || null }),
        ...(published !== undefined && {
          published,
          publishedAt: published && !wasPublished ? new Date() : undefined,
        }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, post })
  } catch {
    return NextResponse.json({ error: 'Failed to update post.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.readingRoomPost.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete post.' }, { status: 500 })
  }
}
