'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

interface PermDef { key: string; label: string; description: string; category: string }
interface Category { key: string; label: string; icon: string }

interface Props {
  userId: string
  userRole: string
  categories: Category[]
  permissions: PermDef[]
  // role defaults: key → granted by role
  roleDefaults: Record<string, boolean>
  // existing overrides: key → true/false (null = no override)
  initialOverrides: Record<string, boolean>
}

type OverrideState = true | false | null // true=grant, false=deny, null=use role default

export function UserPermissionsEditor({ userId, userRole, categories, permissions, roleDefaults, initialOverrides }: Props) {
  const [activeCategory, setActiveCategory] = useState(categories[0].key)
  const [overrides, setOverrides] = useState<Record<string, OverrideState>>(() => {
    const map: Record<string, OverrideState> = {}
    for (const p of permissions) {
      map[p.key] = initialOverrides[p.key] !== undefined ? initialOverrides[p.key] : null
    }
    return map
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const categoryPerms = permissions.filter((p) => p.category === activeCategory)
  const overrideCount = Object.values(overrides).filter((v) => v !== null).length

  function cycle(key: string) {
    setOverrides((prev) => {
      const current = prev[key]
      // Cycle: null → grant → deny → null
      const next: OverrideState = current === null ? true : current === true ? false : null
      return { ...prev, [key]: next }
    })
    setSaved(false)
  }

  function clearAll() {
    setOverrides((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, null])))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Effective permission: override takes priority, then role default
  function effective(key: string): boolean {
    const ov = overrides[key]
    if (ov !== null) return ov as boolean
    return roleDefaults[key] ?? false
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <div className="text-sm font-bold text-gray-900">Permission overrides</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {overrideCount === 0
              ? `Using role defaults for ${userRole.replace('_', ' ')}`
              : `${overrideCount} override${overrideCount !== 1 ? 's' : ''} applied on top of ${userRole.replace('_', ' ')} defaults`}
          </div>
        </div>
        <span className="text-gray-400 text-xs">{open ? '▲ Hide' : '▼ Edit overrides'}</span>
      </button>

      {open && (
        <>
          <div className="border-t border-gray-100 px-5 py-3 bg-amber-50 text-xs text-amber-800">
            <strong>How overrides work:</strong> Each permission shows three states —
            <span className="mx-1 inline-block px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">Grant</span>
            forces the permission on regardless of role,
            <span className="mx-1 inline-block px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-medium">Deny</span>
            forces it off, and
            <span className="mx-1 inline-block px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">Default</span>
            uses the role's setting. Click a permission button to cycle through the states.
          </div>

          {/* Category tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
            {categories.map((cat) => {
              const hasOverride = permissions
                .filter((p) => p.category === cat.key)
                .some((p) => overrides[p.key] !== null)
              return (
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
                  {cat.icon} {cat.label}
                  {hasOverride && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />}
                </button>
              )
            })}
          </div>

          {/* Permission rows */}
          <div className="divide-y divide-gray-50">
            {categoryPerms.map((perm) => {
              const ov = overrides[perm.key]
              const roleGrant = roleDefaults[perm.key] ?? false
              const eff = effective(perm.key)

              return (
                <div key={perm.key} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{perm.label}</span>
                      {ov !== null && (
                        <span className={clsx(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          ov ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        )}>
                          {ov ? 'Override: Grant' : 'Override: Deny'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{perm.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Role default: <span className={roleGrant ? 'text-green-600' : 'text-gray-400'}>{roleGrant ? '✓ granted' : '✗ not granted'}</span>
                      {' · '}
                      Effective: <span className={eff ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{eff ? '✓ can access' : '✗ no access'}</span>
                    </div>
                  </div>

                  {/* Tri-state button */}
                  <button
                    onClick={() => cycle(perm.key)}
                    className={clsx(
                      'flex-shrink-0 px-3 py-1.5 rounded text-xs font-semibold border transition-colors',
                      ov === null  && 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200',
                      ov === true  && 'bg-green-500 text-white border-green-500 hover:bg-green-600',
                      ov === false && 'bg-red-500 text-white border-red-500 hover:bg-red-600',
                    )}
                  >
                    {ov === null ? 'Default' : ov ? 'Grant' : 'Deny'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Save bar */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save overrides'}
            </button>
            {overrideCount > 0 && (
              <button
                onClick={clearAll}
                disabled={saving}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Clear all overrides
              </button>
            )}
            {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </>
      )}
    </div>
  )
}
