import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'
import { clsx } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { NOTIFICATION_CATEGORIES, type NotificationType } from '@/lib/notifications'
import { MarkAllReadButton } from './MarkAllReadButton'
import type { Notification } from '@prisma/client'

interface Props {
  searchParams: Promise<{ type?: string }>
}

interface OrderMeta {
  orderId: string
  customerEmail?: string
  customerName?: string
  items: { name: string; quantity: number; price: string }[]
  total: string
}

interface SubscriptionMeta {
  userId: string
  email: string
  name?: string
  planName: string
  interval: string
  price: string
}

function OrderDetail({ n }: { n: Notification }) {
  const meta = n.metadata ? (JSON.parse(n.metadata) as OrderMeta) : null
  if (!meta) return null
  return (
    <div className="mt-2 text-sm text-gray-600 space-y-1">
      <div>{meta.customerName ? `${meta.customerName} · ${meta.customerEmail}` : meta.customerEmail}</div>
      <ul className="text-xs text-gray-500 list-disc list-inside">
        {meta.items.map((item, i) => (
          <li key={i}>{item.name} × {item.quantity} — ${item.price}</li>
        ))}
      </ul>
      <div className="font-semibold text-gray-800">Total: ${meta.total}</div>
      <Link href={`/admin/store/orders/${meta.orderId}`} className="inline-block text-xs text-[#C4AB77] hover:underline mt-1">
        View order →
      </Link>
    </div>
  )
}

function SubscriptionDetail({ n }: { n: Notification }) {
  const meta = n.metadata ? (JSON.parse(n.metadata) as SubscriptionMeta) : null
  if (!meta) return null
  return (
    <div className="mt-2 text-sm text-gray-600 space-y-1">
      <div>{meta.name ? `${meta.name} · ${meta.email}` : meta.email}</div>
      <div className="text-xs text-gray-500">
        {meta.planName} · {meta.interval}{meta.price ? ` · ${meta.price}` : ''}
      </div>
      <Link href={`/admin/users/${meta.userId}`} className="inline-block text-xs text-[#C4AB77] hover:underline mt-1">
        View subscriber →
      </Link>
    </div>
  )
}

function NotificationCard({ n }: { n: Notification }) {
  const category = NOTIFICATION_CATEGORIES.find((c) => c.type === n.type)
  return (
    <div className={clsx(
      'bg-white rounded-lg border p-4',
      n.read ? 'border-gray-200' : 'border-[#C4AB77]'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400 flex-shrink-0">{category?.icon}</span>
          <span className="font-medium text-gray-900 truncate">{n.title}</span>
          {!n.read && (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide bg-[#C4AB77] text-white px-1.5 py-0.5 rounded">New</span>
          )}
        </div>
        <span className="flex-shrink-0 text-xs text-gray-400">{formatDistanceToNow(n.createdAt, { addSuffix: true })}</span>
      </div>
      {n.body && <p className="text-sm text-gray-500 mt-1">{n.body}</p>}
      {n.type === 'order' && <OrderDetail n={n} />}
      {n.type === 'subscription' && <SubscriptionDetail n={n} />}
    </div>
  )
}

export default async function NotificationsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const activeType = NOTIFICATION_CATEGORIES.some((c) => c.type === type) ? (type as NotificationType) : undefined

  const [notifications, unreadCounts] = await Promise.all([
    db.notification.findMany({
      where: activeType ? { type: activeType } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.notification.groupBy({ by: ['type'], where: { read: false }, _count: { _all: true } }),
  ])

  const unreadByType = Object.fromEntries(unreadCounts.map((c) => [c.type, c._count._all]))
  const totalUnread = Object.values(unreadByType).reduce((a, b) => a + b, 0)
  const activeLabel = activeType ? NOTIFICATION_CATEGORIES.find((c) => c.type === activeType)?.label : 'All notifications'

  return (
    <>
      <AdminHeader title="Notifications" subtitle="Orders, subscriptions, and other events that need your attention." />
      <div className="p-8 flex gap-6 max-w-6xl">
        {/* Category sidebar */}
        <div className="w-56 flex-shrink-0 space-y-1">
          <Link
            href="/admin/notifications"
            className={clsx(
              'flex items-center justify-between px-3 py-2 rounded text-sm transition-colors',
              !activeType ? 'bg-[#35291C] text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <span>All</span>
            {totalUnread > 0 && <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">{totalUnread}</span>}
          </Link>
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <Link
              key={cat.type}
              href={`/admin/notifications?type=${cat.type}`}
              className={clsx(
                'flex items-center justify-between px-3 py-2 rounded text-sm transition-colors',
                activeType === cat.type ? 'bg-[#35291C] text-white font-semibold' : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span>{cat.icon} {cat.label}</span>
              {unreadByType[cat.type] > 0 && (
                <span className={clsx(
                  'text-xs rounded-full px-2 py-0.5',
                  activeType === cat.type ? 'bg-white/20' : 'bg-[#C4AB77] text-white'
                )}>{unreadByType[cat.type]}</span>
              )}
            </Link>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">{activeLabel}</h2>
            <MarkAllReadButton type={activeType} />
          </div>
          {notifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => <NotificationCard key={n.id} n={n} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
