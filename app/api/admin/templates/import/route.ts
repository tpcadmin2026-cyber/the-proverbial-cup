import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { importTemplate, type TemplateData } from '@/lib/templates'

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const data = await req.json() as TemplateData

    if (!data.templateVersion || !data.settings) {
      return NextResponse.json({ error: 'Invalid template file. Make sure you are uploading a file exported from this platform.' }, { status: 400 })
    }

    const result = await importTemplate(data)
    return NextResponse.json({ ok: true, imported: result.imported })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
