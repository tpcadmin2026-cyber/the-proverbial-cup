import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isEnabled('feature_requests')) return NextResponse.json({ error: 'Feature requests are not enabled.' }, { status: 403 })
  try {
    const { id } = await params
    await db.featureRequest.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to upvote.' }, { status: 500 })
  }
}
