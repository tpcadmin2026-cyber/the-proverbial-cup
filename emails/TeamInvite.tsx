import { Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface TeamInviteProps {
  inviterName: string
  role: string
  acceptUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

const ROLE_LABELS: Record<string, string> = {
  master_admin: 'Master Administrator',
  admin:    'Administrator',
  manager:  'Manager',
  employee: 'Editorial Staff',
}

export function TeamInvite({ inviterName, role, acceptUrl, siteName, footerText, logoUrl }: TeamInviteProps) {
  const roleLabel = ROLE_LABELS[role] ?? role

  return (
    <EmailBase
      previewText={`${inviterName} has invited you to join ${siteName ?? 'the Gazette'} — accept your invitation.`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>You Have Been Invited</Text>
      <Text style={styles.subheading}>— A Staff Appointment —</Text>

      <Text style={styles.body}>Dear Colleague,</Text>
      <Text style={styles.body}>
        <strong>{inviterName}</strong> has extended an invitation for you to join{' '}
        {siteName ?? 'The Victorian Illustrated Gazette'} as a member of the{' '}
        <strong>{roleLabel}</strong> staff.
      </Text>
      <Text style={styles.body}>
        To accept this appointment and establish your credentials, please follow the link below.
        You will be asked to create a password upon your first visit.
      </Text>

      <Hr style={styles.divider} />

      <Link href={acceptUrl} style={styles.button}>
        Accept Appointment
      </Link>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        This invitation expires in 72 hours.
      </Text>
      <Text style={styles.small}>
        If you were not expecting this invitation, you may discard this message. No account will be created without your acceptance.
      </Text>
      <Text style={styles.small}>
        Should the button above fail to respond:{' '}
        <Link href={acceptUrl} style={{ color: '#7a1515' }}>{acceptUrl}</Link>
      </Text>
    </EmailBase>
  )
}

export default TeamInvite
