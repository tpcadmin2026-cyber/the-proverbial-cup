import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { format } from 'date-fns'
import { GiftDashboard } from './GiftDashboard'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Corporate Dashboard' }
}

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

export default async function CorporateDashboardPage() {
  if (!await isEnabled('corporate_gifting')) notFound()

  const siteName = await getSetting<string>('site.name', 'My Site')

  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  if (!token) redirect('/corporate')

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    select: { expires: true, user: { select: { email: true, role: true } } },
  })
  if (!session || session.expires < new Date()) redirect('/corporate')

  // Must be a registered corporate account
  const account = await db.corporateAccount.findUnique({
    where: { contactEmail: session.user.email },
    include: {
      gifts: {
        include: { plan: { select: { name: true, priceMonthly: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!account) redirect('/corporate')

  const plans = await db.subscriptionPlan.findMany({
    where: { visible: true },
    orderBy: { displayOrder: 'asc' },
    select: { id: true, name: true, priceMonthly: true },
  })
  const currency = await getSetting<string>('payments.currency', 'USD')

  const active = account.gifts.filter((g) => g.status === 'active').length
  const pending = account.gifts.filter((g) => g.status === 'pending').length

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: GRAIN, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-4">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
              {siteName}
            </div>
          </Link>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-2">
            <h1 className="font-playfair text-2xl text-[#35291C] tracking-wide">Corporate Dashboard</h1>
          </div>
          <p className="font-baskerville italic text-[#4B4C44]">{account.companyName}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-4 text-center">
            <div className="font-playfair text-2xl text-[#35291C]">{account.gifts.length}</div>
            <div className="text-xs text-[#C4AB77] mt-1">Total gifts</div>
          </div>
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-4 text-center">
            <div className="font-playfair text-2xl text-[#35291C]">{active}</div>
            <div className="text-xs text-[#C4AB77] mt-1">Active</div>
          </div>
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-4 text-center">
            <div className="font-playfair text-2xl text-[#35291C]">{pending}</div>
            <div className="text-xs text-[#C4AB77] mt-1">Pending</div>
          </div>
        </div>

        <GiftDashboard
          accountId={account.id}
          gifts={account.gifts.map((g) => ({
            id: g.id,
            recipientEmail: g.recipientEmail,
            recipientName: g.recipientName,
            planName: g.plan.name,
            status: g.status,
            note: g.note,
            createdAt: g.createdAt.toISOString(),
            activatedAt: g.activatedAt?.toISOString() ?? null,
            expiresAt: g.expiresAt?.toISOString() ?? null,
          }))}
          plans={plans}
          currency={currency}
        />

        <div className="text-center mt-8 text-xs text-[#4B4C44]">
          <Link href="/" className="text-[#C4AB77] hover:underline">← Return home</Link>
        </div>
      </div>
    </div>
  )
}
