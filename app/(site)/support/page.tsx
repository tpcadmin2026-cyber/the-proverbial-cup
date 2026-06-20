import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { format } from 'date-fns'
import { SupportForm } from './SupportForm'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: 'Support', description: `Submit a support request to the ${siteName} team.` }
}

const STATUS_STYLES: Record<string, string> = {
  open:        'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting:     'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  closed:      'bg-gray-100 text-gray-500',
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function SupportPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('support_tickets')) {
    return <FeatureDisabled siteName={siteName} title="Support" message="Our support ticket system is not yet available. Please use the contact page to reach us." />
  }

  const [heading, subheading, successMessage] = await Promise.all([
    getSetting<string>('support.heading', 'Submit a Support Request'),
    getSetting<string>('support.subheading', 'Our team endeavours to respond within two working days.'),
    getSetting<string>('support.successMessage', 'Your request has been received. We shall be in correspondence shortly.'),
  ])

  // Check if logged in — if so, show their tickets too
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  let userEmail: string | null = null
  let tickets: { id: string; subject: string; status: string; createdAt: Date }[] = []

  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      select: { expires: true, user: { select: { email: true } } },
    })
    if (session && session.expires > new Date()) {
      userEmail = session.user.email
      tickets = await db.supportTicket.findMany({
        where: { customerEmail: session.user.email },
        orderBy: { createdAt: 'desc' },
        select: { id: true, subject: true, status: true, createdAt: true },
        take: 20,
      })
    }
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

        {/* Existing tickets for logged-in users */}
        {userEmail && tickets.length > 0 && (
          <div className="mb-10">
            <h2 className="font-playfair text-xl text-[#35291C] mb-4">Your Previous Requests</h2>
            <div className="bg-white border border-[#c8c4a8] rounded-lg divide-y divide-[#e8e4d0]">
              {tickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/support/${t.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#faf9f4] transition-colors"
                >
                  <div>
                    <p className="font-playfair text-sm text-[#35291C]">{t.subject}</p>
                    <p className="text-xs text-[#C4AB77] mt-0.5">{format(t.createdAt, 'dd MMM yyyy')}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${STATUS_STYLES[t.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Submit form */}
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-8">
          <h2 className="font-playfair text-xl text-[#35291C] mb-6">Submit a New Request</h2>
          <SupportForm
            successMessage={successMessage}
            prefillEmail={userEmail ?? undefined}
          />
        </div>

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return home</Link>
        </div>
      </div>
    </div>
  )
}
