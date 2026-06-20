import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/auth-utils'

export async function PUT(req: NextRequest) {
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
  if (!user.passwordHash) {
    return NextResponse.json({ error: 'No password set on this account.' }, { status: 400 })
  }

  const body = await req.json()
  const { current, password } = body

  if (!current || !password) {
    return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 })
  }

  const valid = await verifyPassword(current, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
  }

  const strengthError = validatePasswordStrength(password)
  if (strengthError) return NextResponse.json({ error: strengthError }, { status: 400 })

  const newHash = await hashPassword(password)
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })

  return NextResponse.json({ ok: true })
}
