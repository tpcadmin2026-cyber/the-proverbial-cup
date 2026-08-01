import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    await requireAdmin()
    const { quizId } = await params
    const { title, slug, heading, subheading, resultHeading, resultSubtext, visible } = await req.json()

    if (slug !== undefined) {
      const existing = await db.quiz.findUnique({ where: { slug } })
      if (existing && existing.id !== quizId) {
        return NextResponse.json({ error: 'That link is already used by another quiz.' }, { status: 400 })
      }
    }

    const quiz = await db.quiz.update({
      where: { id: quizId },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(heading !== undefined && { heading }),
        ...(subheading !== undefined && { subheading: subheading || null }),
        ...(resultHeading !== undefined && { resultHeading }),
        ...(resultSubtext !== undefined && { resultSubtext: resultSubtext || null }),
        ...(visible !== undefined && { visible }),
      },
    })
    return NextResponse.json(quiz)
  } catch {
    return NextResponse.json({ error: 'Failed to update quiz.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    await requireAdmin()
    const { quizId } = await params
    await db.quiz.delete({ where: { id: quizId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete quiz.' }, { status: 500 })
  }
}
