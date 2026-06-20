import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

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

  const body = await req.json()
  const { name, phoneNumber, notifyByEmail, notifyBySms } = body

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: typeof name === 'string' ? name.trim() || null : undefined,
      phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim() || null : undefined,
      notifyByEmail: typeof notifyByEmail === 'boolean' ? notifyByEmail : undefined,
      notifyBySms: typeof notifyBySms === 'boolean' ? notifyBySms : undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
