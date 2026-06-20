import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import { format } from 'date-fns'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: "Members' Reading Room", description: `Exclusive long-form content for ${siteName} subscribers.` }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function ReadingRoomPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('reading_room')) {
    return <FeatureDisabled siteName={siteName} title="Members' Reading Room" message="Our exclusive reading room is coming soon — available to all subscribers. Check back after you subscribe." />
  }

  // Require active subscription
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value

  if (!token) redirect('/login?redirect=/members')

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: { include: { subscription: true } } },
  })

  if (!session || session.expires < new Date()) redirect('/login?redirect=/members')

  const isAdmin = ['admin', 'master_admin', 'manager'].includes(session.user.role)
  const hasSubscription = isAdmin || (
    session.user.subscription &&
    ['active', 'trialing'].includes(session.user.subscription.status)
  )

  if (!hasSubscription) {
    return (
      <div
        className="min-h-screen py-16 px-6 flex items-center justify-center"
        style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
      >
        <div className="max-w-md text-center">
          <div className="text-[#C4AB77] text-4xl mb-4">✦</div>
          <h1 className="font-playfair text-2xl text-[#35291C] mb-3">Members Only</h1>
          <p className="font-baskerville italic text-[#4B4C44] text-lg mb-6">
            The Reading Room is reserved for active subscribers. Subscribe to gain access to exclusive long-form content.
          </p>
          <Link href="/pricing" className="inline-block bg-[#35291C] text-[#E8E6D8] px-6 py-3 rounded font-semibold hover:bg-[#4B4C44] transition-colors">
            View Subscription Plans
          </Link>
        </div>
      </div>
    )
  }

  const posts = await db.readingRoomPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    select: { id: true, slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true },
  })

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
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
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">Members&apos; Reading Room</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">Exclusive long-form content for subscribers.</p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
            <p className="font-baskerville italic text-[#4B4C44] text-lg">New reading room content is being prepared. Please call again shortly.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/members/${post.slug}`}
                className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden hover:border-[#C4AB77] hover:shadow-md transition-all group"
              >
                {post.coverImage && (
                  <img src={post.coverImage} alt={post.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  {post.publishedAt && (
                    <p className="text-xs text-[#C4AB77] mb-2">{format(post.publishedAt, 'dd MMMM yyyy')}</p>
                  )}
                  <h2 className="font-playfair text-lg text-[#35291C] group-hover:text-[#C4AB77] transition-colors mb-2">{post.title}</h2>
                  {post.excerpt && (
                    <p className="text-sm text-[#4B4C44] font-baskerville italic leading-relaxed line-clamp-3">{post.excerpt}</p>
                  )}
                  <span className="inline-block mt-3 text-xs text-[#C4AB77]">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return home</Link>
        </div>
      </div>
    </div>
  )
}
