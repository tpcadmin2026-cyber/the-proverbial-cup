import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { sendInviteEmail, createVerificationToken } from '@/lib/auth-utils'
import { isAdminRole } from '@/lib/access'

export async function POST(req: NextRequest) {
  try {
    // Auth check
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

    const baseUrl = req.nextUrl.origin
    const inviteToken = await createVerificationToken(email, 'verify', 60 * 72)
    const link = `${baseUrl}/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}&role=${role}`

    // Try to send email (logs to terminal in dev)
    await sendInviteEmail(email, role, session.user.name ?? session.user.email, baseUrl)

    // Always return the link so admin can copy it manually in dev
    return NextResponse.json({ ok: true, link })
  } catch (err) {
    console.error('[invite]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
