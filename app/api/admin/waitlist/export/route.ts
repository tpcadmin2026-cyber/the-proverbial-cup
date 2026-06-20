import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'

export async function GET() {
  try {
    await requireAdmin()
    const entries = await db.waitlistEntry.findMany({ orderBy: { position: 'asc' } })

    const header = ['Position', 'Email', 'Name', 'Message', 'Notified', 'Signed Up']
    const rows = entries.map((e) => [
      e.position ?? '',
      e.email,
      e.name ?? '',
      (e.message ?? '').replace(/"/g, '""'),
      e.notified ? 'Yes' : 'No',
      format(e.createdAt, 'dd/MM/yyyy'),
    ])

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="waitlist-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }
}
