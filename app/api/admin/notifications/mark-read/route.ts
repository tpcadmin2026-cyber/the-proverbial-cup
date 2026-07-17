import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { type } = await req.json().catch(() => ({}))
    await db.notification.updateMany({
      where: { read: false, ...(type ? { type } : {}) },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}
