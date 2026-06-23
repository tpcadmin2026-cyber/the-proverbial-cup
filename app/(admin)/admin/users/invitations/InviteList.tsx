'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, isPast } from 'date-fns'

type Invite = {
  id: string
  email: string
  role: string
  invitedBy: string
  expiresAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
  createdAt: Date
}

const ROLE_LABELS: Record<string, string> = {
  master_admin: 'Master Admin',
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
}

function statusOf(invite: Invite) {
  if (invite.acceptedAt) return 'accepted'
  if (invite.revokedAt) return 'revoked'
  if (isPast(invite.expiresAt)) return 'expired'
  return 'pending'
}

export function InviteList({ invites }: { invites: Invite[] }) {
  const router = useRouter()
  const [revoking, setRevoking] = useState<string | null>(null)

  async function revoke(id: string) {
    setRevoking(id)
    try {
      const res = await fetch(`/api/admin/invite/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Failed to revoke')
      } else {
        router.refresh()
      }
    } finally {
      setRevoking(null)
    }
  }

  if (invites.length === 0) return null

  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900">All invitations</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent by</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expires</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {invites.map((invite) => {
            const status = statusOf(invite)
            return (
              <tr key={invite.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-900">{invite.email}</td>
                <td className="px-5 py-3">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {ROLE_LABELS[invite.role] ?? invite.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500">{invite.invitedBy}</td>
                <td className="px-5 py-3">
                  {status === 'pending'  && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pending</span>}
                  {status === 'accepted' && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Accepted</span>}
                  {status === 'revoked'  && <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Revoked</span>}
                  {status === 'expired'  && <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded">Expired</span>}
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">
                  {status === 'pending'
                    ? `in ${formatDistanceToNow(invite.expiresAt)}`
                    : status === 'accepted'
                    ? `Accepted ${formatDistanceToNow(invite.acceptedAt!, { addSuffix: true })}`
                    : '—'}
                </td>
                <td className="px-5 py-3 text-right">
                  {status === 'pending' && (
                    <button
                      onClick={() => revoke(invite.id)}
                      disabled={revoking === invite.id}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline disabled:opacity-50"
                    >
                      {revoking === invite.id ? 'Revoking…' : 'Revoke'}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
