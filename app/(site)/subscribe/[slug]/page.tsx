import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { stripeConfiguredAsync } from '@/lib/stripe'
import { SubscribeActions } from './SubscribeActions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const plan = await db.subscriptionPlan.findUnique({ where: { slug }, select: { name: true } })
  return { title: plan ? `Subscribe — ${plan.name}` : 'Subscribe' }
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

export default async function SubscribePlanPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  if (!await isEnabled('subscriptions')) notFound()
  const { slug } = await params

  const [plan, currency, stripeReady] = await Promise.all([
    db.subscriptionPlan.findUnique({ where: { slug, visible: true } }),
    getSetting<string>('payments.currency', 'USD'),
    stripeConfiguredAsync(),
  ])

  if (!plan) notFound()

  // Check if user is already logged in
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  let currentUser = null
  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: { include: { subscription: true } } },
    })
    if (session && session.expires > new Date()) {
      currentUser = session.user
    }
  }

  const features: string[] = plan.features ? JSON.parse(plan.features) : []

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

        {/* Back link */}
        <div className="mb-8">
          <Link href="/pricing" className="text-xs text-[#4B4C44] hover:text-[#35291C] transition-colors">
            ← Back to plans
          </Link>
        </div>

        {/* Plan card */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg border border-[#c8c4a8] mb-8">

          {/* Header */}
          <div className="bg-[#35291C] px-8 py-6 text-center">
            <div className="text-[#C4AB77] text-sm tracking-widest mb-2">Selected Plan</div>
            <h1
              className="text-[#E8E6D8] leading-tight"
              style={{ fontFamily: "'Anton', sans-serif", fontSize: '2rem' }}
            >
              {plan.name}
            </h1>
          </div>
          <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />

          {/* Price summary */}
          <div className="px-8 py-6 border-b border-[#e8e4d0]">
            <div className="flex items-center justify-between">
              <div>
                {plan.priceMonthly == null ? (
                  <span className="font-playfair text-2xl text-[#35291C]">Free</span>
                ) : (
                  <>
                    <span className="font-playfair text-3xl text-[#35291C]">
                      {formatPrice(plan.priceMonthly, currency)}
                    </span>
                    <span className="text-sm text-[#C4AB77] ml-1">/month</span>
                  </>
                )}
              </div>
              {plan.trialDays > 0 && (
                <span className="text-xs bg-[#f0ebe0] border border-[#c8c4a8] text-[#5a7a2e] font-semibold px-3 py-1 rounded-full">
                  {plan.trialDays}-day free trial
                </span>
              )}
            </div>
            {plan.description && (
              <p className="font-baskerville italic text-[#4B4C44] mt-3 leading-relaxed">
                {plan.description}
              </p>
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="px-8 py-5 border-b border-[#e8e4d0]">
              <h3 className="text-xs font-semibold text-[#C4AB77] tracking-widest uppercase mb-3">
                What&apos;s included
              </h3>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#35291C]">
                    <span className="text-[#C4AB77] shrink-0 mt-0.5">✦</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA section */}
          <div className="px-8 py-6">
            <SubscribeActions
              planSlug={plan.slug}
              planName={plan.name}
              isFree={plan.priceMonthly == null}
              stripeConfigured={stripeReady}
              hasPriceId={!!plan.stripePriceIdMonthly}
              currentUser={currentUser ? {
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name,
                hasSubscription: !!currentUser.subscription,
              } : null}
            />
          </div>
        </div>

        {/* Reassurance */}
        <div className="text-center text-xs text-[#4B4C44] space-y-1">
          <p>Payment is handled securely by Stripe at checkout.</p>
          <p>You may cancel or pause at any time from your account.</p>
        </div>

      </div>
    </div>
  )
}
