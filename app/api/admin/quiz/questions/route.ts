import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { text, order } = await req.json()
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const count = await db.quizQuestion.count()
  const question = await db.quizQuestion.create({
    data: { text, order: order ?? count + 1, active: true },
    include: { answers: true },
  })
  return NextResponse.json(question)
}
