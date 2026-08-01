import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { text, order, quizId } = await req.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  if (!quizId) return NextResponse.json({ error: 'quizId required' }, { status: 400 })

  const count = await db.quizQuestion.count({ where: { quizId } })
  const question = await db.quizQuestion.create({
    data: { text, order: order ?? count + 1, active: true, quizId },
    include: { answers: true },
  })
  return NextResponse.json(question)
}
