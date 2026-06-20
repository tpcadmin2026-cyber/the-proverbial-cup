// Changelog helpers — every significant platform event is recorded here automatically.

import { db } from './db'

export type ChangelogEventType =
  | 'deploy'
  | 'feature_toggle'
  | 'content_save'
  | 'settings_change'
  | 'backup'
  | 'manual'
  | 'user'
  | 'subscription'

interface LogChangeInput {
  eventType: ChangelogEventType
  title: string
  description?: string
  actor?: string
  metadata?: Record<string, unknown>
  isPublic?: boolean
}

export async function logChange(input: LogChangeInput) {
  try {
    await db.changelogEntry.create({
      data: {
        eventType:   input.eventType,
        title:       input.title,
        description: input.description,
        actor:       input.actor ?? 'system',
        metadata:    input.metadata ? JSON.stringify(input.metadata) : null,
        isPublic:    input.isPublic ?? false,
      },
    })
  } catch (err) {
    // Changelog errors must never break the main operation
    console.error('[changelog] Failed to log event:', err)
  }
}

// Get the latest changelog entries.
export async function getChangelog(options?: {
  limit?: number
  eventType?: ChangelogEventType
  publicOnly?: boolean
}) {
  return db.changelogEntry.findMany({
    where: {
      ...(options?.eventType ? { eventType: options.eventType } : {}),
      ...(options?.publicOnly ? { isPublic: true } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
  })
}
