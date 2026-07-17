import { NextRequest, NextResponse } from 'next/server'
import { renderAsync } from '@react-email/components'
import { getSetting } from '@/lib/settings'
import * as React from 'react'
import { requireAdmin } from '@/lib/auth'

const SITE = 'My Site'
const BASE = 'http://localhost:3000'

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

export async function GET(_req: NextRequest, { params }: { params: { template: string } }) {
  await requireAdmin()
  const siteName = await getSetting<string>('site.name', SITE)
  const footerText = await getSetting<string>('email.footer', `© ${siteName}`)
  const currency = await getSetting<string>('payments.currency', 'USD')

  let element: React.ReactElement | null = null

  switch (params.template) {
    case 'verify': {
      const { VerifyEmail } = await import('@/emails/VerifyEmail')
      element = React.createElement(VerifyEmail, {
        name: 'Dear Reader',
        verifyUrl: `${BASE}/verify-email?token=preview_token_example&email=reader%40example.com`,
        siteName,
        footerText,
      })
      break
    }
    case 'reset': {
      const { PasswordReset } = await import('@/emails/PasswordReset')
      element = React.createElement(PasswordReset, {
        resetUrl: `${BASE}/reset-password?token=preview_token_example&email=reader%40example.com`,
        siteName,
        footerText,
      })
      break
    }
    case 'invite': {
      const { TeamInvite } = await import('@/emails/TeamInvite')
      element = React.createElement(TeamInvite, {
        inviterName: 'Travis',
        role: 'manager',
        acceptUrl: `${BASE}/accept-invite?token=preview_token_example&email=newstaff%40example.com&role=manager`,
        siteName,
        footerText,
      })
      break
    }
    case 'subscription': {
      const { SubscriptionConfirmation } = await import('@/emails/SubscriptionConfirmation')
      element = React.createElement(SubscriptionConfirmation, {
        name: 'Archibald Pemberton',
        planName: 'The Connoisseur',
        price: formatPrice(19.99, currency),
        billingInterval: 'monthly',
        accountUrl: `${BASE}/account`,
        siteName,
        footerText,
      })
      break
    }
    case 'order': {
      const { OrderConfirmation } = await import('@/emails/OrderConfirmation')
      element = React.createElement(OrderConfirmation, {
        name: 'Archibald Pemberton',
        orderNumber: '00042681',
        items: [
          { name: 'Ethiopian Single Origin — 250g', quantity: 2, price: formatPrice(9.99, currency) },
          { name: 'Copper Pour-Over Set', quantity: 1, price: formatPrice(34.99, currency) },
        ],
        subtotal: formatPrice(54.97, currency),
        total: formatPrice(54.97, currency),
        siteName,
        footerText,
      })
      break
    }
    case 'backup': {
      const { BackupNotification } = await import('@/emails/BackupNotification')
      element = React.createElement(BackupNotification, {
        trigger: 'manual',
        storageKey: 'backups/2026-06-05T12-00-00-000Z-manual.json',
        completedAt: new Date().toUTCString(),
        siteName,
        footerText,
      })
      break
    }
    default:
      return NextResponse.json({ error: 'Unknown template' }, { status: 404 })
  }

  const html = await renderAsync(element)
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
