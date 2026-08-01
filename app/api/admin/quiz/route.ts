import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'quiz'
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { title } = await req.json()
    const baseTitle = title || 'New Quiz'

    // Guarantee a unique slug
    const base = slugify(baseTitle)
    let slug = base
    let n = 1
    while (await db.quiz.findUnique({ where: { slug } })) {
      slug = `${base}-${++n}`
    }

    const quiz = await db.quiz.create({ data: { slug, title: baseTitle } })
    return NextResponse.json(quiz)
  } catch (err) {
    const msg = err instanceof Error && err.message === 'Unauthorised' ? err.message : 'Failed to create quiz.'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorised' ? 401 : 500 })
  }
}
