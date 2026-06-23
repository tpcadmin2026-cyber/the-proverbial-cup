import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { CorporateSignUp } from './CorporateSignUp'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: 'Corporate Gifting', description: `Gift ${siteName} subscriptions to your team or clients.` }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function CorporatePage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('corporate_gifting')) {
    return <FeatureDisabled siteName={siteName} title="Corporate Gifting" message="Our corporate gifting programme is not yet available. Please contact us to discuss your requirements." />
  }

  const plans = await db.subscriptionPlan.findMany({ where: { visible: true }, orderBy: { displayOrder: 'asc' }, select: { id: true, name: true, priceMonthly: true, priceYearly: true } })

  // If already signed in as a corporate account, redirect to dashboard
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (token) {
    const session = await db.session.findUnique({ where: { sessionToken: token }, select: { expires: true, user: { select: { email: true } } } })
    if (session && session.expires > new Date()) {
      const account = await db.corporateAccount.findUnique({ where: { contactEmail: session.user.email } })
      if (account) redirect('/corporate/dashboard')
    }
  }

  const currency = await getSetting<string>('payments.currency', 'USD')

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
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">Corporate Gifting</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">
            Delight your team or clients with the gift of fine coffee. Manage all your gift subscriptions from one dashboard.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { title: 'Bulk Gifting', text: 'Send subscriptions to any number of recipients — each managed separately.' },
            { title: 'Central Dashboard', text: 'View, pause, cancel, and reassign gifts from one simple interface.' },
            { title: 'Flexible Plans', text: 'Choose the plan that suits each recipient — mix and match as needed.' },
          ].map((b) => (
            <div key={b.title} className="bg-white border border-[#c8c4a8] rounded-lg p-5 text-center">
              <h3 className="font-playfair text-base text-[#35291C] mb-2">{b.title}</h3>
              <p className="font-baskerville italic text-sm text-[#4B4C44]">{b.text}</p>
            </div>
          ))}
        </div>

        {/* Sign up form */}
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-8">
          <h2 className="font-playfair text-xl text-[#35291C] mb-2">Register Your Company</h2>
          <p className="text-sm text-[#4B4C44] font-baskerville italic mb-6">
            Create your corporate account to start sending gift subscriptions. Our team will be in touch within one working day.
          </p>
          <CorporateSignUp plans={plans} currency={currency} />
        </div>

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return home</Link>
        </div>
      </div>
    </div>
  )
}
