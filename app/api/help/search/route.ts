import { NextRequest, NextResponse } from 'next/server'
import { searchContent } from '@/lib/search'

// GET /api/help/search?q=... — full-text search across published KB articles only
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const results = await searchContent(q, { type: 'article', limit: 15 })

  return NextResponse.json({
    results: results.map((r) => ({
      title:        r.title,
      url:          r.url,
      excerpt:      r.excerpt,
      highlighted:  r.highlighted,
      categoryName: null, // included in excerpt/highlight
    })),
  })
}
