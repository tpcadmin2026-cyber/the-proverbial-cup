'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  published: boolean
  publishedAt: Date | null
}

interface Props {
  post: Post | null
}

export function PostEditor({ post }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    excerpt: post?.excerpt ?? '',
    content: post?.content ?? '',
    coverImage: post?.coverImage ?? '',
    published: post?.published ?? false,
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [error, setError] = useState('')

  function slugify(title: string) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: post ? f.slug : slugify(title) }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setError('')
    try {
      const url = post ? `/api/admin/reading-room/${post.id}` : '/api/admin/reading-room'
      const method = post ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed.')
      router.push('/admin/content/reading-room')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  async function handleDelete() {
    if (!post || !confirm('Delete this post? This cannot be undone.')) return
    await fetch(`/api/admin/reading-room/${post.id}`, { method: 'DELETE' })
    router.push('/admin/content/reading-room')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title <span className="text-red-400">*</span></label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#C4AB77]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Slug <span className="text-red-400">*</span></label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">/members/</span>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#C4AB77]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Excerpt</label>
        <textarea
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#C4AB77] resize-none"
          placeholder="A brief summary shown on the reading room index…"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Cover image URL</label>
        <input
          type="url"
          value={form.coverImage}
          onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#C4AB77]"
          placeholder="https://…"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          Content <span className="text-red-400">*</span>
          <span className="ml-2 text-gray-400 font-normal normal-case">Use ## for headings, blank line between paragraphs</span>
        </label>
        <textarea
          required
          rows={20}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#C4AB77] resize-y"
          placeholder="Write your article here…&#10;&#10;## A Section Heading&#10;&#10;Another paragraph…"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="published"
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
          className="rounded border-gray-300 text-[#C4AB77]"
        />
        <label htmlFor="published" className="text-sm text-gray-700">Published (visible to subscribers)</label>
      </div>

      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={status === 'saving'}
          className="bg-[#35291C] text-[#E8E6D8] px-6 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors disabled:opacity-60"
        >
          {status === 'saving' ? 'Saving…' : post ? 'Save Changes' : 'Create Post'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/content/reading-room')}
          className="px-5 py-2 rounded text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        {post && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto px-5 py-2 rounded text-sm text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            Delete Post
          </button>
        )}
      </div>
    </form>
  )
}
