import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isAdminRole } from '@/lib/access'
import { getHeaderPage } from '@/lib/headerFooterPages'
import { VictorianTemplate } from '@/components/site/VictorianTemplate'
import { CmsEditProvider } from '@/components/site/CmsEditProvider'

export async function generateMetadata(): Promise<Metadata> {
  const maintenanceOn = await getSetting<boolean>('maintenance.enabled', false)
  if (maintenanceOn) return { title: 'Under Maintenance' }
  return { title: 'Home' }
}

export default async function SitePage() {
  // Check if setup is complete
  const steps = await db.setupStep.findMany()
  const setupDone = steps.length > 0 && steps.every((s) => s.completed || s.skipped)
  if (!setupDone && steps.length > 0) redirect('/setup')

  // Check maintenance mode
  const maintenanceOn = await getSetting<boolean>('maintenance.enabled', false)
  if (maintenanceOn) {
    const msg = await getSetting<string>('maintenance.message', 'Site is temporarily unavailable.')
    return (
      <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="font-playfair text-3xl text-[#35291C] mb-4">The Gazette</div>
          <p className="text-[#4B4C44] font-baskerville italic">{msg}</p>
        </div>
      </div>
    )
  }

  // Check if visitor is an admin (enables on-page editor), and load basic
  // profile info for the "Account" block (name/email/plan — nothing sensitive).
  const cookieStore = await cookies()
  const token = cookieStore.get('authjs.session-token')?.value
  let isAdmin = false
  let currentUser: { name: string | null; email: string; planName: string | null } | null = null
  if (token) {
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      select: {
        expires: true,
        user: { select: { name: true, email: true, role: true, subscription: { select: { plan: { select: { name: true } } } } } },
      },
    })
    if (session && session.expires > new Date()) {
      if (isAdminRole(session.user.role)) isAdmin = true
      currentUser = { name: session.user.name, email: session.user.email, planName: session.user.subscription?.plan.name ?? null }
    }
  }

  // Load nav items, pages, the product catalogue (for "featured products" blocks),
  // and the customizable header band in parallel
  const [pages, navItems, products, headerPage] = await Promise.all([
    db.cmsPage.findMany({
      where: { published: true, pageType: 'content' },
      orderBy: { pageOrder: 'asc' },
      include: {
        blocks: {
          ...(isAdmin ? {} : { where: { visible: true } }),
          orderBy: { blockOrder: 'asc' },
        },
      },
    }),
    db.navItem.findMany({ where: { visible: true }, orderBy: { navOrder: 'asc' } }),
    db.product.findMany({
      where: { visible: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: { id: true, slug: true, name: true, priceInCents: true },
    }),
    getHeaderPage(),
  ])

  const headerBlocks = headerPage.blocks.map((b) => ({
    id: b.id,
    blockType: b.blockType,
    content: b.content ?? '',
    column: b.column ?? 1,
    colSpan: b.colSpan ?? 1,
    visible: b.visible,
    blockOrder: b.blockOrder,
    blockKey: b.blockKey,
    overlayOf: b.overlayOf,
    overlayPosition: b.overlayPosition,
    overlayOffsetX: b.overlayOffsetX,
    overlayOffsetY: b.overlayOffsetY,
  }))

  // Load design + masthead settings
  const [
    siteName, mastheadTitle, mastheadLogoUrl,
    taglineLeft, taglineCenter, taglineRight,
    motto, editionDate, volume, issueNumber, editionLabel, establishedBy,
    currency,
  ] = await Promise.all([
    getSetting<string>('site.name',              'The Victorian Illustrated Gazette'),
    getSetting<string>('design.mastheadTitle',   'The Victorian Illustrated Gazette'),
    getSetting<string>('design.mastheadLogoUrl', ''),
    getSetting<string>('masthead.taglineLeft',   'PRICE TWO PENCE'),
    getSetting<string>('masthead.taglineCenter', '❧ ✦ ❧'),
    getSetting<string>('masthead.taglineRight',  'FOR KING & COUNTRY'),
    getSetting<string>('masthead.motto',         'Truth, Honour, Industry'),
    getSetting<string>('masthead.editionDate',   'Thursday, 14th November, 1878'),
    getSetting<string>('masthead.volume',        'XVI'),
    getSetting<string>('masthead.issueNumber',   '841'),
    getSetting<string>('masthead.editionLabel',  'LONDON MORNING EDITION'),
    getSetting<string>('masthead.establishedBy', 'Established by Royal Charter'),
    getSetting<string>('payments.currency',      'USD'),
  ])

  const template = (
    <VictorianTemplate
      pages={pages}
      navItems={navItems}
      siteName={siteName}
      mastheadTitle={mastheadTitle}
      mastheadLogoUrl={mastheadLogoUrl}
      masthead={{ taglineLeft, taglineCenter, taglineRight, motto, editionDate, volume, issueNumber, editionLabel, establishedBy }}
      products={products}
      currency={currency}
      currentUser={currentUser}
      headerPageId={headerPage.id}
      headerBlocks={headerBlocks}
    />
  )

  // Wrap with editor for admins
  if (isAdmin) {
    const editorPages = pages.map((p) => ({
      id: p.id,
      tabLabel: p.tabLabel,
      tabNumeral: p.tabNumeral,
      published: p.published,
      blocks: p.blocks.map((b) => ({
        id: b.id,
        blockType: b.blockType,
        content: b.content ?? '',
        column: b.column ?? 1,
        colSpan: b.colSpan ?? 1,
        visible: b.visible,
        blockOrder: b.blockOrder,
        blockKey: b.blockKey,
        overlayOf: b.overlayOf,
        overlayPosition: b.overlayPosition,
        overlayOffsetX: b.overlayOffsetX,
        overlayOffsetY: b.overlayOffsetY,
      })),
    }))
    return <CmsEditProvider pages={editorPages}>{template}</CmsEditProvider>
  }

  return template
}
