'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeletePageButton({ pageId, pageLabel }: { pageId: string; pageLabel: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${pageLabel}" permanently? Its content blocks will be deleted too. This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/cms/pages/${pageId}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Failed to delete page.')
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold text-red-400 hover:text-red-600 shrink-0 disabled:opacity-50"
    >
      {deleting ? 'Deleting…' : 'Delete'}
    </button>
  )
}
