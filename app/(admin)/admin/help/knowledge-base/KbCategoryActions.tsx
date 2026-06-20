'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function KbCategoryActions() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    await fetch('/api/admin/kb/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), slug, description: description.trim() }),
    })
    setSaving(false)
    setOpen(false)
    setName('')
    setDescription('')
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
      >
        + New category
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="flex items-end gap-2 flex-wrap">
      <div>
        <input
          autoFocus
          type="text"
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]"
          required
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Short description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77] w-64"
        />
      </div>
      <button type="submit" disabled={saving} className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60">
        {saving ? 'Saving…' : 'Create'}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-gray-400 text-sm hover:text-gray-600">
        Cancel
      </button>
    </form>
  )
}
