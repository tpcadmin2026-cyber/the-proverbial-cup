import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin()
    const { userId } = await params
    const { name, role, planId, subStatus, emailVerified } = await req.json()

    // Update user
    await db.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name || null }),
        ...(role !== undefined && { role }),
        // Manual override — lets an admin unblock an account when the verification
        // email never went out or never arrived.
        ...(emailVerified !== undefined && { emailVerified: emailVerified ? new Date() : null }),
      },
    })

    // Handle subscription changes
    if (planId !== undefined) {
      const existingSub = await db.userSubscription.findUnique({ where: { userId } })

      if (planId === null || planId === '') {
        // Remove subscription
        if (existingSub) {
          await db.userSubscription.delete({ where: { userId } })
        }
      } else if (existingSub) {
        // Update existing subscription
        await db.userSubscription.update({
          where: { userId },
          data: {
            planId,
            ...(subStatus !== undefined && { status: subStatus }),
          },
        })
      } else {
        // Create new subscription
        await db.userSubscription.create({
          data: { userId, planId, status: subStatus ?? 'active' },
        })
      }
    } else if (subStatus !== undefined) {
      // Just update status
      await db.userSubscription.update({
        where: { userId },
        data: { status: subStatus },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 })
  }
}
