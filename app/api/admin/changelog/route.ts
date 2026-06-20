import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getChangelog, logChange, type ChangelogEventType } from '@/lib/changelog'

// GET /api/admin/changelog?limit=50&type=deploy
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const eventType = searchParams.get('type') as ChangelogEventType | undefined
    const entries = await getChangelog({ limit, eventType })
    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}

// POST /api/admin/changelog — create a manual entry
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { title, description } = await req.json() as { title: string; description?: string }
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    await logChange({
      eventType: 'manual',
      title,
      description,
      actor: session.email ?? 'admin',
      isPublic: false,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
