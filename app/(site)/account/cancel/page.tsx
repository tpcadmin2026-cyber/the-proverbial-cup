import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { CancelForm } from './CancelForm'

export default async function CancelPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) redirect('/login?redirect=/account/cancel')

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: { include: { plan: true } } } } },
  })

  if (!session || session.expires < new Date()) redirect('/login?redirect=/account/cancel')

  const sub = session.user.subscription
  if (!sub || sub.status === 'cancelled') redirect('/account')

  const cancelReasons = await db.cancelReason.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  })

  return (
    <CancelForm
      planName={sub.plan.name}
      reasons={cancelReasons.map((r) => ({ id: r.id, label: r.label, allowFreeText: r.allowFreeText }))}
    />
  )
}
