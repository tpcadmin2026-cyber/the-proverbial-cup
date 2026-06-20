import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, validatePasswordStrength, sendVerificationEmail, createSession } from '@/lib/auth-utils'
import { trackEvent } from '@/lib/posthog'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const passwordError = validatePasswordStrength(password)
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

    // Check email not already taken
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: { name, email, passwordHash, role: 'subscriber' },
    })

    // Send verification email (logs to terminal in dev)
    const baseUrl = req.nextUrl.origin
    await sendVerificationEmail(email, baseUrl)

    await trackEvent(email, 'user_signup', { name })
    return NextResponse.json({ ok: true, userId: user.id })
  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
