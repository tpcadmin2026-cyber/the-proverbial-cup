import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { PauseForm } from './PauseForm'

export default async function PausePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) redirect('/login?redirect=/account/pause')

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: { include: { plan: true } } } } },
  })

  if (!session || session.expires < new Date()) redirect('/login?redirect=/account/pause')

  const sub = session.user.subscription
  if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
    redirect('/account')
  }

  return (
    <PauseForm
      planName={sub.plan.name}
      maxPauseDays={sub.plan.maxPauseDays}
      currentStatus={sub.status}
    />
  )
}
