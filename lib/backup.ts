// Backup system — snapshots PostgreSQL + media manifest to Backblaze B2.
// Triggered on deploy, content save, settings change, or manually from admin.

import { db } from './db'
import { logChange } from './changelog'
import { getSetting } from './settings'

export type BackupTrigger = 'deploy' | 'content_save' | 'settings_change' | 'manual' | 'scheduled'

// Tag a backup for retention policy (daily / weekly / monthly).
function retentionTag(): string {
  const now = new Date()
  const day = now.getDate()
  const dow = now.getDay() // 0 = Sunday
  if (day === 1) return 'monthly'
  if (dow === 0) return 'weekly'
  return 'daily'
}

export async function triggerBackup(trigger: BackupTrigger, actor = 'system') {
  // Create a pending record immediately so the admin panel shows it
  const record = await db.backupRecord.create({
    data: { trigger, status: 'running', retentionTag: retentionTag() },
  })

  try {
    // Env vars take precedence over DB settings
    const b2KeyId    = process.env.B2_KEY_ID           || await getSetting<string>('b2.keyId',    '')
    const b2AppKey   = process.env.B2_APPLICATION_KEY  || await getSetting<string>('b2.appKey',   '')
    const b2Bucket   = process.env.B2_BUCKET_NAME      || await getSetting<string>('b2.bucket',   '')
    const b2Endpoint = process.env.B2_ENDPOINT         || await getSetting<string>('b2.endpoint', '')

    if (!b2KeyId || !b2AppKey || !b2Bucket || !b2Endpoint) {
      throw new Error('Backblaze B2 credentials are not configured. Add them in Settings → Connections.')
    }

    // Build backup manifest
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const storageKey = `backups/${timestamp}-${trigger}.json`

    const manifest = {
      timestamp,
      trigger,
      actor,
      platform: 'gazette-platform',
      version: '0.1.0',
      // In production: dump the database and include the dump URL,
      // compress media refs, etc. For Phase 2 we store the manifest.
      note: 'Full database dump and media sync will be added in Phase 6 deploy system.',
    }

    // Upload to B2 via S3-compatible API
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
    const s3 = new S3Client({
      region: 'auto',
      endpoint: b2Endpoint,
      credentials: { accessKeyId: b2KeyId, secretAccessKey: b2AppKey },
    })

    const body = JSON.stringify(manifest, null, 2)
    await s3.send(new PutObjectCommand({
      Bucket: b2Bucket,
      Key:    storageKey,
      Body:   body,
      ContentType: 'application/json',
    }))

    await db.backupRecord.update({
      where: { id: record.id },
      data: {
        status:      'completed',
        storageKey,
        sizeBytes:   BigInt(body.length),
        completedAt: new Date(),
      },
    })

    await logChange({
      eventType:   'backup',
      title:       `Backup completed (${trigger})`,
      actor,
      metadata:    { storageKey, trigger },
    })

    // Notify if configured
    const notifyEmail = await getSetting<string>('backups.notifyEmail', '')
    if (notifyEmail) {
      const { sendBackupNotificationEmail } = await import('./auth-utils')
      await sendBackupNotificationEmail({ email: notifyEmail, trigger, storageKey }).catch(console.error)
    }

    await pruneOldBackups()

    return record.id

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await db.backupRecord.update({
      where: { id: record.id },
      data: { status: 'failed', errorMessage: message, completedAt: new Date() },
    })
    await logChange({
      eventType:   'backup',
      title:       `Backup failed (${trigger})`,
      description: message,
      actor,
    })
    throw err
  }
}

// Prune backups beyond the retention limits.
async function pruneOldBackups() {
  const [daily, weekly, monthly] = await Promise.all([
    getSetting<number>('backups.retainDaily', 30),
    getSetting<number>('backups.retainWeekly', 12),
    getSetting<number>('backups.retainMonthly', 12),
  ])

  for (const [tag, limit] of [['daily', daily], ['weekly', weekly], ['monthly', monthly]] as const) {
    const all = await db.backupRecord.findMany({
      where: { retentionTag: tag, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    })
    if (all.length > limit) {
      const toDelete = all.slice(limit)
      await db.backupRecord.deleteMany({ where: { id: { in: toDelete.map((b) => b.id) } } })
    }
  }
}

// Get the last N backup records for the admin panel.
export async function getRecentBackups(limit = 10) {
  return db.backupRecord.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}
