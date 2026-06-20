'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['under_review', 'planned', 'in_progress', 'shipped', 'declined']

interface Props {
  requestId: string
  currentStatus: string
  currentPublic: boolean
}

export function RequestActions({ requestId, currentStatus, currentPublic }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isPublic, setIsPublic] = useState(currentPublic)
  const [saving, setSaving] = useState(false)

  async function update(updates: { status?: string; isPublic?: boolean }) {
    setSaving(true)
    await fetch(`/api/admin/requests/${requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); update({ status: e.target.value }) }}
        disabled={saving}
        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>
      <button
        onClick={() => { setIsPublic(!isPublic); update({ isPublic: !isPublic }) }}
        disabled={saving}
        title={isPublic ? 'Visible to public' : 'Hidden from public'}
        className={`text-xs px-2 py-1 rounded border transition-colors ${isPublic ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
      >
        {isPublic ? 'Public' : 'Hidden'}
      </button>
    </div>
  )
}
