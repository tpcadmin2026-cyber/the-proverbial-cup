import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { exportTemplate } from '@/lib/templates'

export async function GET() {
  try {
    await requireAdmin()
    const template = await exportTemplate()
    const filename = `template-${template.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    return new NextResponse(JSON.stringify(template, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
