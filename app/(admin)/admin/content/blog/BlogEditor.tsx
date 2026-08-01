'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/site/RichTextEditor'

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  coverImage: string | null
  author: string
  tags: string
  category: string
  published: boolean
  featured: boolean
}

interface Props {
  post: Post | null
}

const CATEGORY_SUGGESTIONS = ['Coffee', 'Tea', 'Brewing Guides', 'Origins', 'News', 'Behind the Cup', 'Events', 'Recipes']

export function BlogEditor({ post }: Props) {
  const router = useRouter()
  const isNew = !post

  const [form, setForm] = useState({
    title:      post?.title      ?? '',
    slug:       post?.slug       ?? '',
    excerpt:    post?.excerpt    ?? '',
    content:    post?.content    ?? '',
    coverImage: post?.coverImage ?? '',
    author:     post?.author     ?? '',
    tags:       post?.tags       ?? '',
    category:   post?.category   ?? '',
    published:  post?.published  ?? false,
    featured:   post?.featured   ?? false,
  })

  const [status, setStatus]   = useState<'idle' | 'saving' | 'deleting'>('idle')
  const [error, setError]     = useState('')

  function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function set(field: keyof typeof form, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: isNew ? slugify(title) : f.slug }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('saving')
    setError('')
    try {
      const url    = isNew ? '/api/admin/blog' : `/api/admin/blog/${post!.id}`
      const method = isNew ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed.')
      router.push('/admin/content/blog')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('idle')
    }
  }

  async function handleDelete() {
    if (!post) return
    if (!confirm('Permanently delete this post? This cannot be undone.')) return
    setStatus('deleting')
    await fetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' })
    router.push('/admin/content/blog')
    router.refresh()
  }

  return (
    <div className="p-8 max-w-4xl">
      <form onSubmit={handleSave} className="space-y-6">

        {/* Title + slug */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Post details</h2>

          <Field label="Title">
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
              placeholder="The Art of the Perfect Pour-Over"
              className="input"
            />
          </Field>

          <Field label="Slug" help="Auto-generated from the title. URL will be /blog/your-slug.">
            <div className="flex gap-2">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                required
                placeholder="art-of-the-perfect-pour-over"
                className="input font-mono flex-1"
              />
              {!isNew && form.slug && (
                <a
                  href={`/blog/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-xs font-semibold text-[#C4AB77] border border-[#C4AB77] rounded hover:bg-amber-50 transition-colors whitespace-nowrap"
                >
                  Preview ↗
                </a>
              )}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" help="e.g. Coffee, Brewing Guides, Origins">
              <input
                type="text"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                placeholder="Coffee"
                list="blog-category-list"
                className="input"
              />
              <datalist id="blog-category-list">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Field>

            <Field label="Author" help="Name shown on the post. Leave blank to omit.">
              <input
                type="text"
                value={form.author}
                onChange={(e) => set('author', e.target.value)}
                placeholder="The Editor"
                className="input"
              />
            </Field>
          </div>

          <Field label="Tags" help="Comma-separated — e.g. espresso, origins, ethiopia">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="espresso, origins, ethiopia"
              className="input"
            />
          </Field>

          <Field label="Cover image URL" help="Paste a URL or leave blank. Full-width image shown at the top of the post.">
            <input
              type="url"
              value={form.coverImage}
              onChange={(e) => set('coverImage', e.target.value)}
              placeholder="https://…"
              className="input"
            />
            {form.coverImage && (
              <img src={form.coverImage} alt="Cover preview" className="mt-2 h-32 w-full object-cover rounded border border-gray-200" />
            )}
          </Field>

          <Field label="Excerpt" help="One or two sentences shown in listings and search results. Leave blank to auto-generate from the content.">
            <textarea
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
              rows={3}
              placeholder="A short description of this post…"
              className="input resize-y"
            />
          </Field>
        </section>

        {/* Content editor */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Content</h2>
          <RichTextEditor
            value={form.content}
            onChange={(html) => set('content', html)}
            placeholder="Write your post here…"
            minHeight={400}
          />
          <p className="text-xs text-gray-400">Formatting is applied with the toolbar above.</p>
        </section>

        {/* Publish settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Publishing</h2>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set('published', e.target.checked)}
                className="accent-[#C4AB77] w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Published</span>
                <p className="text-xs text-gray-500">Visible to all visitors on the site.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)}
                className="accent-[#C4AB77] w-4 h-4"
              />
              <div>
                <span className="text-sm font-medium text-gray-800">Featured post</span>
                <p className="text-xs text-gray-500">Pinned to the top of the blog listing.</p>
              </div>
            </label>
          </div>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={status === 'saving'}
            className="px-6 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors"
          >
            {status === 'saving' ? 'Saving…' : isNew ? 'Create post' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/content/blog')}
            className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Cancel
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={status === 'deleting'}
              className="ml-auto px-4 py-2 text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
            >
              {status === 'deleting' ? 'Deleting…' : 'Delete post'}
            </button>
          )}
        </div>

        {isNew && (
          <p className="text-xs text-gray-400">After saving you can edit and re-publish at any time.</p>
        )}
      </form>
    </div>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-0.5">{label}</label>
      {help && <p className="text-xs text-gray-500 mb-1">{help}</p>}
      {children}
    </div>
  )
}
