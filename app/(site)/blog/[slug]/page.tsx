import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { format } from 'date-fns'

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await db.blogPost.findUnique({ where: { slug }, select: { title: true, excerpt: true, coverImage: true } })
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const [post, siteName] = await Promise.all([
    db.blogPost.findUnique({ where: { slug } }),
    getSetting<string>('site.name', 'The Proverbial Cup'),
  ])

  if (!await isEnabled('blog') || !post || !post.published) notFound()

  const tagList = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
  const date = post.publishedAt ?? post.createdAt

  // Render content
  const contentHtml = renderContent(post.content)

  // Related posts (same category, exclude current)
  const related = post.category
    ? await db.blogPost.findMany({
        where: { published: true, category: post.category, NOT: { slug } },
        orderBy: { publishedAt: 'desc' },
        take: 3,
        select: { slug: true, title: true, excerpt: true, publishedAt: true, createdAt: true },
      })
    : []

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-2xl mx-auto">

        {/* Back link */}
        <div className="mb-8 flex items-center gap-3">
          <Link href="/blog" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
            ← The Journal
          </Link>
          {post.category && (
            <>
              <span className="text-[#c8c4a8]">/</span>
              <Link href={`/blog?category=${encodeURIComponent(post.category)}`} className="text-xs text-[#C4AB77] hover:underline">
                {post.category}
              </Link>
            </>
          )}
        </div>

        {/* Article card */}
        <article className="bg-white border border-[#c8c4a8] rounded-lg shadow-md overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          {post.coverImage && (
            <img src={post.coverImage} alt={post.title} className="w-full h-64 object-cover" />
          )}

          <div className="px-8 py-8">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#C4AB77] mb-4">
              <span>{format(date, 'dd MMMM yyyy')}</span>
              {post.author && <><span className="text-[#c8c4a8]">·</span><span className="text-[#4B4C44]">{post.author}</span></>}
            </div>

            {/* Title */}
            <h1 className="font-playfair text-3xl text-[#35291C] leading-snug mb-3">{post.title}</h1>

            {post.excerpt && (
              <p className="font-baskerville italic text-[#4B4C44] text-lg leading-relaxed mb-6 border-l-2 border-[#C4AB77] pl-4">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-[#e8e4d0]" />
              <span className="text-[#C4AB77] text-xs">✦</span>
              <div className="h-px flex-1 bg-[#e8e4d0]" />
            </div>

            {/* Body */}
            <div
              className="font-baskerville text-[#35291C] leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />

            {/* Tags */}
            {tagList.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#e8e4d0]">
                <div className="flex flex-wrap gap-2">
                  {tagList.map((tag) => (
                    <span key={tag} className="text-xs bg-[#f5f2e8] border border-[#e8e4d0] text-[#4B4C44] px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-4 mb-5">
              <h2 className="font-playfair text-lg text-[#35291C]">More in {post.category}</h2>
              <div className="h-px flex-1 bg-[#C4AB77] opacity-40" />
            </div>
            <div className="space-y-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block bg-white border border-[#c8c4a8] rounded-lg p-4 hover:border-[#C4AB77] transition-colors group"
                >
                  <div className="font-playfair text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-1">{r.title}</div>
                  {r.excerpt && <p className="text-xs text-[#4B4C44] font-baskerville italic line-clamp-2">{r.excerpt}</p>}
                  <span className="text-xs text-[#C4AB77] mt-1 inline-block">
                    {format(r.publishedAt ?? r.createdAt, 'dd MMM yyyy')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-10 text-xs text-[#4B4C44]">
          <div className="h-px bg-gradient-to-r from-transparent via-[#C4AB77] to-transparent mb-5" />
          <Link href="/blog" className="text-[#C4AB77] hover:underline mr-4">← Back to the Journal</Link>
          <Link href="/" className="text-[#4B4C44] hover:text-[#35291C]">Return home</Link>
        </div>
      </div>
    </div>
  )
}

function renderContent(content: string): string {
  if (!content.trim()) return ''
  const lines = content.split('\n')
  const html: string[] = []
  let listOpen = false

  function closeList() {
    if (listOpen) { html.push('</ul>'); listOpen = false }
  }

  function inline(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f5f2e8;padding:0 3px;border-radius:3px;font-size:0.9em;font-family:monospace">$1</code>')
  }

  for (const line of lines) {
    if (line.startsWith('### ')) {
      closeList()
      html.push(`<h3 style="font-family:Georgia,serif;font-size:1.15rem;font-weight:700;margin:1.4em 0 0.4em;color:#35291C">${inline(line.slice(4))}</h3>`)
    } else if (line.startsWith('## ')) {
      closeList()
      html.push(`<h2 style="font-family:Georgia,serif;font-size:1.5rem;font-weight:700;margin:1.8em 0 0.5em;color:#35291C;border-bottom:1px solid #e8e4d0;padding-bottom:0.3em">${inline(line.slice(3))}</h2>`)
    } else if (line.startsWith('- ')) {
      if (!listOpen) { html.push('<ul style="padding-left:1.5em;margin:0.8em 0;list-style:disc">'); listOpen = true }
      html.push(`<li style="margin:0.3em 0;line-height:1.7">${inline(line.slice(2))}</li>`)
    } else if (line.trim() === '') {
      closeList()
    } else {
      closeList()
      html.push(`<p style="margin:0.8em 0;line-height:1.8;font-size:1.05rem">${inline(line)}</p>`)
    }
  }
  closeList()
  return html.join('\n')
}
