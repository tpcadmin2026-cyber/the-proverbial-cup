import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { name, slug, description } = await req.json()
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 })
    }
    const count = await db.kbCategory.count()
    const cat = await db.kbCategory.create({
      data: { name, slug, description: description || null, order: count + 1 },
    })
    return NextResponse.json({ success: true, category: cat })
  } catch {
    return NextResponse.json({ error: 'Failed to create category.' }, { status: 500 })
  }
}
