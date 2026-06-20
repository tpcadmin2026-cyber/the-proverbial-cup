'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'

interface Entry {
  id: string
  email: string
  name: string | null
  message: string | null
  position: number | null
  notified: boolean
  createdAt: Date
}

interface Props {
  initialEntries: Entry[]
}

export function WaitlistManager({ initialEntries }: Props) {
  const [entries, setEntries]         = useState<Entry[]>(initialEntries)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [search, setSearch]           = useState('')
  const [filter, setFilter]           = useState<'all' | 'notified' | 'pending'>('all')
  const [showNotifyModal, setShowNotifyModal] = useState(false)
  const [notifySubject, setNotifySubject]     = useState('')
  const [notifyMessage, setNotifyMessage]     = useState('')
  const [notifyStatus, setNotifyStatus]       = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [notifyResult, setNotifyResult]       = useState<{ sent: number; failed: string[] } | null>(null)
  const [busyIds, setBusyIds]         = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch = !search ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.name ?? '').toLowerCase().includes(search.toLowerCase())
      const matchFilter =
        filter === 'all' ? true :
        filter === 'notified' ? e.notified :
        !e.notified
      return matchSearch && matchFilter
    })
  }, [entries, search, filter])

  const totalCount    = entries.length
  const notifiedCount = entries.filter((e) => e.notified).length
  const pendingCount  = totalCount - notifiedCount
  const allSelected   = filtered.length > 0 && filtered.every((e) => selected.has(e.id))

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((e) => next.delete(e.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((e) => next.add(e.id))
        return next
      })
    }
  }

  async function markNotified(id: string, notified: boolean) {
    setBusyIds((p) => new Set(p).add(id))
    try {
      const res = await fetch('/api/admin/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notified }),
      })
      if (res.ok) {
        setEntries((prev) => prev.map((e) => e.id === id ? { ...e, notified } : e))
      }
    } finally {
      setBusyIds((p) => { const n = new Set(p); n.delete(id); return n })
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Remove this entry from the waitlist?')) return
    setBusyIds((p) => new Set(p).add(id))
    try {
      const res = await fetch(`/api/admin/waitlist?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
      }
    } finally {
      setBusyIds((p) => { const n = new Set(p); n.delete(id); return n })
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return
    if (!confirm(`Delete ${selected.size} selected entr${selected.size === 1 ? 'y' : 'ies'}? This cannot be undone.`)) return
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) =>
      fetch(`/api/admin/waitlist?id=${id}`, { method: 'DELETE' })
    ))
    setEntries((prev) => prev.filter((e) => !selected.has(e.id)))
    setSelected(new Set())
  }

  async function sendNotifications() {
    setNotifyStatus('sending')
    try {
      const ids = selected.size > 0 ? Array.from(selected) : undefined
      const res = await fetch('/api/admin/waitlist/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, subject: notifySubject, message: notifyMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setNotifyResult({ sent: data.sent, failed: data.failed ?? [] })
      setNotifyStatus('done')
      // Update notified state for all sent entries
      setEntries((prev) => prev.map((e) => {
        const targeted = ids ? ids.includes(e.id) : !e.notified
        return targeted ? { ...e, notified: true } : e
      }))
      if (selected.size > 0) setSelected(new Set())
    } catch (err) {
      setNotifyStatus('error')
      setNotifyResult({ sent: 0, failed: [err instanceof Error ? err.message : 'Unknown error'] })
    }
  }

  const notifyTarget = selected.size > 0
    ? `${selected.size} selected`
    : `all ${pendingCount} un-notified`

  return (
    <div className="p-8 space-y-6 max-w-5xl">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total on waitlist"  value={totalCount} />
        <StatCard label="Notified"           value={notifiedCount} color="text-green-700" />
        <StatCard label="Awaiting"           value={pendingCount} />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name…"
            className="border border-gray-200 rounded px-3 py-1.5 text-sm flex-1 min-w-48 focus:outline-none focus:border-[#C4AB77]"
          />

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#C4AB77]"
          >
            <option value="all">All entries</option>
            <option value="pending">Awaiting notification</option>
            <option value="notified">Notified</option>
          </select>

          <div className="flex-1" />

          {/* Bulk actions */}
          {selected.size > 0 && (
            <button
              onClick={bulkDelete}
              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
            >
              Delete {selected.size}
            </button>
          )}

          <button
            onClick={() => { setShowNotifyModal(true); setNotifyStatus('idle'); setNotifyResult(null) }}
            disabled={pendingCount === 0 && selected.size === 0}
            className="px-4 py-1.5 text-sm font-semibold bg-[#35291C] text-[#E8E6D8] rounded hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            ✉ Notify {notifyTarget}
          </button>

          <a
            href="/api/admin/waitlist/export"
            download
            className="px-4 py-1.5 text-sm font-semibold border border-[#C4AB77] text-[#C4AB77] rounded hover:bg-amber-50 transition-colors"
          >
            ↓ Export CSV
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            {filtered.length} {filter !== 'all' ? filter : ''} entr{filtered.length === 1 ? 'y' : 'ies'}
            {search && ` matching "${search}"`}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            {entries.length === 0
              ? 'No waitlist sign-ups yet. They will appear here as readers visit /waitlist.'
              : 'No entries match your filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="accent-[#C4AB77]"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Signed up</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notified</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${selected.has(entry.id) ? 'bg-amber-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="accent-[#C4AB77]"
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">#{entry.position ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.email}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate" title={entry.message ?? undefined}>
                      {entry.message ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {format(entry.createdAt, 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyIds.has(entry.id)}
                        onClick={() => markNotified(entry.id, !entry.notified)}
                        className={`px-2 py-0.5 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                          entry.notified
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {entry.notified ? 'Notified ✓' : 'Pending'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        disabled={busyIds.has(entry.id)}
                        onClick={() => deleteEntry(entry.id)}
                        className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                        title="Delete entry"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notify modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
            <div className="p-6">

              {notifyStatus === 'done' || notifyStatus === 'error' ? (
                <div className="text-center py-4">
                  {notifyStatus === 'done' ? (
                    <>
                      <div className="text-4xl text-[#C4AB77] mb-3">✦</div>
                      <p className="font-playfair text-xl text-[#35291C] mb-2">Despatches Sent</p>
                      <p className="text-sm text-gray-600 mb-2">{notifyResult?.sent} email{notifyResult?.sent !== 1 ? 's' : ''} sent successfully.</p>
                      {notifyResult && notifyResult.failed.length > 0 && (
                        <p className="text-xs text-red-500">{notifyResult.failed.length} failed: {notifyResult.failed.join(', ')}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-red-600 font-medium mb-2">Something went wrong</p>
                      <p className="text-sm text-gray-500">{notifyResult?.failed?.[0]}</p>
                    </>
                  )}
                  <button
                    onClick={() => setShowNotifyModal(false)}
                    className="mt-5 px-6 py-2 bg-[#35291C] text-[#E8E6D8] rounded text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-playfair text-xl text-[#35291C] mb-1">Send notification</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    This will email <strong>{notifyTarget}</strong> and mark them as notified.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Subject line</label>
                      <input
                        type="text"
                        value={notifySubject}
                        onChange={(e) => setNotifySubject(e.target.value)}
                        placeholder="We're now open — your place awaits"
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
                      <p className="text-xs text-gray-400 mb-1">Separate paragraphs with a blank line. The recipient's name and a footer are added automatically.</p>
                      <textarea
                        rows={7}
                        value={notifyMessage}
                        onChange={(e) => setNotifyMessage(e.target.value)}
                        placeholder={"We are delighted to announce that The Proverbial Cup is now open.\n\nAs one of our founding waitlist members, you have been first to know.\n\nWe hope to see you at the counter."}
                        className="w-full border border-gray-200 rounded px-3 py-2 text-sm resize-y focus:outline-none focus:border-[#C4AB77]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={sendNotifications}
                      disabled={notifyStatus === 'sending' || !notifySubject.trim() || !notifyMessage.trim()}
                      className="px-6 py-2 bg-[#35291C] text-[#E8E6D8] rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {notifyStatus === 'sending' ? 'Sending…' : `Send to ${notifyTarget}`}
                    </button>
                    <button
                      onClick={() => setShowNotifyModal(false)}
                      disabled={notifyStatus === 'sending'}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
