import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const question = await db.quizQuestion.update({ where: { id }, data })
  return NextResponse.json(question)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.quizQuestion.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

// POST to add an answer to this question
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: questionId } = await params
  const { text, matchRules } = await req.json()
  const count = await db.quizAnswer.count({ where: { questionId } })
  const answer = await db.quizAnswer.create({
    data: { questionId, text, order: count + 1, matchRules: matchRules ? JSON.stringify(matchRules) : null },
  })
  return NextResponse.json(answer)
}
