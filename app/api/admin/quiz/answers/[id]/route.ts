import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { text, matchRules } = await req.json()
  const answer = await db.quizAnswer.update({
    where: { id },
    data: { text, matchRules: matchRules !== undefined ? JSON.stringify(matchRules) : undefined },
  })
  return NextResponse.json(answer)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  await db.quizAnswer.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
