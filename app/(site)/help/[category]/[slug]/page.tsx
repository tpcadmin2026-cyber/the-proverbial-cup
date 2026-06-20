import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { HelpfulButtons } from './HelpfulButtons'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [article, siteName] = await Promise.all([
    db.kbArticle.findUnique({ where: { slug }, select: { title: true, body: true } }),
    getSetting<string>('site.name', 'My Site'),
  ])
  if (!article) return {}
  return {
    title: `${article.title} — Help`,
    description: article.body.slice(0, 160).replace(/[#*\n]/g, ' ').trim(),
  }
}

function renderBody(body: string) {
  // Convert simple markdown-like formatting to HTML
  return body
    .split('\n\n')
    .map((para, i) => {
      if (para.startsWith('##')) {
        return <h3 key={i} className="font-playfair text-lg text-[#35291C] mt-6 mb-2">{para.replace(/^##\s*/, '')}</h3>
      }
      if (para.match(/^\d+\./m) || para.match(/^-\s/m)) {
        const lines = para.split('\n').filter(Boolean)
        return (
          <ul key={i} className="my-3 space-y-1.5 ml-4">
            {lines.map((line, j) => (
              <li key={j} className="flex items-start gap-2 text-[#35291C]">
                <span className="text-[#C4AB77] shrink-0 mt-0.5">✦</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '')) }} />
              </li>
            ))}
          </ul>
        )
      }
      return (
        <p key={i} className="my-3 text-[#35291C] leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(para) }} />
      )
    })
}

function formatInline(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-amber-50 border border-amber-200 px-1 rounded text-sm">$1</code>')
}

export default async function HelpArticlePage({ params }: Props) {
  if (!await isEnabled('knowledge_base')) notFound()
  const { category: catSlug, slug } = await params
  const [article, siteName] = await Promise.all([
    db.kbArticle.findUnique({
      where: { slug },
      include: { category: true },
    }),
    getSetting<string>('site.name', 'My Site'),
  ])

  if (!article || !article.published || article.category.slug !== catSlug) notFound()

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

        {/* Breadcrumb */}
        <div className="text-sm text-[#C4AB77] mb-6">
          <Link href="/" className="hover:underline">{siteName}</Link>
          <span className="mx-2 text-[#c8c4a8]">›</span>
          <Link href="/help" className="hover:underline">Help Desk</Link>
          <span className="mx-2 text-[#c8c4a8]">›</span>
          <Link href={`/help/${catSlug}`} className="hover:underline">{article.category.name}</Link>
          <span className="mx-2 text-[#c8c4a8]">›</span>
          <span className="text-[#4B4C44]">{article.title}</span>
        </div>

        {/* Article card */}
        <div className="bg-white border border-[#c8c4a8] rounded-lg shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
          <div className="px-8 py-8">
            <div className="border-b border-[#e8e4d0] pb-5 mb-6">
              <div className="text-xs text-[#C4AB77] uppercase tracking-widest mb-2">{article.category.name}</div>
              <h1 className="font-playfair text-2xl text-[#35291C] leading-snug">{article.title}</h1>
            </div>

            <div className="font-baskerville text-base">
              {renderBody(article.body)}
            </div>

            {/* Helpful? */}
            <div className="mt-8 pt-6 border-t border-[#e8e4d0]">
              <HelpfulButtons articleId={article.id} helpful={article.helpful} notHelpful={article.notHelpful} />
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-8 flex flex-wrap gap-4 justify-between text-xs text-[#4B4C44]">
          <Link href={`/help/${catSlug}`} className="text-[#C4AB77] hover:underline">← {article.category.name}</Link>
          <div className="flex gap-4">
            <Link href="/help" className="text-[#C4AB77] hover:underline">All help topics</Link>
            <Link href="/contact" className="text-[#C4AB77] hover:underline">Contact us</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
