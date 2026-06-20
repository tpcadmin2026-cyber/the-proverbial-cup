export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'

export async function GET() {
  if (!await isEnabled('quiz')) return NextResponse.json({ error: 'Quiz is not enabled.' }, { status: 403 })
  const questions = await db.quizQuestion.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
    include: { answers: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(questions)
}
