import { hash, compare } from 'bcryptjs'
import { randomBytes } from 'crypto'
import * as React from 'react'
import { db } from './db'
import { logChange } from './changelog'
import { getSetting } from './settings'

// ── Passwords ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed)
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)          return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password))      return 'Password must contain at least one uppercase letter.'
  if (!/[0-9]/.test(password))      return 'Password must contain at least one number.'
  return null
}

// ── Tokens ────────────────────────────────────────────────────────────────────

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// ── Verification tokens (email verify + password reset) ───────────────────────

export async function createVerificationToken(
  identifier: string, // email address
  type: 'verify' | 'reset',
  expiresInMinutes = 60
): Promise<string> {
  const token = generateToken()
  const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  // Prefix the identifier with the type so verify and reset tokens don't collide
  const prefixed = `${type}:${identifier}`

  await db.verificationToken.deleteMany({ where: { identifier: prefixed } })

  await db.verificationToken.create({
    data: { identifier: prefixed, token, expires },
  })

  return token
}

export async function consumeVerificationToken(
  identifier: string,
  token: string,
  type: 'verify' | 'reset'
): Promise<boolean> {
  const prefixed = `${type}:${identifier}`
  const record = await db.verificationToken.findUnique({
    where: { identifier_token: { identifier: prefixed, token } },
  })

  if (!record) return false
  if (record.expires < new Date()) {
    await db.verificationToken.delete({
      where: { identifier_token: { identifier: prefixed, token } },
    })
    return false
  }

  await db.verificationToken.delete({
    where: { identifier_token: { identifier: prefixed, token } },
  })

  return true
}

// ── Session management ────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const token = generateToken()
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days

  await db.session.create({
    data: { sessionToken: token, userId, expires },
  })

  return token
}

export async function getSessionUser(token: string) {
  if (!token) return null

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: { include: { plan: true } } } } },
  })

  if (!session || session.expires < new Date()) return null
  return session.user
}

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { sessionToken: token } })
}

// ── Email sending ─────────────────────────────────────────────────────────────

async function getEmailConfig() {
  const [siteName, fromName, fromAddress, replyTo, footerText, logoUrl, dbApiKey] = await Promise.all([
    getSetting<string>('site.name',          'The Victorian Illustrated Gazette'),
    getSetting<string>('email.fromName',     'The Victorian Illustrated Gazette'),
    getSetting<string>('email.fromAddress',  ''),
    getSetting<string>('email.replyTo',      ''),
    getSetting<string>('email.footer',       ''),
    getSetting<string>('site.logoUrl',       ''),
    getSetting<string>('email.apiKey',       ''),
  ])
  const apiKey = process.env.RESEND_API_KEY || dbApiKey
  return { siteName, fromName, fromAddress, replyTo, footerText, logoUrl, apiKey }
}

export async function sendHtmlEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}): Promise<void> {
  const { siteName, fromName, fromAddress, replyTo, apiKey } = await getEmailConfig()

  if (!apiKey || !fromAddress) {
    // Dev / unconfigured — log to terminal
    console.log('\n' + '═'.repeat(60))
    console.log('📧  DEV EMAIL (not sent' + (!apiKey ? ' — no RESEND_API_KEY' : ' — no from address') + ')')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('═'.repeat(60) + '\n')
    return
  }

  const { renderAsync } = await import('@react-email/components')
  const { Resend }      = await import('resend')

  const html = await renderAsync(react)
  const resend = new Resend(apiKey)
  const from = `${fromName} <${fromAddress}>`

  const result = await resend.emails.send({
    from,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  })

  if (result.error) {
    console.error('[Resend] Failed to send email to', to, result.error)
    throw new Error(`Email send failed: ${result.error.message}`)
  }
}

// ── Auth emails ───────────────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, baseUrl: string, name?: string) {
  const token = await createVerificationToken(email, 'verify')
  const url   = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  const { siteName, footerText, logoUrl } = await getEmailConfig()

  const { VerifyEmail } = await import('@/emails/VerifyEmail')
  await sendHtmlEmail({
    to:      email,
    subject: `Verify your ${siteName} account`,
    react:   React.createElement(VerifyEmail, { name, verifyUrl: url, siteName, footerText: footerText || undefined, logoUrl: logoUrl || undefined }),
  })
}

export async function sendPasswordResetEmail(email: string, baseUrl: string) {
  const token = await createVerificationToken(email, 'reset', 30)
  const url   = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

  const { siteName, footerText, logoUrl } = await getEmailConfig()

  const { PasswordReset } = await import('@/emails/PasswordReset')
  await sendHtmlEmail({
    to:      email,
    subject: `Reset your ${siteName} password`,
    react:   React.createElement(PasswordReset, { resetUrl: url, siteName, footerText: footerText || undefined, logoUrl: logoUrl || undefined }),
  })
}

export async function sendInviteEmail(
  email: string,
  role: string,
  inviterName: string,
  baseUrl: string
) {
  const token = await createVerificationToken(email, 'verify', 60 * 72) // 72 hours
  const url   = `${baseUrl}/accept-invite?token=${token}&email=${encodeURIComponent(email)}&role=${role}`
  await sendInviteEmailWithLink({ to: email, link: url, role, inviterName, baseUrl })
}

// Send an invite email using a pre-built link (avoids creating a second token).
export async function sendInviteEmailWithLink({
  to, link, role, inviterName, baseUrl: _baseUrl,
}: {
  to: string
  link: string
  role: string
  inviterName: string
  baseUrl: string
}) {
  const { siteName, footerText, logoUrl } = await getEmailConfig()

  const { TeamInvite } = await import('@/emails/TeamInvite')
  await sendHtmlEmail({
    to,
    subject: `You have been invited to ${siteName}`,
    react:   React.createElement(TeamInvite, { inviterName, role, acceptUrl: link, siteName, footerText: footerText || undefined, logoUrl: logoUrl || undefined }),
  })

  await logChange({
    eventType: 'manual',
    title:     `Invitation sent to ${to} (${role})`,
    actor:     inviterName,
  })
}

// ── Transactional emails ──────────────────────────────────────────────────────

export async function sendSubscriptionConfirmationEmail({
  email,
  name,
  planName,
  price,
  billingInterval,
  baseUrl,
}: {
  email: string
  name?: string
  planName: string
  price: string
  billingInterval: string
  baseUrl: string
}) {
  const { siteName, footerText, logoUrl } = await getEmailConfig()

  const { SubscriptionConfirmation } = await import('@/emails/SubscriptionConfirmation')
  await sendHtmlEmail({
    to:      email,
    subject: `Welcome to ${siteName} — your subscription is confirmed`,
    react:   React.createElement(SubscriptionConfirmation, {
      name,
      planName,
      price,
      billingInterval,
      accountUrl: `${baseUrl}/account`,
      siteName,
      footerText: footerText || undefined,
      logoUrl: logoUrl || undefined,
    }),
  })
}

export async function sendOrderConfirmationEmail({
  email,
  name,
  orderNumber,
  items,
  subtotal,
  total,
}: {
  email: string
  name?: string
  orderNumber: string
  items: { name: string; quantity: number; price: string }[]
  subtotal: string
  total: string
}) {
  const { siteName, footerText, logoUrl } = await getEmailConfig()

  const { OrderConfirmation } = await import('@/emails/OrderConfirmation')
  await sendHtmlEmail({
    to:      email,
    subject: `Order #${orderNumber} confirmed — ${siteName}`,
    react:   React.createElement(OrderConfirmation, {
      name,
      orderNumber,
      items,
      subtotal,
      total,
      siteName,
      footerText: footerText || undefined,
      logoUrl: logoUrl || undefined,
    }),
  })
}

export async function sendBackupNotificationEmail({
  email,
  trigger,
  storageKey,
}: {
  email: string
  trigger: string
  storageKey: string
}) {
  const { siteName, footerText } = await getEmailConfig()
  const { BackupNotification } = await import('@/emails/BackupNotification')
  await sendHtmlEmail({
    to:      email,
    subject: `[${siteName}] Backup completed — ${trigger.replace(/_/g, ' ')}`,
    react:   React.createElement(BackupNotification, {
      trigger,
      storageKey,
      completedAt: new Date().toUTCString(),
      siteName,
      footerText: footerText || undefined,
    }),
  })
}
