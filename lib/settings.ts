// Settings helpers — read and write admin-configurable settings stored in the DB.
// Values are stored as JSON strings so any type (string, number, boolean, object) is supported.

import { db } from './db'
import { logChange } from './changelog'

// Read a single setting value (parsed from JSON).
export async function getSetting<T = string>(key: string, fallback?: T): Promise<T> {
  const row = await db.setting.findUnique({ where: { key } })
  if (!row) return fallback as T
  try {
    return JSON.parse(row.value) as T
  } catch {
    return row.value as unknown as T
  }
}

// Read all settings in a group, returned as a flat key→value map.
export async function getSettingGroup(group: string): Promise<Record<string, unknown>> {
  const rows = await db.setting.findMany({ where: { group } })
  const out: Record<string, unknown> = {}
  for (const row of rows) {
    const shortKey = row.key.startsWith(`${group}.`) ? row.key.slice(group.length + 1) : row.key
    try { out[shortKey] = JSON.parse(row.value) } catch { out[shortKey] = row.value }
  }
  return out
}

// Read all settings, grouped.
export async function getAllSettings() {
  const rows = await db.setting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] })
  const groups: Record<string, typeof rows> = {}
  for (const row of rows) {
    if (!groups[row.group]) groups[row.group] = []
    groups[row.group].push(row)
  }
  return groups
}

// Write a single setting. Logs the change to the changelog.
export async function saveSetting(
  key: string,
  value: unknown,
  actor = 'system'
): Promise<void> {
  const encoded = JSON.stringify(value)
  const existing = await db.setting.findUnique({ where: { key } })
  if (existing?.value === encoded) return // no change

  await db.setting.update({ where: { key }, data: { value: encoded } })

  await logChange({
    eventType: 'settings_change',
    title: `Setting updated: ${key}`,
    actor,
    metadata: { key, newValue: value },
  })

  // Trigger backup if configured
  const backupOnSettings = await getSetting<boolean>('backups.onSettingsChange', false)
  if (backupOnSettings) {
    const { triggerBackup } = await import('./backup')
    await triggerBackup('settings_change', actor)
  }
}

// Write multiple settings at once (one changelog entry for the batch).
export async function saveSettings(
  updates: Record<string, unknown>,
  actor = 'system'
): Promise<void> {
  const keys = Object.keys(updates)
  if (keys.length === 0) return

  await Promise.all(
    keys.map((key) =>
      db.setting.updateMany({
        where: { key },
        data: { value: JSON.stringify(updates[key]) },
      })
    )
  )

  await logChange({
    eventType: 'settings_change',
    title: `${keys.length} setting${keys.length > 1 ? 's' : ''} updated`,
    actor,
    metadata: { keys, updates },
  })

  const backupOnSettings = await getSetting<boolean>('backups.onSettingsChange', false)
  if (backupOnSettings) {
    const { triggerBackup } = await import('./backup')
    await triggerBackup('settings_change', actor)
  }
}
