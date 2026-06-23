import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { isAdminRole } from '@/lib/access'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
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

    const invite = await db.invite.findUnique({ where: { id: params.id } })
    if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (invite.revokedAt || invite.acceptedAt) {
      return NextResponse.json({ error: 'Invite is already used or revoked' }, { status: 400 })
    }

    // Delete the verification token so the link stops working immediately
    await db.verificationToken.deleteMany({
      where: { identifier: `verify:${invite.email}`, token: invite.token },
    })

    await db.invite.update({
      where: { id: params.id },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[revoke-invite]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
