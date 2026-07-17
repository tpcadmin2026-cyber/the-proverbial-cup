'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MarkAllReadButton({ type }: { type?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      await fetch('/api/admin/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-[#C4AB77] hover:underline disabled:opacity-50"
    >
      {loading ? 'Marking…' : 'Mark all as read'}
    </button>
  )
}
