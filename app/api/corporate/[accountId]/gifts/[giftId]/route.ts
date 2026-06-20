import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ accountId: string; giftId: string }> }) {
  try {
    const { giftId } = await params
    const { status, note, expiresAt } = await req.json()

    const gift = await db.corporateGift.update({
      where: { id: giftId },
      data: {
        ...(status !== undefined && { status }),
        ...(status === 'active' && { activatedAt: new Date() }),
        ...(note !== undefined && { note }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, gift })
  } catch {
    return NextResponse.json({ error: 'Failed to update gift.' }, { status: 500 })
  }
}
