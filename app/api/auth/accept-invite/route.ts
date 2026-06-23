import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consumeVerificationToken, hashPassword, validatePasswordStrength, createSession } from '@/lib/auth-utils'
import { isAdminRole, INVITABLE_ROLES } from '@/lib/access'

export async function POST(req: NextRequest) {
  try {
    const { token, email, role, name, password } = await req.json()

    const passwordError = validatePasswordStrength(password)
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

    const valid = await consumeVerificationToken(email, token, 'verify')
    if (!valid) {
      return NextResponse.json({ error: 'This invitation link is invalid or has expired.' }, { status: 400 })
    }

    // Only allow team roles via invite
    if (!INVITABLE_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.upsert({
      where: { email },
      update: { name, passwordHash, role, emailVerified: new Date() },
      create: { name, email, passwordHash, role, emailVerified: new Date() },
    })

    // Mark the invite as accepted
    await db.invite.updateMany({
      where: { email, token, acceptedAt: null, revokedAt: null },
      data: { acceptedAt: new Date() },
    })

    const sessionToken = await createSession(user.id)

    const response = NextResponse.json({ ok: true })
    response.cookies.set('authjs.session-token', sessionToken, {
      httpOnly: true,
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err) {
    console.error('[accept-invite]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
