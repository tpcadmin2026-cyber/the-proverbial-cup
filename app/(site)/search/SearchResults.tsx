'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface Result {
  id: string
  contentType: string
  title: string
  excerpt: string | null
  url: string
  imageUrl: string | null
  rank: number
  highlighted: string | null
}

interface Facets {
  article?: number
  product?: number
  plan?: number
  page?: number
}

const TYPE_LABELS: Record<string, string> = {
  article: 'Help article',
  product: 'Product',
  plan:    'Subscription',
  page:    'Page',
}

const TYPE_COLOURS: Record<string, string> = {
  article: 'bg-blue-100 text-blue-700',
  product: 'bg-amber-100 text-amber-700',
  plan:    'bg-green-100 text-green-700',
  page:    'bg-purple-100 text-purple-700',
}

function Highlight({ html }: { html: string }) {
  // §§ is the delimiter used by ts_headline
  const parts = html.split('§§')
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <mark key={i} className="bg-[#f5e6a0] text-[#35291C] px-0.5 rounded-sm not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export function SearchResults({ initialQuery, initialType }: { initialQuery: string; initialType: string }) {
  const router = useRouter()
  const [query, setQuery]     = useState(initialQuery)
  const [type, setType]       = useState(initialType)
  const [results, setResults] = useState<Result[]>([])
  const [facets, setFacets]   = useState<Facets>({})
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string, t: string) => {
    if (q.trim().length < 2) { setResults([]); setFacets({}); setSearched(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q })
      if (t) params.set('type', t)
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setFacets(data.facets ?? {})
      setTotal(data.total ?? 0)
      setSearched(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doSearch(query, type)
      // Update URL without navigation
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (type)  params.set('type', type)
      router.replace(`/search?${params}`, { scroll: false })
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, type, doSearch, router])

  // Run initial search if query provided
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery, initialType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalAcrossTypes = Object.values(facets).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search articles, products, subscriptions…"
          autoFocus
          className="w-full bg-white border border-[#c8c4a8] rounded-lg px-5 py-3 pr-12 font-baskerville text-[#35291C] text-lg placeholder:text-[#b8a98a] focus:outline-none focus:border-[#C4AB77] transition-colors"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4AB77] text-lg pointer-events-none">
          {loading ? '…' : '⌕'}
        </span>
      </div>

      {/* Type filters */}
      {searched && totalAcrossTypes > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setType('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${!type ? 'bg-[#35291C] text-[#E8E6D8] border-[#35291C]' : 'bg-white border-[#c8c4a8] text-[#4B4C44] hover:border-[#C4AB77]'}`}
          >
            All ({totalAcrossTypes})
          </button>
          {Object.entries(facets).map(([t, count]) => (
            <button
              key={t}
              onClick={() => setType(t === type ? '' : t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${type === t ? 'bg-[#35291C] text-[#E8E6D8] border-[#35291C]' : 'bg-white border-[#c8c4a8] text-[#4B4C44] hover:border-[#C4AB77]'}`}
            >
              {TYPE_LABELS[t] ?? t}s ({count})
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && (
        results.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-8 text-center">
            <p className="font-playfair text-lg text-[#35291C] mb-2">No results found</p>
            <p className="font-baskerville italic text-[#4B4C44]">
              We could find no record of &ldquo;{query}&rdquo; in our archives. Try fewer words, or browse the{' '}
              <Link href="/help" className="text-[#C4AB77] underline">Help Desk</Link> or{' '}
              <Link href="/shop" className="text-[#C4AB77] underline">Emporium</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#C4AB77] font-semibold uppercase tracking-widest px-1">
              {results.length} result{results.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}
            </p>
            {results.map((r) => (
              <Link key={r.id} href={r.url} className="block bg-white border border-[#c8c4a8] rounded-lg p-5 hover:border-[#C4AB77] hover:shadow-md transition-all group">
                <div className="flex items-start gap-3">
                  {r.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.imageUrl} alt="" className="w-16 h-16 object-cover rounded flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${TYPE_COLOURS[r.contentType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[r.contentType] ?? r.contentType}
                      </span>
                    </div>
                    <h3 className="font-playfair text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-1.5 leading-snug">
                      {r.title}
                    </h3>
                    {(r.highlighted || r.excerpt) && (
                      <p className="text-sm font-baskerville italic text-[#4B4C44] line-clamp-3">
                        {r.highlighted
                          ? <Highlight html={r.highlighted} />
                          : r.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {!searched && !loading && (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-8 text-center">
          <p className="font-baskerville italic text-[#4B4C44] text-lg">Begin your inquiry above to search the full Gazette archive.</p>
        </div>
      )}
    </div>
  )
}
