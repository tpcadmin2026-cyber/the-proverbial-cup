import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getUploadUrl } from '@/lib/r2'
import { randomBytes } from 'crypto'
import path from 'path'

// POST /api/admin/media/upload
// Body: { filename: string, contentType: string }
// Returns: { uploadUrl, publicUrl } — browser uploads directly to R2
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { filename, contentType } = await req.json()
    if (!filename || !contentType) {
      return NextResponse.json({ error: 'filename and contentType are required' }, { status: 400 })
    }

    const ext = path.extname(filename).toLowerCase()
    const key = `media/${Date.now()}-${randomBytes(4).toString('hex')}${ext}`

    const result = await getUploadUrl(key, contentType)
    if (!result) {
      return NextResponse.json({ error: 'R2 is not configured. Add credentials in Settings → Connections.' }, { status: 503 })
    }

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
