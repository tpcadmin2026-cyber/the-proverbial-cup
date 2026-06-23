import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { createVerificationToken, sendInviteEmailWithLink } from '@/lib/auth-utils'
import { isAdminRole } from '@/lib/access'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authjs.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    })
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { email, role } = await req.json()
    if (!email || !isAdminRole(role)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
    const inviteToken = await createVerificationToken(email, 'verify', 60 * 72)
    const link = `${baseUrl}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}&role=${role}`

    // Attempt to send email — if it fails (e.g. Resend not configured or free-plan limits),
    // we still return the link so the admin can share it manually.
    let emailSent = false
    try {
      await sendInviteEmailWithLink({ to: email, link, role, inviterName: session.user.name ?? session.user.email, baseUrl })
      emailSent = true
    } catch (emailErr) {
      console.warn('[invite] email send failed (link still usable):', emailErr)
    }

    return NextResponse.json({ ok: true, link, emailSent })
  } catch (err) {
    console.error('[invite]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
