import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isEnabled } from '@/lib/features'

export async function GET() {
  if (!await isEnabled('feature_requests')) return NextResponse.json({ error: 'Feature requests are not enabled.' }, { status: 403 })
  const requests = await db.featureRequest.findMany({
    where: { isPublic: true },
    orderBy: { upvotes: 'desc' },
  })
  return NextResponse.json(requests)
}

export async function POST(req: NextRequest) {
  if (!await isEnabled('feature_requests')) return NextResponse.json({ error: 'Feature requests are not enabled.' }, { status: 403 })
  try {
    const { title, description, submittedBy } = await req.json()
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required.' }, { status: 400 })

    const request = await db.featureRequest.create({
      data: {
        title: title.trim().slice(0, 120),
        description: description?.trim() || null,
        submittedBy: submittedBy || null,
        status: 'under_review',
        upvotes: 0,
        isPublic: true,
      },
    })

    return NextResponse.json({ success: true, request })
  } catch {
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 })
  }
}
