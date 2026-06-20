import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllSettings, saveSettings } from '@/lib/settings'

// GET /api/admin/settings — return all settings grouped by category
export async function GET() {
  try {
    await requireAdmin()
    const groups = await getAllSettings()
    return NextResponse.json({ groups })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}

// POST /api/admin/settings — save a batch of settings
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const { updates } = body as { updates: Record<string, unknown> }
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    await saveSettings(updates, session.user?.email ?? 'admin')
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
