import Link from 'next/link'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { HelpSearch } from './HelpSearch'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: `Help Desk`, description: `Browse guidance and answers from the ${siteName} help desk.` }
}

export default async function HelpPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('knowledge_base')) {
    return <FeatureDisabled siteName={siteName} title="Help Desk" message="Our help desk is being prepared. In the meantime, please use the contact page to reach us directly." />
  }
  const [categories, heading, subheading] = await Promise.all([
    db.kbCategory.findMany({
      where: {},
      include: { _count: { select: { articles: { where: { published: true } } } } },
      orderBy: { order: 'asc' },
    }),
    getSetting<string>('help.heading', 'The Gazette Help Desk'),
    getSetting<string>('help.subheading', 'Browse our library of guidance below, or submit a support enquiry if you cannot find what you seek.'),
  ])

  const publishedCategories = categories.filter((c) => c._count.articles > 0)

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

        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}>
              {siteName}
            </div>
          </Link>
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
            <span className="text-[#C4AB77]">✦</span>
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
          </div>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">{heading}</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">{subheading}</p>
        </div>

        <HelpSearch />

        {publishedCategories.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
            <p className="font-baskerville italic text-[#4B4C44] text-lg">Our help articles are being prepared. Please call again shortly.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {publishedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/help/${cat.slug}`}
                className="bg-white border border-[#c8c4a8] rounded-lg p-6 hover:border-[#C4AB77] hover:shadow-md transition-all group"
              >
                <h2 className="font-playfair text-lg text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-1">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-sm text-[#4B4C44] font-baskerville italic mb-3">{cat.description}</p>
                )}
                <span className="text-xs text-[#C4AB77]">
                  {cat._count.articles} article{cat._count.articles !== 1 ? 's' : ''} →
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 bg-white border border-[#c8c4a8] rounded-lg p-6 text-center">
          <p className="font-playfair text-sm text-[#35291C] mb-2">Cannot find what you seek?</p>
          <p className="font-baskerville italic text-[#4B4C44] text-sm mb-4">Our editorial desk is at your service.</p>
          <Link
            href="/contact"
            className="inline-block bg-[#35291C] text-[#E8E6D8] px-6 py-2 rounded text-sm font-semibold hover:bg-[#35291C] transition-colors"
          >
            Contact Us
          </Link>
        </div>

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return to The Gazette</Link>
        </div>
      </div>
    </div>
  )
}
