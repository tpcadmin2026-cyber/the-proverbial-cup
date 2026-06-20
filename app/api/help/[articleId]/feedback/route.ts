import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  try {
    const { articleId } = await params
    const { helpful } = await req.json()

    await db.kbArticle.update({
      where: { id: articleId },
      data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to record feedback.' }, { status: 500 })
  }
}
