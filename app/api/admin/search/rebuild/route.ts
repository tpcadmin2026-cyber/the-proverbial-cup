import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { rebuildSearchIndex } from '@/lib/search'
import { logChange } from '@/lib/changelog'

// POST /api/admin/search/rebuild — rebuild the full search index
export async function POST() {
  try {
    const session = await requireAdmin()
    const actor = session.user?.email ?? 'admin'

    const { indexed } = await rebuildSearchIndex()

    await logChange({
      eventType: 'manual',
      title:     `Search index rebuilt — ${indexed} items indexed`,
      actor,
    })

    return NextResponse.json({ ok: true, indexed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
