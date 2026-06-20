import { Column, Hr, Link, Row, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface SubscriptionConfirmationProps {
  name?: string
  planName: string
  price: string
  billingInterval: string
  accountUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

export function SubscriptionConfirmation({
  name,
  planName,
  price,
  billingInterval,
  accountUrl,
  siteName,
  footerText,
  logoUrl,
}: SubscriptionConfirmationProps) {
  return (
    <EmailBase
      previewText={`Your ${planName} subscription is confirmed — welcome to ${siteName ?? 'the Gazette'}.`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>Subscription Confirmed</Text>
      <Text style={styles.subheading}>— Welcome to the Gazette —</Text>

      <Text style={styles.body}>
        {name ? `Dear ${name},` : 'Dear Reader,'}
      </Text>
      <Text style={styles.body}>
        We are most pleased to confirm that your subscription to{' '}
        {siteName ?? 'The Victorian Illustrated Gazette'} has been successfully established.
        Your first edition will be dispatched at the earliest opportunity.
      </Text>

      <Hr style={styles.divider} />

      {/* Subscription summary */}
      <Row>
        <Column style={{ width: '50%', paddingRight: 12 }}>
          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{planName}</Text>
        </Column>
        <Column style={{ width: '50%', paddingLeft: 12 }}>
          <Text style={styles.label}>Billing</Text>
          <Text style={styles.value}>{price} / {billingInterval}</Text>
        </Column>
      </Row>

      <Hr style={styles.divider} />

      <Text style={styles.body}>
        You may review your subscription, update your correspondence details, or manage your billing at any time from your account.
      </Text>

      <Link href={accountUrl} style={styles.button}>
        View My Account
      </Link>

      <Text style={styles.small}>
        Thank you for your patronage. We look forward to serving you well.
      </Text>
    </EmailBase>
  )
}

export default SubscriptionConfirmation
