'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

interface PermDef { key: string; label: string; description: string; category: string }
interface Category { key: string; label: string; icon: string }

interface Props {
  categories: Category[]
  permissions: PermDef[]
  roles: string[]
  roleLabels: Record<string, { label: string; color: string; description: string }>
  initialMatrix: Record<string, Record<string, boolean>>
}

export function PermissionsMatrix({ categories, permissions, roles, roleLabels, initialMatrix }: Props) {
  const [matrix, setMatrix] = useState(initialMatrix)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState(categories[0].key)

  const categoryPerms = permissions.filter((p) => p.category === activeCategory)

  function toggle(role: string, permKey: string) {
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [permKey]: !prev[role][permKey] },
    }))
    setSaved(false)
  }

  function setAllForRole(role: string, granted: boolean) {
    setMatrix((prev) => {
      const updated = { ...prev[role] }
      for (const p of categoryPerms) updated[p.key] = granted
      return { ...prev, [role]: updated }
    })
    setSaved(false)
  }

  function setAllForPermission(permKey: string, granted: boolean) {
    setMatrix((prev) => {
      const updated = { ...prev }
      for (const role of roles) {
        updated[role] = { ...updated[role], [permKey]: granted }
      }
      return updated
    })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrix }),
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

  async function handleResetToDefaults() {
    if (!confirm('Reset ALL role permissions to built-in defaults? This will overwrite any custom changes.')) return
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/admin/permissions', { method: 'PUT' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      // Reload to reflect new DB state
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset')
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Category tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors',
              activeCategory === cat.key
                ? 'border-[#C4AB77] text-[#C4AB77] bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-64">
                Permission
              </th>
              {roles.map((role) => (
                <th key={role} className="px-4 py-3 text-center min-w-28">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleLabels[role]?.color}`}>
                      {roleLabels[role]?.label}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setAllForRole(role, true)}
                        className="text-xs text-green-600 hover:underline"
                        title="Grant all in this category"
                      >all</button>
                      <span className="text-gray-300">|</span>
                      <button
                        onClick={() => setAllForRole(role, false)}
                        className="text-xs text-red-500 hover:underline"
                        title="Revoke all in this category"
                      >none</button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categoryPerms.map((perm) => (
              <tr key={perm.key} className="hover:bg-gray-50 transition-colors group">
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900 text-sm">{perm.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{perm.description}</div>
                </td>
                {roles.map((role) => {
                  const granted = matrix[role]?.[perm.key] ?? false
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(role, perm.key)}
                        className={clsx(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-all text-sm',
                          granted
                            ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                            : 'bg-white border-gray-200 text-gray-300 hover:border-gray-400'
                        )}
                        title={granted ? 'Click to revoke' : 'Click to grant'}
                      >
                        {granted ? '✓' : '×'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save bar */}
      <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save permissions'}
        </button>
        <button
          onClick={handleResetToDefaults}
          disabled={saving}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Reset to defaults
        </button>
        {saved  && <span className="text-sm text-green-600 font-medium">✓ Permissions saved</span>}
        {error  && <span className="text-sm text-red-600">{error}</span>}
        <span className="text-xs text-gray-400 ml-auto">
          Changes take effect immediately. Master Admin is always unrestricted.
        </span>
      </div>
    </div>
  )
}
