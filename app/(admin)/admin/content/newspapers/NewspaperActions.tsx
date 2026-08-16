'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewIssueButton() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleClick() {
    const title = prompt('Issue title (e.g. "The Proverbial Post — March 2026")')
    if (!title?.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/newspapers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create issue.')
      router.push(`/admin/content/newspapers/${data.issue.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create issue.')
      setCreating(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={creating}
      className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors disabled:opacity-60"
    >
      {creating ? 'Creating…' : '+ New issue'}
    </button>
  )
}

export function SendIssueButton({ issueId, hasContent, subscriberCount }: { issueId: string; hasContent: boolean; subscriberCount: number }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  async function handleSend() {
    if (!confirm(`Send this issue to ${subscriberCount} confirmed subscriber${subscriberCount !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/newspapers/${issueId}/send`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send.')
      alert(`Sent to ${data.sent} of ${data.total} subscribers.${data.failed?.length ? ` Failed: ${data.failed.join(', ')}` : ''}`)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send.')
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      onClick={handleSend}
      disabled={sending || !hasContent || subscriberCount === 0}
      title={!hasContent ? 'Add content before sending' : subscriberCount === 0 ? 'No confirmed subscribers' : undefined}
      className="text-xs font-semibold px-2.5 py-1 bg-[#35291C] text-[#E8E6D8] rounded hover:bg-[#35291C] transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      ✉ Send
    </button>
  )
}

export function DeleteIssueButton({ issueId, issueLabel }: { issueId: string; issueLabel: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete issue "${issueLabel}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/cms/pages/${issueId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete issue.')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete issue.')
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 hover:underline shrink-0 disabled:opacity-50"
    >
      Delete
    </button>
  )
}
