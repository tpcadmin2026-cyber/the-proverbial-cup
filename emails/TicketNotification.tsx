import { Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface TicketNotificationProps {
  kind: 'new' | 'reply'
  subject: string
  message: string
  fromName?: string
  ticketUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

export function TicketNotification({ kind, subject, message, fromName, ticketUrl, siteName, footerText, logoUrl }: TicketNotificationProps) {
  const heading = kind === 'new' ? 'New Support Enquiry' : 'New Reply on Your Ticket'
  const subheading = kind === 'new' ? '— A Reader Has Written In —' : `— From ${fromName ?? 'the desk'} —`

  return (
    <EmailBase
      previewText={kind === 'new' ? `New enquiry: ${subject}` : `New reply on: ${subject}`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>{heading}</Text>
      <Text style={styles.subheading}>{subheading}</Text>

      <Text style={styles.label}>Subject</Text>
      <Text style={styles.value}>{subject}</Text>

      <Hr style={{ ...styles.divider, margin: '16px 0' }} />

      <Text style={{ ...styles.body, whiteSpace: 'pre-wrap' as const }}>
        {message}
      </Text>

      <Hr style={styles.divider} />

      <Link href={ticketUrl} style={styles.button}>
        {kind === 'new' ? 'View & Reply' : 'View Ticket'}
      </Link>
    </EmailBase>
  )
}

export default TicketNotification
