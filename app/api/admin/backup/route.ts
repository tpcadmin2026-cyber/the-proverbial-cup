import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { triggerBackup, getRecentBackups } from '@/lib/backup'

// GET /api/admin/backup — list recent backups
export async function GET() {
  try {
    await requireAdmin()
    const backups = await getRecentBackups(10)
    return NextResponse.json({ backups })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}

// POST /api/admin/backup — trigger a manual backup
export async function POST() {
  try {
    const session = await requireAdmin()
    await triggerBackup('manual', session.user?.email ?? 'admin')
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
