import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await req.json()
  const item = await db.navItem.update({ where: { id }, data })
  return NextResponse.json(item)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.navItem.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
