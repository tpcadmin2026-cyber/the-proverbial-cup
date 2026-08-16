import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const email = req.nextUrl.searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(new URL('/newsletter?confirmed=0', req.url))
  }

  const subscriber = await db.newsletterSubscriber.findUnique({ where: { email } })
  if (!subscriber || subscriber.confirmToken !== token) {
    return NextResponse.redirect(new URL('/newsletter?confirmed=0', req.url))
  }

  await db.newsletterSubscriber.update({
    where: { email },
    data: { confirmed: true, confirmToken: null },
  })

  return NextResponse.redirect(new URL('/newsletter?confirmed=1', req.url))
}
