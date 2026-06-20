import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Users' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { ROLE_LABELS } from '@/lib/access'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      subscription: { include: { plan: true } },
    },
  })

  const [totalCount, subscriberCount, adminCount, masterCount] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: 'subscriber' } }),
    db.user.count({ where: { role: 'admin' } }),
    db.user.count({ where: { role: 'master_admin' } }),
  ])

  return (
    <>
      <AdminHeader
        title="Users"
        subtitle="Everyone with an account — subscribers, customers, and admins."
      />
      <div className="p-8 space-y-6 max-w-5xl">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total users"    value={totalCount} />
          <StatCard label="Subscribers"    value={subscriberCount} />
          <StatCard label="Admins"         value={adminCount} />
          <StatCard label="Master admins"  value={masterCount} color="text-[#7A564C]" />
        </div>

        {/* Role legend */}
        <section className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Role definitions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(ROLE_LABELS).map(([key, info]) => (
              <div key={key} className="flex items-start gap-3">
                <span className={`flex-shrink-0 mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${info.color}`}>
                  {info.label}
                </span>
                <p className="text-xs text-gray-500">{info.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* User table */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">All users</h2>
            <span className="text-xs text-gray-400">{totalCount} total</span>
          </div>

          {users.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              No users yet. They will appear here once people sign up.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name / Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subscription</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verified</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((user) => {
                    const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.customer
                    const sub = user.subscription
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-[#E8E6D8] border border-[#c8c4a8] flex items-center justify-center text-xs font-bold text-[#C4AB77] flex-shrink-0">
                              {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                            </div>
                            <div>
                              {user.name && <div className="font-medium text-gray-900">{user.name}</div>}
                              <div className={user.name ? 'text-xs text-gray-400' : 'text-gray-900'}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {sub ? (
                            <div>
                              <div className="text-xs font-medium text-gray-900">{sub.plan.name}</div>
                              <div className={`text-xs mt-0.5 capitalize ${
                                sub.status === 'active'    ? 'text-green-600' :
                                sub.status === 'paused'    ? 'text-yellow-600' :
                                sub.status === 'cancelled' ? 'text-red-500' : 'text-gray-400'
                              }`}>{sub.status}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {user.emailVerified
                            ? <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                            : <span className="text-gray-400 text-xs">Unverified</span>}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {format(user.createdAt, 'dd MMM yyyy')}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/admin/users/${user.id}`} className="text-xs text-[#C4AB77] hover:underline">Edit</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
