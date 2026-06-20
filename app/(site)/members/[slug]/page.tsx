import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { format } from 'date-fns'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await db.readingRoomPost.findUnique({ where: { slug }, select: { title: true, excerpt: true } })
  return { title: post?.title ?? 'Reading Room' }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function ReadingRoomPostPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!await isEnabled('reading_room')) notFound()

  const { slug } = await params
  const siteName = await getSetting<string>('site.name', 'My Site')

  // Require active subscription
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value

  if (!token) redirect(`/login?redirect=/members/${slug}`)

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: true } } },
  })

  if (!session || session.expires < new Date()) redirect(`/login?redirect=/members/${slug}`)

  const isAdmin = ['admin', 'master_admin', 'manager'].includes(session.user.role)
  const hasSubscription = isAdmin || (
    session.user.subscription &&
    ['active', 'trialing'].includes(session.user.subscription.status)
  )

  if (!hasSubscription) redirect('/members')

  const post = await db.readingRoomPost.findUnique({ where: { slug, published: true } })
  if (!post) notFound()

  // Render content — support basic ## headings and paragraphs
  const paragraphs = post.content.split('\n\n').filter(Boolean)

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="block text-center mb-8">
          <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
            {siteName}
          </div>
        </Link>

        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-8 border border-[#c8c4a8]" />
        )}

        <div className="text-center mb-8">
          {post.publishedAt && (
            <p className="text-xs text-[#C4AB77] uppercase tracking-widest mb-3">{format(post.publishedAt, 'dd MMMM yyyy')}</p>
          )}
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-3">
            <h1 className="font-playfair text-3xl md:text-4xl text-[#35291C] tracking-wide">{post.title}</h1>
          </div>
          {post.excerpt && (
            <p className="mt-4 font-baskerville text-lg italic text-[#4B4C44]">{post.excerpt}</p>
          )}
        </div>

        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-px flex-1 bg-[#C4AB77]" />
          <span className="text-[#C4AB77]">✦</span>
          <div className="h-px flex-1 bg-[#C4AB77]" />
        </div>

        <article className="prose-gazette">
          {paragraphs.map((para, i) => {
            if (para.startsWith('## ')) {
              return <h2 key={i} className="font-playfair text-xl text-[#35291C] mt-8 mb-3">{para.slice(3)}</h2>
            }
            if (para.startsWith('### ')) {
              return <h3 key={i} className="font-playfair text-lg text-[#35291C] mt-6 mb-2">{para.slice(4)}</h3>
            }
            return (
              <p key={i} className="font-baskerville text-[#35291C] leading-loose mb-4 text-[1.05rem]">{para}</p>
            )
          })}
        </article>

        <div className="flex items-center gap-3 my-10 justify-center">
          <div className="h-px flex-1 bg-[#C4AB77]" />
          <span className="text-[#C4AB77] tracking-widest">✦ ✦ ✦</span>
          <div className="h-px flex-1 bg-[#C4AB77]" />
        </div>

        <div className="text-center text-xs text-[#4B4C44]">
          <Link href="/members" className="text-[#C4AB77] hover:underline">← Back to Reading Room</Link>
        </div>
      </div>
    </div>
  )
}
