'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  ticketId: string
  author: string
}

export function CustomerReplyForm({ ticketId, author }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setStatus('submitting')
    setError('')
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, author }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setBody('')
      setStatus('idle')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
        className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77] resize-none"
        placeholder="Write your reply…"
      />
      {status === 'error' && (
        <p className="text-sm text-[#7A564C]">{error}</p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting' || !body.trim()}
        className="bg-[#35291C] text-[#E8E6D8] px-6 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Send Reply'}
      </button>
    </form>
  )
}
