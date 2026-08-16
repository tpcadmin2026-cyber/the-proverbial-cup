import { Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface NewsletterConfirmationProps {
  name?: string
  confirmUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
  heading?: string
  subheading?: string
  intro?: string
}

export function NewsletterConfirmation({ name, confirmUrl, siteName, footerText, logoUrl, heading, subheading, intro }: NewsletterConfirmationProps) {
  return (
    <EmailBase
      previewText={`Confirm your subscription to the ${siteName ?? 'Gazette'} newsletter.`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>{heading ?? 'Confirm Your Subscription'}</Text>
      <Text style={styles.subheading}>{subheading ?? '— Despatches from the Gazette —'}</Text>

      <Text style={styles.body}>
        {name ? `Dear ${name},` : 'Dear Reader,'}
      </Text>
      <Text style={styles.body}>
        {intro ?? "Thank you for enrolling in our correspondence list. Please confirm your subscription by following the link below — you'll receive nothing further until you do."}
      </Text>

      <Hr style={styles.divider} />

      <Link href={confirmUrl} style={styles.button}>
        Confirm Subscription
      </Link>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        If you did not request this, you may discard this message — you will not be subscribed unless you confirm.
      </Text>
      <Text style={styles.small}>
        Should the button above fail to respond, copy and paste the following address into your browser:{' '}
        <Link href={confirmUrl} style={{ color: '#7a1515' }}>{confirmUrl}</Link>
      </Text>
    </EmailBase>
  )
}

export default NewsletterConfirmation
