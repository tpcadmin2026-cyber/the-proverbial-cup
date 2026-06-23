import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { ProductDetail } from './ProductDetail'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const [product, siteName] = await Promise.all([
    db.product.findUnique({ where: { slug, visible: true }, select: { name: true, description: true, images: true } }),
    getSetting<string>('site.name', 'My Site'),
  ])
  if (!product) return {}
  return {
    title: `${product.name}`,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  if (!await isEnabled('ecommerce')) notFound()
  const { slug } = await params

  const [product, currency] = await Promise.all([
    db.product.findUnique({
      where: { slug, visible: true },
      include: { variants: true },
    }),
    getSetting<string>('payments.currency', 'USD'),
  ])

  if (!product) notFound()

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
      <div className="max-w-3xl mx-auto">
        <Link href="/shop" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
          ← Back to the Emporium
        </Link>
        <div className="mt-6">
          <ProductDetail
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              description: product.description,
              priceInCents: product.priceInCents,
              compareAtCents: product.compareAtCents,
              inventory: product.inventory,
              variants: product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                priceInCents: v.priceInCents,
                inventory: v.inventory,
              })),
            }}
            currency={currency}
          />
        </div>
      </div>
    </div>
  )
}
