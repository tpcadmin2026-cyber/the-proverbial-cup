import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getUnreadCounts } from '@/lib/notifications'

export async function GET() {
  try {
    await requireAdmin()
    const byType = await getUnreadCounts()
    const total = Object.values(byType).reduce((sum, n) => sum + n, 0)
    return NextResponse.json({ total, byType })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}
