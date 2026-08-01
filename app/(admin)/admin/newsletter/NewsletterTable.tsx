'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Subscriber {
  id: string
  email: string
  name: string | null
  source: string
  confirmed: boolean
  unsubscribedAt: Date | null
  createdAt: Date
}

export function NewsletterTable({ subscribers: initial }: { subscribers: Subscriber[] }) {
  const router = useRouter()
  const [subscribers, setSubscribers] = useState(initial)
  const [working, setWorking] = useState<string | null>(null)

  async function patch(id: string, body: Record<string, unknown>) {
    setWorking(id)
    const res = await fetch(`/api/admin/newsletter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setSubscribers((prev) => prev.map((s) => s.id === id
        ? {
            ...s,
            ...(body.confirmed !== undefined && { confirmed: body.confirmed as boolean }),
            ...(body.unsubscribed !== undefined && { unsubscribedAt: body.unsubscribed ? new Date() : null }),
          }
        : s))
      router.refresh()
    }
    setWorking(null)
  }

  async function remove(id: string) {
    if (!confirm('Remove this subscriber permanently? This cannot be undone.')) return
    setWorking(id)
    const res = await fetch(`/api/admin/newsletter/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id))
      router.refresh()
    }
    setWorking(null)
  }

  if (subscribers.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-gray-400">
        No subscribers yet. Sign-ups will appear here as readers enrol at <strong>/newsletter</strong>.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Signed up</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {subscribers.map((sub) => {
            const unsubscribed = !!sub.unsubscribedAt
            const busy = working === sub.id
            return (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{sub.email}</td>
                <td className="px-5 py-3 text-gray-500">{sub.name ?? '—'}</td>
                <td className="px-5 py-3 text-xs text-gray-400 capitalize">{sub.source}</td>
                <td className="px-5 py-3">
                  {unsubscribed ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Unsubscribed</span>
                  ) : sub.confirmed ? (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Confirmed</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
                  )}
                </td>
                <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {format(sub.createdAt, 'dd MMM yyyy')}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  {!unsubscribed && (
                    <button
                      onClick={() => patch(sub.id, { confirmed: !sub.confirmed })}
                      disabled={busy}
                      className="text-xs text-[#C4AB77] hover:underline disabled:opacity-50 mr-3"
                    >
                      {sub.confirmed ? 'Mark pending' : 'Mark confirmed'}
                    </button>
                  )}
                  <button
                    onClick={() => patch(sub.id, { unsubscribed: !unsubscribed })}
                    disabled={busy}
                    className="text-xs text-[#C4AB77] hover:underline disabled:opacity-50 mr-3"
                  >
                    {unsubscribed ? 'Resubscribe' : 'Unsubscribe'}
                  </button>
                  <button
                    onClick={() => remove(sub.id)}
                    disabled={busy}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
