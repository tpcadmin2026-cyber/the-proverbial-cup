import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listMedia, deleteMedia } from '@/lib/r2'

// GET /api/admin/media — list uploaded files
export async function GET() {
  try {
    await requireAdmin()
    const files = await listMedia()
    return NextResponse.json({ files })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/admin/media — delete a file
// Body: { key: string }
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { key } = await req.json()
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })
    await deleteMedia(key)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
