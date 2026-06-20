'use client'

import { useState } from 'react'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  under_review: { label: 'Under Review',  color: 'bg-yellow-100 text-yellow-700' },
  planned:      { label: 'Planned',       color: 'bg-blue-100 text-blue-700' },
  in_progress:  { label: 'In Progress',   color: 'bg-purple-100 text-purple-700' },
  shipped:      { label: 'Shipped',       color: 'bg-green-100 text-green-700' },
  declined:     { label: 'Declined',      color: 'bg-gray-100 text-gray-500' },
}

interface Request {
  id: string
  title: string
  description: string | null
  status: string
  upvotes: number
  submittedBy: string | null
}

interface Props {
  requests: Request[]
  userEmail: string | null
}

export function RequestBoard({ requests: initial, userEmail }: Props) {
  const [requests, setRequests] = useState(initial)
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submitError, setSubmitError] = useState('')

  async function handleUpvote(id: string) {
    if (upvoted.has(id)) return
    setUpvoted((prev) => { const next = new Set(prev); next.add(id); return next })
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r).sort((a, b) => b.upvotes - a.upvotes))
    await fetch(`/api/requests/${id}/upvote`, { method: 'POST' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitStatus('submitting')
    setSubmitError('')
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, submittedBy: userEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      setRequests((prev) => [data.request, ...prev])
      setForm({ title: '', description: '' })
      setShowForm(false)
      setSubmitStatus('idle')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitStatus('error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Submit button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#35291C] text-[#E8E6D8] px-5 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors"
        >
          {showForm ? 'Cancel' : '+ Submit an Idea'}
        </button>
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-6">
          <h2 className="font-playfair text-lg text-[#35291C] mb-4">Submit Your Idea</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">Title <span className="text-[#7A564C]">*</span></label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={120}
                className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77]"
                placeholder="A brief description of your idea"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B4C44] uppercase tracking-wider mb-1.5">More detail</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-[#c8c4a8] rounded px-3 py-2 text-sm text-[#35291C] bg-[#faf9f4] focus:outline-none focus:border-[#C4AB77] resize-none"
                placeholder="Optional — explain why this would be useful…"
              />
            </div>
            {submitStatus === 'error' && <p className="text-sm text-[#7A564C]">{submitError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitStatus === 'submitting'}
                className="bg-[#35291C] text-[#E8E6D8] px-5 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors disabled:opacity-60"
              >
                {submitStatus === 'submitting' ? 'Submitting…' : 'Submit Idea'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2 rounded text-sm text-[#4B4C44] border border-[#c8c4a8] hover:bg-[#f5f2e8] transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ideas list */}
      {requests.length === 0 ? (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
          <p className="font-baskerville italic text-[#4B4C44] text-lg">No ideas yet. Be the first to submit a suggestion.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const statusInfo = STATUS_LABELS[r.status] ?? STATUS_LABELS.under_review
            const hasUpvoted = upvoted.has(r.id)
            return (
              <div key={r.id} className="bg-white border border-[#c8c4a8] rounded-lg p-4 flex items-start gap-4">
                {/* Upvote button */}
                <button
                  onClick={() => handleUpvote(r.id)}
                  disabled={hasUpvoted}
                  className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-2 rounded border transition-colors text-sm font-bold ${
                    hasUpvoted
                      ? 'border-[#C4AB77] bg-[#fdf8ee] text-[#C4AB77]'
                      : 'border-[#c8c4a8] hover:border-[#C4AB77] hover:text-[#C4AB77] text-[#4B4C44]'
                  }`}
                  title={hasUpvoted ? 'You voted' : 'Upvote this idea'}
                >
                  <span className="text-lg leading-none">▲</span>
                  <span className="text-xs font-semibold mt-0.5">{r.upvotes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-playfair text-sm text-[#35291C] font-semibold">{r.title}</p>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {r.description && <p className="text-xs text-[#4B4C44] font-baskerville italic mt-1">{r.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
