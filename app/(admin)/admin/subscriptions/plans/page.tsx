import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { PlanList } from '../PlanList'

export default async function PlansPage() {
  const [plans, stats] = await Promise.all([
    db.subscriptionPlan.findMany({ orderBy: { displayOrder: 'asc' } }),
    Promise.all([
      db.userSubscription.count(),
      db.userSubscription.count({ where: { status: 'active' } }),
      db.userSubscription.count({ where: { status: 'paused' } }),
      db.userSubscription.count({ where: { status: 'cancelled' } }),
    ]),
  ])
  const [total, active, paused, cancelled] = stats

  return (
    <>
      <AdminHeader
        title="Subscription plans"
        subtitle="Define and manage your subscription tiers. Add as many plans as you need."
      />
      <div className="p-8 max-w-4xl space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total subscribers', value: total },
            { label: 'Active',            value: active },
            { label: 'Paused',            value: paused },
            { label: 'Cancelled',         value: cancelled },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <PlanList initialPlans={plans} />
      </div>
    </>
  )
}
