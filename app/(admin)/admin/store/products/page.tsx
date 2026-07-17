import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import Link from 'next/link'

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

export default async function ProductsPage() {
  const [products, currency] = await Promise.all([
    db.product.findMany({
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      include: { variants: true },
    }),
    getSetting<string>('payments.currency', 'USD'),
  ])

  return (
    <>
      <AdminHeader title="Products" subtitle="Your product catalogue — coffee, equipment, and gift sets." />
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>
          <Link
            href="/admin/store/products/new"
            className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors"
          >
            + Add product
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No products yet. Click <strong>Add product</strong> to create your first item.
          </div>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/store/products/${p.id}`}
                  className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex items-center gap-4 hover:border-[#C4AB77] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {p.category && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">{p.category}</span>
                      )}
                      {p.variants.length > 0 && (
                        <span className="text-xs text-gray-400">{p.variants.length} variant{p.variants.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">{formatPrice(p.priceInCents, currency)}</div>
                  {p.inventory != null && (
                    <div className={`text-xs px-2 py-0.5 rounded ${p.inventory < (p.lowStockAlert ?? 5) ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.inventory} in stock
                    </div>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.visible ? 'Visible' : 'Hidden'}
                  </span>
                  <span className="text-xs text-[#C4AB77]">Edit →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
