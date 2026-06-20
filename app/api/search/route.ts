import { NextRequest, NextResponse } from 'next/server'
import { searchContent, searchFacets, ContentType } from '@/lib/search'

// GET /api/search?q=query&type=article|product|plan|page&limit=20&offset=0
export async function GET(req: NextRequest) {
  const q      = req.nextUrl.searchParams.get('q')?.trim()
  const type   = req.nextUrl.searchParams.get('type') as ContentType | null
  const limit  = Math.min(parseInt(req.nextUrl.searchParams.get('limit')  ?? '20'), 50)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0')

  if (!q || q.length < 2) return NextResponse.json({ results: [], facets: {}, query: q })

  const [results, facets] = await Promise.all([
    searchContent(q, { type: type ?? undefined, limit, offset }),
    searchFacets(q),
  ])

  return NextResponse.json({ results, facets, query: q, total: Object.values(facets).reduce((a, b) => a + b, 0) })
}
