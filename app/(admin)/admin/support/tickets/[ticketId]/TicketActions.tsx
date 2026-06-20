'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  ticketId: string
  currentStatus: string
  currentPriority: string
  currentAssignee: string
  adminEmail: string
  admins: { email: string; name: string | null }[]
}

const STATUSES = ['open', 'in_progress', 'waiting', 'resolved', 'closed']
const PRIORITIES = ['low', 'normal', 'high', 'urgent']

export function TicketActions({ ticketId, currentStatus, currentPriority, currentAssignee, adminEmail, admins }: Props) {
  const router = useRouter()
  const [reply, setReply] = useState('')
  const [status, setStatus] = useState(currentStatus)
  const [priority, setPriority] = useState(currentPriority)
  const [assignee, setAssignee] = useState(currentAssignee)
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', body: reply, author: adminEmail }),
      })
      if (!res.ok) throw new Error('Failed to send reply.')
      setReply('')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  async function handleUpdate() {
    setUpdating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority, assignedTo: assignee || null }),
      })
      if (!res.ok) throw new Error('Failed to update ticket.')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* Reply box */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reply to customer</h3>
        </div>
        <form onSubmit={handleReply} className="p-5 space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            placeholder="Write your reply…"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77] resize-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-50 transition-colors"
            >
              {sending ? 'Sending…' : 'Send reply'}
            </button>
            <button
              type="button"
              onClick={() => { handleReply({ preventDefault: () => {} } as React.FormEvent); setStatus('resolved') }}
              disabled={sending || !reply.trim()}
              className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Reply &amp; resolve
            </button>
          </div>
        </form>
      </div>

      {/* Status / priority / assign */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ticket settings</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assigned to</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
            >
              <option value="">Unassigned</option>
              {admins.map((a) => (
                <option key={a.email} value={a.email}>{a.name ?? a.email}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-5 py-2 bg-[#35291C] text-[#E8E6D8] text-sm font-semibold rounded hover:bg-[#35291C] disabled:opacity-50 transition-colors"
          >
            {updating ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

    </div>
  )
}
