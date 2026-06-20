import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { RequestBoard } from './RequestBoard'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: 'Feature Requests', description: `Suggest ideas and vote on what ${siteName} should build next.` }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function RequestsPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('feature_requests')) {
    return <FeatureDisabled siteName={siteName} title="Ideas & Suggestions" message="Our feature request board is not yet open. Please check back soon." />
  }

  const [heading, subheading] = await Promise.all([
    getSetting<string>('requests.heading', 'Ideas & Suggestions'),
    getSetting<string>('requests.subheading', 'Share your ideas and vote for what we should build next. We read every suggestion.'),
  ])

  const requests = await db.featureRequest.findMany({
    where: { isPublic: true },
    orderBy: { upvotes: 'desc' },
  })

  // Check if logged in
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  let userEmail: string | null = null
  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      select: { expires: true, user: { select: { email: true } } },
    })
    if (session && session.expires > new Date()) userEmail = session.user.email
  }

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
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">{heading}</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">{subheading}</p>
        </div>

        <RequestBoard requests={requests} userEmail={userEmail} />

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return home</Link>
        </div>
      </div>
    </div>
  )
}
