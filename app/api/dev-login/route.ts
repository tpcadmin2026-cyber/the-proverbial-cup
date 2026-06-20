// Local development only — visiting this URL logs you in as admin instantly.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  const email = 'travis@example.com'

  const user = await db.user.upsert({
    where: { email },
    update: { role: 'master_admin', emailVerified: new Date() },
    create: { email, role: 'master_admin', name: 'Travis', emailVerified: new Date() },
  })

  const token = `dev-${Date.now()}`
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)

  await db.session.create({
    data: { sessionToken: token, userId: user.id, expires },
  })

  // Set the cookie directly on the redirect response so it's sent together
  const response = NextResponse.redirect(new URL('/admin', req.url))
  response.cookies.set('authjs.session-token', token, {
    httpOnly: true,
    path: '/',
    expires,
    sameSite: 'lax',
    secure: false,
  })

  return response
}
