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
    const inviterName = session.user.name ?? session.user.email
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 72)

    const inviteToken = await createVerificationToken(email, 'verify', 60 * 72)
    const link = `${baseUrl}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}&role=${role}`

    // Revoke any previous pending invite for this email so only one is active at a time
    await db.invite.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    await db.invite.create({
      data: { email, role, token: inviteToken, invitedBy: inviterName, expiresAt },
    })

    let emailSent = false
    try {
      await sendInviteEmailWithLink({ to: email, link, role, inviterName, baseUrl })
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
