import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import { format } from 'date-fns'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  return {
    title: 'The Journal',
    description: `Dispatches, brewing guides, and stories from ${siteName}.`,
  }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('blog')) {
    return <FeatureDisabled siteName={siteName} title="The Journal" message="Our blog is not yet available. Please check back soon." />
  }

  const allPosts = await db.blogPost.findMany({
    where: { published: true },
    orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true, title: true, excerpt: true, coverImage: true,
      author: true, tags: true, category: true, featured: true,
      publishedAt: true, createdAt: true,
    },
  })

  // Build category list from all posts
  const allCategories = Array.from(new Set(allPosts.map((p) => p.category).filter(Boolean))).sort()

  const posts = category
    ? allPosts.filter((p) => p.category === category)
    : allPosts

  const featured = posts.find((p) => p.featured)
  const rest = posts.filter((p) => p !== featured)

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
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
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">The Journal</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">
            Dispatches, brewing guides, and stories from the cup.
          </p>
        </div>

        {/* Category filter */}
        {allCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <Link
              href="/blog"
              className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                !category ? 'bg-[#35291C] text-[#E8E6D8] border-[#35291C]' : 'border-[#c8c4a8] text-[#4B4C44] hover:border-[#35291C]'
              }`}
            >
              All
            </Link>
            {allCategories.map((cat) => (
              <Link
                key={cat}
                href={`/blog?category=${encodeURIComponent(cat)}`}
                className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                  category === cat ? 'bg-[#35291C] text-[#E8E6D8] border-[#35291C]' : 'border-[#c8c4a8] text-[#4B4C44] hover:border-[#35291C]'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
            <p className="font-baskerville italic text-[#4B4C44] text-lg">
              {category ? `No posts in this category yet.` : 'Our first dispatches are being composed. Please call again shortly.'}
            </p>
          </div>
        ) : (
          <>
            {/* Featured post — large card */}
            {featured && !category && (
              <Link
                href={`/blog/${featured.slug}`}
                className="block bg-white border border-[#c8c4a8] rounded-lg overflow-hidden shadow-md hover:border-[#C4AB77] hover:shadow-lg transition-all mb-8 group"
              >
                {featured.coverImage && (
                  <img src={featured.coverImage} alt={featured.title} className="w-full h-56 object-cover" />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-[#35291C] text-[#E8E6D8] px-2 py-0.5 rounded font-semibold uppercase tracking-widest">Featured</span>
                    {featured.category && (
                      <span className="text-xs text-[#C4AB77]">{featured.category}</span>
                    )}
                  </div>
                  <h2 className="font-playfair text-2xl text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-2 leading-snug">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="font-baskerville italic text-[#4B4C44] leading-relaxed mb-3 line-clamp-2">{featured.excerpt}</p>
                  )}
                  <PostMeta post={featured} />
                </div>
              </Link>
            )}

            {/* Post grid */}
            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden shadow-sm hover:border-[#C4AB77] hover:shadow-md transition-all group flex flex-col"
                  >
                    {post.coverImage && (
                      <img src={post.coverImage} alt={post.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      {post.category && (
                        <span className="text-xs text-[#C4AB77] mb-1">{post.category}</span>
                      )}
                      <h2 className="font-playfair text-lg text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-2 leading-snug flex-1">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="font-baskerville italic text-sm text-[#4B4C44] leading-relaxed mb-3 line-clamp-3">{post.excerpt}</p>
                      )}
                      <PostMeta post={post} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <div className="text-center mt-10 text-xs text-[#4B4C44]">
          <div className="h-px bg-gradient-to-r from-transparent via-[#C4AB77] to-transparent mb-5" />
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return home</Link>
        </div>
      </div>
    </div>
  )
}

function PostMeta({ post }: { post: { author: string; publishedAt: Date | null; createdAt: Date; tags: string } }) {
  const date = post.publishedAt ?? post.createdAt
  const tagList = post.tags ? post.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B4C44]">
      <span>{format(date, 'dd MMMM yyyy')}</span>
      {post.author && <><span className="text-[#c8c4a8]">·</span><span>{post.author}</span></>}
      {tagList.slice(0, 3).map((tag) => (
        <span key={tag} className="bg-[#f5f2e8] border border-[#e8e4d0] px-1.5 py-0.5 rounded">{tag}</span>
      ))}
    </div>
  )
}
