import Link from 'next/link'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { AddToCartButton } from './AddToCartButton'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return {
    title: `The Emporium`,
    description: `Browse the ${siteName} shop — fine coffees, accessories, and gifts.`,
  }
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

export default async function ShopPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('ecommerce')) {
    return <FeatureDisabled siteName={siteName} title="The Emporium" message="Our shop is not yet open. Please check back soon or subscribe to be notified when we launch." />
  }
  const [products, currency] = await Promise.all([
    db.product.findMany({
      where: { visible: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      include: { variants: true },
    }),
    getSetting<string>('payments.currency', 'USD'),
  ])

  // Group by category; uncategorised products go into a "" bucket rendered last
  const grouped = products.reduce<Record<string, typeof products>>((acc, p) => {
    const key = p.category || ''
    if (!acc[key]) acc[key] = []
    acc[key].push(p)
    return acc
  }, {})
  const categorySections = [
    ...Object.entries(grouped).filter(([k]) => k !== '').sort(([a], [b]) => a.localeCompare(b)),
    ...(grouped[''] ? [['', grouped['']] as [string, typeof products]] : []),
  ]
  const hasCategories = categorySections.some(([k]) => k !== '')

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{
        backgroundColor: '#E8E6D8',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '400px 400px',
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <div
              className="text-[#35291C] leading-tight"
              style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}
            >
              {siteName}
            </div>
          </Link>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">The Gazette Emporium</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44] max-w-xl mx-auto">
            Fine coffees, teas, and accoutrements for the discerning household.
          </p>
        </div>

        {/* Cart link */}
        <div className="flex justify-end mb-6">
          <Link
            href="/shop/cart"
            className="flex items-center gap-2 text-sm text-[#4B4C44] border border-[#c8c4a8] px-4 py-2 rounded hover:border-[#35291C] hover:bg-[#f5f2e8] transition-colors"
          >
            <span>⊡</span>
            <span>View cart</span>
          </Link>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-[#4B4C44] font-baskerville italic text-lg">
            The Emporium is presently being stocked. Please call again shortly.
          </div>
        ) : (
          <div className="space-y-10">
            {categorySections.map(([cat, items]) => (
              <div key={cat}>
                {hasCategories && (
                  <div className="flex items-center gap-4 mb-5">
                    <h2 className="font-playfair text-xl text-[#35291C] tracking-wide">
                      {cat || 'Other'}
                    </h2>
                    <div className="h-px flex-1 bg-[#C4AB77] opacity-40" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg border border-[#c8c4a8] shadow-md overflow-hidden flex flex-col">

                      {/* Placeholder image area */}
                      <Link href={`/shop/${product.slug}`} className="block">
                        <div className="bg-[#f5f2e8] border-b border-[#e8e4d0] h-48 flex items-center justify-center">
                          <span className="text-5xl text-[#c8c4a8]">☕</span>
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <Link href={`/shop/${product.slug}`}>
                          <h3 className="font-playfair text-base text-[#35291C] leading-snug mb-2 hover:text-[#C4AB77] transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="font-baskerville italic text-sm text-[#4B4C44] leading-relaxed mb-4 flex-1 line-clamp-3">
                          {product.description}
                        </p>

                        {/* Price row */}
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#e8e4d0]">
                          <div>
                            <span className="font-playfair text-lg text-[#35291C]">
                              {formatPrice(product.priceInCents, currency)}
                            </span>
                            {product.compareAtCents && product.compareAtCents > product.priceInCents && (
                              <span className="ml-2 text-xs text-[#4B4C44] line-through opacity-60">
                                {formatPrice(product.compareAtCents, currency)}
                              </span>
                            )}
                          </div>
                          <AddToCartButton
                            product={{
                              id: product.id,
                              slug: product.slug,
                              name: product.name,
                              priceInCents: product.priceInCents,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="h-px bg-gradient-to-r from-transparent via-[#C4AB77] to-transparent mb-6" />
          <Link href="/pricing" className="text-xs text-[#C4AB77] hover:underline mr-4">View subscription plans</Link>
          <Link href="/" className="text-xs text-[#4B4C44] hover:text-[#35291C]">← Return to The Gazette</Link>
        </div>

      </div>
    </div>
  )
}
