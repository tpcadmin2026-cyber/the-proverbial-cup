import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.redirect(new URL('/newsletter', req.url))

  await db.newsletterSubscriber.update({
    where: { id },
    data: { unsubscribedAt: new Date() },
  }).catch(() => null) // unknown id — fail quietly, still land on the confirmation page

  return NextResponse.redirect(new URL('/newsletter?unsubscribed=1', req.url))
}
