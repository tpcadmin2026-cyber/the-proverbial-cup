'use client'

import { useState } from 'react'
import { SettingsField } from './SettingsField'

interface SettingRow {
  key: string; label: string; helpText: string | null
  inputType: string; value: string; options: string | null
}

export function SettingsGroupPage({ rows }: { rows: SettingRow[] }) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const out: Record<string, unknown> = {}
    for (const row of rows) {
      try { out[row.key] = JSON.parse(row.value) } catch { out[row.key] = row.value }
    }
    return out
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function handleChange(key: string, value: unknown) {
    setValues((p) => ({ ...p, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: values }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="bg-white rounded-lg border border-gray-200 px-5 mb-6">
        {rows.map((row) => (
          <SettingsField
            key={row.key}
            settingKey={row.key}
            label={row.label}
            helpText={row.helpText ?? undefined}
            inputType={row.inputType}
            value={values[row.key]}
            options={row.options ? JSON.parse(row.options) : undefined}
            onChange={handleChange}
          />
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
