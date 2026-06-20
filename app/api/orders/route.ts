import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { logChange } from '@/lib/changelog'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest) {
  if (!await isEnabled('ecommerce')) return NextResponse.json({ error: 'Shop is not enabled.' }, { status: 403 })
  const body = await req.json()
  const { customerName, customerEmail, shippingAddress, lineItems, totalCents } = body

  if (!customerEmail || !lineItems?.length || !totalCents) {
    return NextResponse.json({ error: 'Missing required order fields.' }, { status: 400 })
  }

  const currency = await getSetting<string>('payments.currency', 'GBP')

  // Try to find the logged-in user to associate the order
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  let actorEmail = customerEmail

  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    })
    if (session?.user) actorEmail = session.user.email
  }

  const order = await db.order.create({
    data: {
      customerEmail,
      customerName: customerName || null,
      lineItems: JSON.stringify(lineItems),
      totalCents,
      currency,
      status: 'pending',
      shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : null,
    },
  })

  await logChange({
    eventType: 'manual',
    title: `New order placed: ${customerEmail}`,
    actor: actorEmail,
    metadata: { orderId: order.id, totalCents, currency, itemCount: lineItems.length },
  })

  return NextResponse.json({ id: order.id, ok: true })
}
