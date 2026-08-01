import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, requireMasterAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireAdmin()
    const { orderId } = await params
    const { status, trackingNumber, notes, archived } = await req.json()

    await db.order.update({
      where: { id: orderId },
      data: {
        ...(status !== undefined && { status }),
        ...(trackingNumber !== undefined && { trackingNumber }),
        ...(notes !== undefined && { notes }),
        ...(archived !== undefined && { archived }),
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 })
  }
}

// Permanent delete — restricted to master_admin. Everyone else should archive
// instead (PATCH { archived: true }), which just hides the order from view.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    await requireMasterAdmin()
    const { orderId } = await params
    await db.order.delete({ where: { id: orderId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error && err.message === 'Unauthorised' ? err.message : 'Failed to delete order.'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorised' ? 403 : 500 })
  }
}
