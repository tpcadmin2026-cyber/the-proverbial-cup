import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const gifts = await db.corporateGift.findMany({
    where: { corporateAccountId: accountId },
    include: { plan: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(gifts)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  if (!await isEnabled('corporate_gifting')) return NextResponse.json({ error: 'Corporate gifting is not enabled.' }, { status: 403 })
  try {
    const { accountId } = await params
    const { recipientEmail, recipientName, planId, note } = await req.json()

    if (!recipientEmail?.trim() || !planId) {
      return NextResponse.json({ error: 'Recipient email and plan are required.' }, { status: 400 })
    }

    const [account, plan] = await Promise.all([
      db.corporateAccount.findUnique({ where: { id: accountId } }),
      db.subscriptionPlan.findUnique({ where: { id: planId } }),
    ])

    if (!account) return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
    if (!plan) return NextResponse.json({ error: 'Plan not found.' }, { status: 404 })

    const gift = await db.corporateGift.create({
      data: {
        corporateAccountId: accountId,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientName: recipientName?.trim() || null,
        planId,
        note: note?.trim() || null,
        status: 'pending',
      },
      include: { plan: { select: { name: true, priceMonthly: true } } },
    })

    return NextResponse.json({ success: true, gift: { ...gift, planName: gift.plan.name, createdAt: gift.createdAt.toISOString(), activatedAt: null, expiresAt: null } })
  } catch {
    return NextResponse.json({ error: 'Failed to add gift.' }, { status: 500 })
  }
}
