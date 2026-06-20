import { Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface VerifyEmailProps {
  name?: string
  verifyUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

export function VerifyEmail({ name, verifyUrl, siteName, footerText, logoUrl }: VerifyEmailProps) {
  return (
    <EmailBase
      previewText={`Verify your ${siteName ?? 'Gazette'} account — one click and you're in.`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>Confirm Your Correspondence</Text>
      <Text style={styles.subheading}>— Email Verification —</Text>

      <Text style={styles.body}>
        {name ? `Dear ${name},` : 'Dear Reader,'}
      </Text>
      <Text style={styles.body}>
        Welcome to {siteName ?? 'The Victorian Illustrated Gazette'}. We are delighted to have you among our subscribers.
        Before we may proceed, we ask that you confirm your correspondence address by following the link below.
      </Text>

      <Hr style={styles.divider} />

      <Link href={verifyUrl} style={styles.button}>
        Verify My Address
      </Link>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        This verification link expires in 60 minutes.
      </Text>
      <Text style={styles.small}>
        If you did not create an account with us, you may discard this missive with our apologies for the intrusion.
      </Text>
      <Text style={styles.small}>
        Should the button above fail to respond, copy and paste the following address into your browser:{' '}
        <Link href={verifyUrl} style={{ color: '#7a1515' }}>{verifyUrl}</Link>
      </Text>
    </EmailBase>
  )
}

export default VerifyEmail
