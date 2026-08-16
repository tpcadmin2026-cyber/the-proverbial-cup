import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'
import { sendGiftNotificationEmail } from '@/lib/auth-utils'

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

    const email = recipientEmail.trim().toLowerCase()

    // If the recipient already has an account (and no existing subscription of
    // their own), activate the gift immediately instead of waiting for signup.
    const existingUser = await db.user.findUnique({ where: { email }, include: { subscription: true } })
    const activateNow = !!existingUser && !existingUser.subscription

    const gift = await db.corporateGift.create({
      data: {
        corporateAccountId: accountId,
        recipientEmail: email,
        recipientName: recipientName?.trim() || null,
        planId,
        note: note?.trim() || null,
        status: activateNow ? 'active' : 'pending',
        activatedAt: activateNow ? new Date() : null,
      },
      include: { plan: { select: { name: true, priceMonthly: true } } },
    })

    if (activateNow && existingUser) {
      await db.userSubscription.create({
        data: { userId: existingUser.id, planId, status: 'active', billingInterval: 'monthly' },
      })
    }

    const baseUrl = req.nextUrl.origin
    await sendGiftNotificationEmail({
      email,
      recipientName: recipientName?.trim() || undefined,
      companyName: account.companyName,
      planName: plan.name,
      note: note?.trim() || undefined,
      alreadyActive: activateNow,
      baseUrl,
    }).catch(console.error)

    return NextResponse.json({ success: true, gift: { ...gift, planName: gift.plan.name, createdAt: gift.createdAt.toISOString(), activatedAt: gift.activatedAt?.toISOString() ?? null, expiresAt: null } })
  } catch {
    return NextResponse.json({ error: 'Failed to add gift.' }, { status: 500 })
  }
}
