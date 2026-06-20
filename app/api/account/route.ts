import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { logChange } from '@/lib/changelog'

export async function DELETE() {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  })
  if (!session || session.expires < new Date()) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
  }

  const user = session.user

  await logChange({
    eventType: 'user',
    title: `Account deleted: ${user.email}`,
    actor: user.email,
    metadata: { userId: user.id },
  })

  // Cascading deletes handle sessions, subscription, and permissions
  await db.user.delete({ where: { id: user.id } })

  // Clear the session cookie
  const response = NextResponse.json({ ok: true })
  response.cookies.set('authjs.session-token', '', { maxAge: 0, path: '/' })
  return response
}
