import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession } from '@/lib/auth-utils'
import { identifyUser } from '@/lib/posthog'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    // Check email verification (skip for admins so they're never locked out)
    const requireVerification = user.role === 'subscriber' || user.role === 'customer'
    if (requireVerification && !user.emailVerified) {
      return NextResponse.json({
        error: 'Please verify your email address before signing in. Check your inbox for the verification link.',
      }, { status: 403 })
    }

    const token = await createSession(user.id)

    // Identify the user in PostHog so events are linked to their profile
    await identifyUser(user.email, {
      email: user.email,
      name: user.name ?? undefined,
      role: user.role,
    }).catch(() => {}) // non-blocking

    const response = NextResponse.json({ ok: true, role: user.role })
    response.cookies.set('authjs.session-token', token, {
      httpOnly: true,
      path: '/',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
