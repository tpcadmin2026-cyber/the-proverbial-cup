import { Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface GiftNotificationProps {
  recipientName?: string
  companyName: string
  planName: string
  note?: string
  alreadyActive: boolean
  ctaUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

export function GiftNotification({ recipientName, companyName, planName, note, alreadyActive, ctaUrl, siteName, footerText, logoUrl }: GiftNotificationProps) {
  return (
    <EmailBase
      previewText={`${companyName} has gifted you a ${planName} subscription to ${siteName ?? 'the Gazette'}.`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>A Gift Awaits You</Text>
      <Text style={styles.subheading}>— Compliments of {companyName} —</Text>

      <Text style={styles.body}>
        {recipientName ? `Dear ${recipientName},` : 'Dear Reader,'}
      </Text>
      <Text style={styles.body}>
        <strong>{companyName}</strong> has gifted you a <strong>{planName}</strong> subscription to{' '}
        {siteName ?? 'The Victorian Illustrated Gazette'}.
      </Text>
      {note && (
        <Text style={{ ...styles.body, fontStyle: 'italic' }}>
          &ldquo;{note}&rdquo;
        </Text>
      )}

      <Hr style={styles.divider} />

      {alreadyActive ? (
        <>
          <Text style={styles.body}>
            Your subscription is already active on your existing account — no further action is needed.
          </Text>
          <Link href={ctaUrl} style={styles.button}>
            View My Account
          </Link>
        </>
      ) : (
        <>
          <Text style={styles.body}>
            Create your account using this email address and your subscription will activate automatically.
          </Text>
          <Link href={ctaUrl} style={styles.button}>
            Create My Account
          </Link>
        </>
      )}

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        Should the button above fail to respond, copy and paste the following address into your browser:{' '}
        <Link href={ctaUrl} style={{ color: '#7a1515' }}>{ctaUrl}</Link>
      </Text>
    </EmailBase>
  )
}

export default GiftNotification
