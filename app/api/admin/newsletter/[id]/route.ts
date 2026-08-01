import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

// Manual overrides for a subscriber's confirmed/unsubscribed status — the
// confirmation-email flow isn't wired up yet, so this is the way an admin
// marks someone confirmed if the automated path never completes.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { confirmed, unsubscribed } = await req.json()

    await db.newsletterSubscriber.update({
      where: { id },
      data: {
        ...(confirmed !== undefined && { confirmed }),
        ...(unsubscribed !== undefined && { unsubscribedAt: unsubscribed ? new Date() : null }),
      },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update subscriber.' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    await db.newsletterSubscriber.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete subscriber.' }, { status: 500 })
  }
}
