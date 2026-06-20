import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getSetting } from '@/lib/settings'
import { sendHtmlEmail } from '@/lib/auth-utils'
import React from 'react'

// GET — all entries (for client-side refresh)
export async function GET() {
  try {
    await requireAdmin()
    const entries = await db.waitlistEntry.findMany({ orderBy: { position: 'asc' } })
    return NextResponse.json({ entries })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}

// PATCH — mark one entry as notified or un-notified
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, notified } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const entry = await db.waitlistEntry.update({ where: { id }, data: { notified } })
    return NextResponse.json({ entry })
  } catch {
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
  }
}

// DELETE — remove one entry
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await db.waitlistEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 })
  }
}
