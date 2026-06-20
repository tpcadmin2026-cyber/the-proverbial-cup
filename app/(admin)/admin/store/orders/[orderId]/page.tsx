import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { OrderActions } from './OrderActions'

interface Props {
  params: Promise<{ orderId: string }>
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  paid:      'bg-green-100 text-green-700',
  fulfilled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
  refunded:  'bg-red-100 text-red-700',
}

function formatPrice(cents: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100)
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) notFound()

  const lineItems: Array<{ name: string; qty: number; priceInCents: number; variantName?: string }> =
    order.lineItems ? JSON.parse(order.lineItems) : []

  const shippingAddress: Record<string, string> | null =
    order.shippingAddress ? JSON.parse(order.shippingAddress) : null

  return (
    <>
      <AdminHeader
        title={`Order #${order.id.slice(-8).toUpperCase()}`}
        subtitle={`${order.customerEmail} · ${format(order.createdAt, 'dd MMM yyyy, HH:mm')}`}
      />
      <div className="p-8 max-w-3xl space-y-6">

        {/* Status bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-wrap items-center gap-4">
          <span className={`px-3 py-1 rounded text-sm font-semibold capitalize ${STATUS_STYLES[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {order.status}
          </span>
          <span className="text-sm text-gray-500">{formatPrice(order.totalCents, order.currency)}</span>
          {order.trackingNumber && (
            <span className="text-sm text-gray-500">Tracking: <strong>{order.trackingNumber}</strong></span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{format(order.createdAt, 'dd MMMM yyyy, HH:mm')}</span>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Items ordered</h2>
          </div>
          {lineItems.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-400 italic">No line item data.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Item</th>
                  <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Qty</th>
                  <th className="text-right px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lineItems.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.variantName && <div className="text-xs text-gray-400">{item.variantName}</div>}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-600">{item.qty}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{formatPrice(item.priceInCents * item.qty, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={2} className="px-5 py-3 text-sm font-bold text-gray-900 text-right">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900">{formatPrice(order.totalCents, order.currency)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Shipping address */}
        {shippingAddress && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Shipping address</h2>
            <div className="text-sm text-gray-700 space-y-0.5">
              {shippingAddress.name && <p className="font-medium">{shippingAddress.name}</p>}
              {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
              {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
              {shippingAddress.city && <p>{shippingAddress.city}{shippingAddress.postcode ? `, ${shippingAddress.postcode}` : ''}</p>}
              {shippingAddress.country && <p>{shippingAddress.country}</p>}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <OrderActions orderId={order.id} currentStatus={order.status} currentTracking={order.trackingNumber ?? ''} />

      </div>
    </>
  )
}
