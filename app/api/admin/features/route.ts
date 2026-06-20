import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getAllFlags, toggleFlag, type FeatureFlagKey } from '@/lib/features'

// GET /api/admin/features — return all feature flags
export async function GET() {
  try {
    await requireAdmin()
    const flags = await getAllFlags()
    return NextResponse.json({ flags })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}

// POST /api/admin/features — toggle a feature flag
export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { key, enabled } = await req.json() as { key: FeatureFlagKey; enabled: boolean }
    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    await toggleFlag(key, enabled, session.user?.email ?? 'admin')
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
