import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { UserEditor } from './UserEditor'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params

  const [user, plans] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: {
        subscription: { include: { plan: true } },
      },
    }),
    db.subscriptionPlan.findMany({ where: { visible: true }, orderBy: { displayOrder: 'asc' } }),
  ])

  if (!user) notFound()

  return (
    <>
      <AdminHeader
        title={user.name ?? user.email}
        subtitle={`${user.role} · joined ${format(user.createdAt, 'dd MMM yyyy')}`}
      />
      <div className="p-8 max-w-2xl space-y-6">

        {/* Read-only info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email</div>
            <div className="font-medium text-gray-900">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Email verified</div>
            <div className={user.emailVerified ? 'text-green-600 font-medium' : 'text-gray-400'}>
              {user.emailVerified ? `✓ ${format(user.emailVerified, 'dd MMM yyyy')}` : 'Not verified'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Joined</div>
            <div className="text-gray-700">{format(user.createdAt, 'dd MMM yyyy, HH:mm')}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notifications</div>
            <div className="text-gray-700 text-xs space-y-0.5">
              {user.notifyByEmail && <div>Email ✓</div>}
              {user.notifyBySms && <div>SMS ✓</div>}
              {!user.notifyByEmail && !user.notifyBySms && <div className="text-gray-400">None</div>}
            </div>
          </div>
          {user.subscription && (
            <>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Subscription</div>
                <div className="font-medium text-gray-900">{user.subscription.plan.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sub status</div>
                <div className={`font-medium capitalize ${
                  user.subscription.status === 'active'    ? 'text-green-600' :
                  user.subscription.status === 'paused'    ? 'text-yellow-600' :
                  user.subscription.status === 'cancelled' ? 'text-red-500' : 'text-gray-500'
                }`}>{user.subscription.status}</div>
              </div>
            </>
          )}
        </div>

        {/* Editable fields */}
        <UserEditor user={{ id: user.id, name: user.name ?? '', role: user.role }} plans={plans} subscription={user.subscription ? { planId: user.subscription.planId, status: user.subscription.status } : null} />

      </div>
    </>
  )
}
