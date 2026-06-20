'use client'

import { useState } from 'react'

interface FeatureToggleProps {
  flagKey: string
  label: string
  description: string
  enabled: boolean
  category: string
}

export function FeatureToggle({ flagKey, label, description, enabled: initialEnabled }: FeatureToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flagKey, enabled: !enabled }),
      })
      if (res.ok) setEnabled(!enabled)
      else console.error('Failed to toggle feature')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${enabled ? 'border-[#C4AB77] bg-amber-50' : 'border-gray-200 bg-white'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={loading}
        className={`mt-0.5 flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C4AB77] disabled:opacity-50 ${enabled ? 'bg-[#C4AB77]' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{label}</span>
          {enabled && (
            <span className="inline-block px-1.5 py-0.5 text-xs bg-[#C4AB77] text-white rounded">ON</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
