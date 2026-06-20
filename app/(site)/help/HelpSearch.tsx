'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

interface SearchResult {
  title: string
  slug: string
  categorySlug: string
  categoryName: string
  excerpt: string
}

export function HelpSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/help/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setSearched(true)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (val.trim().length >= 2) {
      const t = setTimeout(() => search(val), 300)
      return () => clearTimeout(t)
    } else {
      setResults([])
      setSearched(false)
    }
  }

  return (
    <div className="mb-8 relative">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder="Search help articles…"
          className="w-full bg-white border border-[#c8c4a8] rounded-lg px-5 py-3 pr-12 font-baskerville text-[#35291C] text-lg placeholder:text-[#b8a98a] focus:outline-none focus:border-[#C4AB77] transition-colors"
          aria-label="Search help articles"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4AB77] text-lg pointer-events-none">
          {searching ? '…' : '⌕'}
        </span>
      </div>

      {searched && (
        <div className="mt-3 bg-white border border-[#c8c4a8] rounded-lg overflow-hidden shadow-sm">
          {results.length === 0 ? (
            <p className="p-5 font-baskerville italic text-[#4B4C44]">No articles found for &ldquo;{query}&rdquo;. Try different words or browse the categories below.</p>
          ) : (
            <>
              <p className="px-5 py-3 text-xs text-[#C4AB77] font-semibold uppercase tracking-widest border-b border-[#e8e4d0]">
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </p>
              <ul className="divide-y divide-[#e8e4d0]">
                {results.map((r) => (
                  <li key={`${r.categorySlug}/${r.slug}`}>
                    <Link
                      href={`/help/${r.categorySlug}/${r.slug}`}
                      className="block px-5 py-4 hover:bg-[#f9f5ec] transition-colors group"
                    >
                      <p className="font-playfair text-sm text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-0.5">{r.title}</p>
                      <p className="text-xs text-[#C4AB77] mb-1">{r.categoryName}</p>
                      <p className="text-sm font-baskerville italic text-[#4B4C44] line-clamp-2">{r.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
