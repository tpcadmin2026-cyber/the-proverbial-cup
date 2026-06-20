import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { AccountPortal } from './AccountPortal'

export const metadata: Metadata = { title: 'My Account' }

export default async function AccountPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) redirect('/login?redirect=/account')

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        include: {
          subscription: { include: { plan: true } },
        },
      },
    },
  })

  if (!session || session.expires < new Date()) redirect('/login?redirect=/account')

  const [siteName, currency] = await Promise.all([
    getSetting<string>('site.name', 'My Site'),
    getSetting<string>('payments.currency', 'GBP'),
  ])

  const user = session.user

  return (
    <AccountPortal
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        notifyByEmail: user.notifyByEmail,
        notifyBySms: user.notifyBySms,
        phoneNumber: user.phoneNumber,
      }}
      subscription={user.subscription ? {
        status: user.subscription.status,
        billingInterval: user.subscription.billingInterval,
        currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString() ?? null,
        pauseResumesAt: user.subscription.pauseResumesAt?.toISOString() ?? null,
        cancelledAt: user.subscription.cancelledAt?.toISOString() ?? null,
        trialEndsAt: user.subscription.trialEndsAt?.toISOString() ?? null,
        plan: {
          name: user.subscription.plan.name,
          slug: user.subscription.plan.slug,
          priceMonthly: user.subscription.plan.priceMonthly,
          priceYearly: user.subscription.plan.priceYearly,
          features: user.subscription.plan.features,
          maxPauseDays: user.subscription.plan.maxPauseDays,
        },
      } : null}
      siteName={siteName}
      currency={currency}
    />
  )
}
