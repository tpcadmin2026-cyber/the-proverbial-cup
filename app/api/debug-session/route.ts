export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('authjs.session-token')?.value

  if (!token) {
    return NextResponse.json({ error: 'No session cookie found' })
  }

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { select: { email: true, role: true } } },
  })

  if (!session) {
    return NextResponse.json({ error: 'No session in DB', tokenPrefix: token.slice(0, 8) })
  }

  return NextResponse.json({
    tokenPrefix: token.slice(0, 8),
    expires: session.expires,
    expired: session.expires < new Date(),
    email: session.user.email,
    role: session.user.role,
  })
}
