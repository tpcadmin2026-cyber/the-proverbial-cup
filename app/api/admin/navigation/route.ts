import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  await requireAdmin()
  const { label, numeral, href, navOrder, openInNewTab } = await req.json()
  if (!label || !href) return NextResponse.json({ error: 'label and href required' }, { status: 400 })
  const count = await db.navItem.count()
  const item = await db.navItem.create({
    data: { label, numeral: numeral || '→', href, navOrder: navOrder ?? (count + 1) * 10, openInNewTab: openInNewTab ?? false },
  })
  return NextResponse.json(item)
}
