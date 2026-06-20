import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category: slug } = await params
  const [cat, siteName] = await Promise.all([
    db.kbCategory.findUnique({ where: { slug }, select: { name: true } }),
    getSetting<string>('site.name', 'My Site'),
  ])
  return { title: `${cat?.name ?? 'Help'}`, description: `${cat?.name} help articles from ${siteName}.` }
}

interface Props {
  params: Promise<{ category: string }>
}

export default async function HelpCategoryPage({ params }: Props) {
  if (!await isEnabled('knowledge_base')) notFound()
  const { category: slug } = await params
  const [cat, siteName] = await Promise.all([
    db.kbCategory.findUnique({
      where: { slug },
      include: {
        articles: {
          where: { published: true },
          orderBy: { title: 'asc' },
        },
      },
    }),
    getSetting<string>('site.name', 'My Site'),
  ])

  if (!cat) notFound()

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
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>
              {siteName}
            </div>
          </Link>
          <div className="text-sm text-[#C4AB77] mb-4">
            <Link href="/help" className="hover:underline">Help Desk</Link>
            <span className="mx-2 text-[#c8c4a8]">›</span>
            <span>{cat.name}</span>
          </div>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-2xl text-[#35291C] tracking-wide">{cat.name}</h1>
          </div>
          {cat.description && (
            <p className="font-baskerville italic text-[#4B4C44]">{cat.description}</p>
          )}
        </div>

        {cat.articles.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
            <p className="font-baskerville italic text-[#4B4C44]">No articles in this category yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cat.articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/help/${cat.slug}/${article.slug}`}
                  className="flex items-center gap-3 bg-white border border-[#c8c4a8] rounded-lg px-5 py-4 hover:border-[#C4AB77] hover:shadow-sm transition-all group"
                >
                  <span className="text-[#C4AB77] shrink-0">✦</span>
                  <span className="text-[#35291C] group-hover:text-[#C4AB77] transition-colors">{article.title}</span>
                  <span className="ml-auto text-[#C4AB77] text-sm shrink-0">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="text-center mt-8 text-xs text-[#4B4C44] space-y-1">
          <p><Link href="/help" className="text-[#C4AB77] hover:underline">← All help topics</Link></p>
          <p><Link href="/contact" className="text-[#C4AB77] hover:underline">Contact us</Link></p>
        </div>
      </div>
    </div>
  )
}
