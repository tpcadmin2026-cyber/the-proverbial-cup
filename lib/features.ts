// Feature flag helpers — read and toggle feature flags stored in the DB.
// Every toggle persists immediately and affects the live site.

import { db } from './db'
import { logChange } from './changelog'

export type FeatureFlagKey =
  | 'subscriptions'
  | 'ecommerce'
  | 'ai_chat'
  | 'quiz'
  | 'knowledge_base'
  | 'support_tickets'
  | 'feature_requests'
  | 'contact_form'
  | 'newsletter'
  | 'waitlist'
  | 'analytics'
  | 'corporate_gifting'
  | 'reading_room'

// Check if a single feature is enabled.
export async function isEnabled(key: FeatureFlagKey): Promise<boolean> {
  const flag = await db.featureFlag.findUnique({ where: { key } })
  return flag?.enabled ?? false
}

// Get all feature flags.
export async function getAllFlags() {
  return db.featureFlag.findMany({ orderBy: [{ category: 'asc' }, { label: 'asc' }] })
}

// Toggle a feature flag on or off. Logs the change.
export async function toggleFlag(
  key: FeatureFlagKey,
  enabled: boolean,
  actor = 'system'
): Promise<void> {
  const flag = await db.featureFlag.findUnique({ where: { key } })
  if (!flag) throw new Error(`Unknown feature flag: ${key}`)
  if (flag.enabled === enabled) return

  await db.featureFlag.update({ where: { key }, data: { enabled } })

  await logChange({
    eventType: 'feature_toggle',
    title: `${flag.label} turned ${enabled ? 'on' : 'off'}`,
    description: flag.description,
    actor,
    metadata: { key, enabled },
  })
}

// Get a map of key → enabled for all flags (efficient single query).
export async function getFlagsMap(): Promise<Record<string, boolean>> {
  const flags = await db.featureFlag.findMany()
  return Object.fromEntries(flags.map((f) => [f.key, f.enabled]))
}
