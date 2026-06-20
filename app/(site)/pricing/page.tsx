import Link from 'next/link'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const [siteName, tagline] = await Promise.all([
    getSetting<string>('site.name', 'My Site'),
    getSetting<string>('site.tagline', ''),
  ])
  return {
    title: `Subscription Plans`,
    description: `Choose your ${siteName} subscription. ${tagline}.`,
    openGraph: { title: `Subscription Plans` },
  }
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export default async function PricingPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('subscriptions')) {
    return <FeatureDisabled siteName={siteName} title="Subscription Plans" message="Our subscription plans are being finalised. Please check back soon or join the waitlist to be notified first." />
  }
  const [plans, currency] = await Promise.all([
    db.subscriptionPlan.findMany({
      where: { visible: true },
      orderBy: { displayOrder: 'asc' },
    }),
    getSetting<string>('payments.currency', 'GBP'),
  ])

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
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <div
              className="text-[#35291C] leading-tight"
              style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}
            >
              {siteName}
            </div>
          </Link>
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
            <span className="text-[#C4AB77]">✦</span>
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
          </div>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-3xl text-[#35291C] tracking-wide">
              Subscription Prospectus
            </h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44] max-w-xl mx-auto">
            Select the subscription that befits your station and coffee requirements.
            All plans may be paused or cancelled at any time.
          </p>
        </div>

        {/* Plans grid */}
        {plans.length === 0 ? (
          <div className="text-center py-16 text-[#4B4C44] font-baskerville italic text-lg">
            No subscription plans are currently available. Please call again shortly.
          </div>
        ) : (
          <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {plans.map((plan) => {
              const features: string[] = plan.features ? JSON.parse(plan.features) : []
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-lg overflow-hidden shadow-md border ${plan.isHighlighted ? 'border-[#C4AB77] shadow-[#C4AB77]/20 shadow-lg' : 'border-[#c8c4a8]'}`}
                >
                  {/* Highlighted badge */}
                  {plan.isHighlighted && plan.highlightLabel && (
                    <div className="bg-[#C4AB77] text-[#E8E6D8] text-xs font-semibold tracking-widest text-center py-1.5 uppercase">
                      {plan.highlightLabel}
                    </div>
                  )}

                  {/* Dark header */}
                  <div className="bg-[#35291C] px-6 py-5 text-center">
                    <h2 className="font-playfair text-xl text-[#E8E6D8] tracking-wide mb-1">
                      {plan.name}
                    </h2>
                    {plan.highlightFeature && (
                      <p className="text-[#C4AB77] text-xs italic">{plan.highlightFeature}</p>
                    )}
                  </div>

                  {/* Gold rule */}
                  <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

                  {/* Price */}
                  <div className="px-6 py-5 text-center border-b border-[#e8e4d0]">
                    {plan.priceMonthly == null ? (
                      <div className="font-playfair text-3xl text-[#35291C]">Free</div>
                    ) : (
                      <>
                        <div className="font-playfair text-4xl text-[#35291C]">
                          {formatPrice(plan.priceMonthly, currency)}
                        </div>
                        <div className="text-xs text-[#C4AB77] mt-1">per month</div>
                        {plan.priceYearly && (
                          <div className="text-xs text-[#4B4C44] mt-1 italic">
                            or {formatPrice(plan.priceYearly, currency)}/year
                            {' '}
                            <span className="text-[#5a7a2e]">
                              (save {formatPrice(plan.priceMonthly * 12 - plan.priceYearly, currency)})
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {plan.trialDays > 0 && (
                      <div className="mt-2 text-xs text-[#5a7a2e] font-semibold">
                        {plan.trialDays}-day free trial
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <div className="px-6 pt-4 pb-2">
                      <p className="text-sm text-[#4B4C44] font-baskerville italic text-center leading-relaxed">
                        {plan.description}
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  {features.length > 0 && (
                    <ul className="px-6 py-4 space-y-2">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#35291C]">
                          <span className="text-[#C4AB77] mt-0.5 shrink-0">✦</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA */}
                  <div className="px-6 pb-6 pt-2">
                    <Link
                      href={`/subscribe/${plan.slug}`}
                      className={`block w-full text-center py-2.5 rounded text-sm font-semibold transition-colors ${
                        plan.isHighlighted
                          ? 'bg-[#C4AB77] text-white hover:bg-[#7a5c12]'
                          : 'bg-[#35291C] text-[#E8E6D8] hover:bg-[#35291C]'
                      }`}
                    >
                      Subscribe Now
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        <div className="text-center mt-12">
          <div className="h-px bg-gradient-to-r from-transparent via-[#C4AB77] to-transparent mb-6" />
          <p className="text-xs text-[#4B4C44]">
            Already a subscriber?{' '}
            <Link href="/login" className="text-[#C4AB77] hover:underline">Sign in to your account</Link>
          </p>
          <p className="text-xs text-[#4B4C44] mt-1">
            <Link href="/" className="text-[#C4AB77] hover:underline">← Return to The Gazette</Link>
          </p>
        </div>

      </div>
    </div>
  )
}
