import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { consumeVerificationToken, hashPassword, validatePasswordStrength } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const { token, email, password } = await req.json()

    const passwordError = validatePasswordStrength(password)
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })

    const valid = await consumeVerificationToken(email, token, 'reset')
    if (!valid) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    await db.user.updateMany({ where: { email }, data: { passwordHash } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
