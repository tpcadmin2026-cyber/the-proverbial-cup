import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Corporate Gifting' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { format } from 'date-fns'
import { ActivateGiftButton } from './ActivateGiftButton'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function CorporateAdminPage() {
  const accounts = await db.corporateAccount.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      gifts: {
        include: { plan: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const totalGifts = accounts.reduce((n, a) => n + a.gifts.length, 0)
  const activeGifts = accounts.reduce((n, a) => n + a.gifts.filter((g) => g.status === 'active').length, 0)

  return (
    <>
      <AdminHeader
        title="Corporate Gifting"
        subtitle="Manage corporate accounts and their gift subscriptions."
      />
      <div className="p-8 max-w-5xl">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{accounts.length}</div>
            <div className="text-sm text-gray-500 mt-1">Corporate accounts</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{totalGifts}</div>
            <div className="text-sm text-gray-500 mt-1">Total gifts</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{activeGifts}</div>
            <div className="text-sm text-gray-500 mt-1">Active gifts</div>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No corporate accounts yet. Enable Corporate Gifting in Features so businesses can register.
          </div>
        ) : (
          <div className="space-y-6">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900">{account.companyName}</p>
                    <p className="text-xs text-gray-400">{account.contactEmail}{account.contactName ? ` · ${account.contactName}` : ''} · Registered {format(account.createdAt, 'dd MMM yyyy')}</p>
                  </div>
                  <span className="text-xs text-gray-500">{account.gifts.length} gift{account.gifts.length !== 1 ? 's' : ''}</span>
                </div>

                {account.gifts.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400 italic">No gifts yet.</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {account.gifts.map((gift) => (
                      <div key={gift.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-900">{gift.recipientName ?? gift.recipientEmail}</p>
                          {gift.recipientName && <p className="text-xs text-gray-400">{gift.recipientEmail}</p>}
                          <p className="text-xs text-gray-400">{gift.plan.name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_STYLES[gift.status] ?? 'bg-gray-100 text-gray-500'}`}>
                            {gift.status}
                          </span>
                          {gift.status === 'pending' && (
                            <ActivateGiftButton accountId={account.id} giftId={gift.id} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
