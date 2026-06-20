import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getStripeAsync } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const stripe = await getStripeAsync()
  if (!stripe) return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 })

  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  })
  if (!session || session.expires < new Date()) return NextResponse.json({ error: 'Session expired.' }, { status: 401 })

  const user = session.user
  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account found. Please subscribe first.' }, { status: 400 })
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${req.nextUrl.origin}/account`,
  })

  return NextResponse.json({ url: portal.url })
}
