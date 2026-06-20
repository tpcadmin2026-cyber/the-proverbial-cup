import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { indexArticle, removeFromIndex } from '@/lib/search'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const { articleId } = await params
    const { title, body, categoryId, published } = await req.json()

    const article = await db.kbArticle.update({
      where: { id: articleId },
      data: {
        ...(title     !== undefined && { title }),
        ...(body      !== undefined && { body }),
        ...(categoryId !== undefined && { categoryId }),
        ...(published !== undefined && { published }),
      },
    })

    // Keep search index in sync
    await indexArticle(articleId).catch(console.error)

    return NextResponse.json({ success: true, article })
  } catch {
    return NextResponse.json({ error: 'Failed to update article.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const { articleId } = await params
    await db.kbArticle.delete({ where: { id: articleId } })
    await removeFromIndex('article', articleId).catch(console.error)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete article.' }, { status: 500 })
  }
}
