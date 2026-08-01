'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  quizId: string
  title: string
  slug: string
  heading: string
  subheading: string
  resultHeading: string
  resultSubtext: string
  visible: boolean
  publicUrl: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function QuizMetaForm({ quizId, title: initialTitle, slug: initialSlug, heading: initialHeading, subheading: initialSubheading, resultHeading: initialResultHeading, resultSubtext: initialResultSubtext, visible: initialVisible, publicUrl }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [slug, setSlug] = useState(initialSlug)
  const [heading, setHeading] = useState(initialHeading)
  const [subheading, setSubheading] = useState(initialSubheading)
  const [resultHeading, setResultHeading] = useState(initialResultHeading)
  const [resultSubtext, setResultSubtext] = useState(initialResultSubtext)
  const [visible, setVisible] = useState(initialVisible)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/quiz/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, heading, subheading, resultHeading, resultSubtext, visible }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="max-w-3xl bg-white border border-[#c8c4a8] rounded-lg overflow-hidden mb-6">
      <div className="h-0.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
      <div className="p-5 space-y-4">

        <div className="flex items-center gap-2 bg-[#fdfbf5] border border-[#e8e4d0] rounded px-3 py-2">
          <span className="text-xs text-[#4B4C44] font-mono flex-1 truncate">{publicUrl}</span>
          <button onClick={copyLink} className="text-xs text-[#C4AB77] hover:underline shrink-0">
            {copied ? '✓ Copied' : 'Copy link'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1">Internal name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1">Link slug</label>
            <input value={slug} onChange={e => setSlug(slugify(e.target.value))} className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C4AB77]" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1">Heading</label>
          <input value={heading} onChange={e => setHeading(e.target.value)} className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1">Subheading</label>
          <textarea value={subheading} onChange={e => setSubheading(e.target.value)} rows={2} className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] resize-y" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1">Result heading</label>
          <input value={resultHeading} onChange={e => setResultHeading(e.target.value)} className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1">Result subtext</label>
          <textarea value={resultSubtext} onChange={e => setResultSubtext(e.target.value)} rows={2} className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] resize-y" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} className="accent-[#C4AB77]" />
          <span className="text-sm text-[#4B4C44]">Visible — anyone with the link can take this quiz</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save quiz settings'}
        </button>
      </div>
    </div>
  )
}
