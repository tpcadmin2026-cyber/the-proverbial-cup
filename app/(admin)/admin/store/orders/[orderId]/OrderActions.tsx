'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['pending', 'paid', 'fulfilled', 'cancelled', 'refunded']

interface Props {
  orderId: string
  currentStatus: string
  currentTracking: string
  archived: boolean
  isMasterAdmin: boolean
}

export function OrderActions({ orderId, currentStatus, currentTracking, archived, isMasterAdmin }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [tracking, setTracking] = useState(currentTracking)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingNumber: tracking || null }),
      })
      if (!res.ok) throw new Error('Failed to update order.')
      setSaved(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleArchive() {
    setArchiving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !archived }),
      })
      if (!res.ok) throw new Error('Failed to update order.')
      router.push('/admin/store/orders')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setArchiving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this order? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete order.')
      router.push('/admin/store/orders')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Update order</h3>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Tracking number <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. JD000000000GB"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]"
          />
        </div>
      </div>
      <div className="px-5 pb-5 flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={handleToggleArchive}
          disabled={archiving}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {archiving ? 'Working…' : archived ? 'Unarchive order' : 'Archive order'}
        </button>
        {isMasterAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="ml-auto px-4 py-2 text-red-500 text-sm hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete order'}
          </button>
        )}
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
      {archived && (
        <div className="px-5 pb-4 -mt-2 text-xs text-gray-400">This order is archived — it's hidden from the default orders list.</div>
      )}
    </div>
  )
}
