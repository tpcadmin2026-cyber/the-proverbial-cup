import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: true }) // silent

    const user = await db.user.findUnique({ where: { email } })

    // Always return ok — never reveal whether an email exists
    if (user) {
      await sendPasswordResetEmail(email, req.nextUrl.origin)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ ok: true }) // still silent
  }
}
