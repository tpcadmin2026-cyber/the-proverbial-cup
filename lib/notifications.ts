// Categorized admin notifications — orders, subscriptions, and so on.
// Extend NOTIFICATION_CATEGORIES with a new { type, label, icon } entry to add a category.

import { db } from './db'

export type NotificationType = 'order' | 'subscription'

export const NOTIFICATION_CATEGORIES: Array<{ type: NotificationType; label: string; icon: string }> = [
  { type: 'order',        label: 'Orders',        icon: '⊡' },
  { type: 'subscription', label: 'Subscriptions', icon: '✦' },
]

interface CreateNotificationInput {
  type: NotificationType
  title: string
  body?: string
  refId?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await db.notification.create({
      data: {
        type:     input.type,
        title:    input.title,
        body:     input.body ?? null,
        refId:    input.refId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    })
  } catch (err) {
    // Notifications must never break the main operation (order/subscription flow)
    console.error('[notifications] Failed to create notification:', err)
  }
}

export async function getUnreadCounts(): Promise<Record<string, number>> {
  const rows = await db.notification.groupBy({ by: ['type'], where: { read: false }, _count: { _all: true } })
  return Object.fromEntries(rows.map((r) => [r.type, r._count._all]))
}
