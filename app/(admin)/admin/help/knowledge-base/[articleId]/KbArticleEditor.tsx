'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { KbArticle, KbCategory } from '@prisma/client'
import { SeoPanel } from '@/components/admin/SeoPanel'

interface Props {
  article: (KbArticle & { category: KbCategory }) | null
  categories: KbCategory[]
}

export function KbArticleEditor({ article, categories }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title ?? '')
  const [body, setBody] = useState(article?.body ?? '')
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? categories[0]?.id ?? '')
  const [published, setPublished] = useState(article?.published ?? false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch(
        article ? `/api/admin/kb/articles/${article.id}` : '/api/admin/kb/articles',
        {
          method: article ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body, categoryId, published }),
        }
      )
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to save article.')
      }
      router.push('/admin/help/knowledge-base')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!article) return
    if (!confirm('Delete this article permanently? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/admin/kb/articles/${article.id}`, { method: 'DELETE' })
    router.push('/admin/help/knowledge-base')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="p-8 max-w-3xl space-y-6">

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="How do I pause my subscription?"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            Body
            <span className="ml-2 font-normal normal-case text-gray-400">Supports basic markdown: **bold**, *italic*, numbered/bullet lists</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            required
            placeholder="Write the article content here…&#10;&#10;1. Step one&#10;2. Step two&#10;&#10;Use **bold** for emphasis."
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77] resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">Separate paragraphs with a blank line. Use **text** for bold, - item for bullets.</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C4AB77]" />
          </label>
          <span className="text-sm text-gray-700">
            {published ? 'Published — visible at /help' : 'Draft — not visible to readers'}
          </span>
        </div>

      </div>

      {article && (
        <SeoPanel
          contentType="article"
          contentId={article.id}
          defaultTitle={title}
          defaultDescription={body.replace(/[#*_\[\]]/g, '').slice(0, 160)}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : article ? 'Save changes' : 'Create article'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/help/knowledge-base')}
          className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
        >
          Cancel
        </button>
        {article && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto px-4 py-2 text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete article'}
          </button>
        )}
      </div>
    </form>
  )
}
