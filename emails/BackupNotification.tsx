import { Hr, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface BackupNotificationProps {
  trigger: string
  storageKey: string
  completedAt: string
  siteName?: string
  footerText?: string
}

export function BackupNotification({ trigger, storageKey, completedAt, siteName, footerText }: BackupNotificationProps) {
  const triggerLabel = trigger.replace(/_/g, ' ')

  return (
    <EmailBase
      previewText={`Backup completed — ${triggerLabel}`}
      siteName={siteName}
      footerText={footerText}
    >
      <Text style={styles.heading}>Backup Completed</Text>
      <Text style={styles.subheading}>— System Notification —</Text>

      <Text style={styles.body}>A {triggerLabel} backup of {siteName ?? 'your site'} completed successfully.</Text>

      <Hr style={styles.divider} />

      <Text style={styles.label}>Completed at</Text>
      <Text style={styles.value}>{completedAt}</Text>

      <Text style={styles.label}>Storage key</Text>
      <Text style={{ ...styles.value, fontFamily: 'monospace', fontSize: 12 }}>{storageKey}</Text>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        This is an automated notification. You can review all backups in the admin panel under Settings → Deploy.
      </Text>
    </EmailBase>
  )
}

export default BackupNotification
