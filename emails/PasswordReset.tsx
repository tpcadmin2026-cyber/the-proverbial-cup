import { Hr, Link, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'

interface PasswordResetProps {
  resetUrl: string
  siteName?: string
  footerText?: string
  logoUrl?: string
}

export function PasswordReset({ resetUrl, siteName, footerText, logoUrl }: PasswordResetProps) {
  return (
    <EmailBase
      previewText={`Reset your ${siteName ?? 'Gazette'} password — link expires in 30 minutes.`}
      siteName={siteName}
      footerText={footerText}
      logoUrl={logoUrl}
    >
      <Text style={styles.heading}>Password Reset Request</Text>
      <Text style={styles.subheading}>— From the Office of the Registrar —</Text>

      <Text style={styles.body}>Dear Reader,</Text>
      <Text style={styles.body}>
        A request has been received to reset the password for your{' '}
        {siteName ?? 'Gazette'} account. If this was indeed your doing, please follow
        the link below to establish a new password at your earliest convenience.
      </Text>

      <Hr style={styles.divider} />

      <Link href={resetUrl} style={styles.button}>
        Reset My Password
      </Link>

      <Hr style={styles.divider} />

      <Text style={styles.small}>
        This link expires in 30 minutes. After that point, you may request a fresh link from the sign-in page.
      </Text>
      <Text style={styles.small}>
        If you did not request this, your account remains entirely secure. No action is required on your part.
      </Text>
      <Text style={styles.small}>
        Should the button above fail to respond:{' '}
        <Link href={resetUrl} style={{ color: '#7a1515' }}>{resetUrl}</Link>
      </Text>
    </EmailBase>
  )
}

export default PasswordReset
