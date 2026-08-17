import { getSetting } from '@/lib/settings'
import { getFooterPage } from '@/lib/headerFooterPages'
import { getCurrentUser } from '@/lib/currentUser'
import { db } from '@/lib/db'
import { SiteFooter } from './SiteFooter'

export async function FooterWrapper() {
  const [siteName, copyright, contactEmail, address, termsUrl, privacyUrl, twitter, instagram, facebook, showChangelog, showAccountLink, footerPage, products, currency, currentUser] = await Promise.all([
    getSetting<string>('site.name',             'The Victorian Illustrated Gazette'),
    getSetting<string>('site.copyrightText',    '© The Victorian Illustrated Gazette. All rights reserved.'),
    getSetting<string>('site.contactEmail',     ''),
    getSetting<string>('site.address',          ''),
    getSetting<string>('site.termsUrl',         ''),
    getSetting<string>('site.privacyUrl',       ''),
    getSetting<string>('site.social.twitter',   ''),
    getSetting<string>('site.social.instagram', ''),
    getSetting<string>('site.social.facebook',  ''),
    getSetting<boolean>('changelog.public',     false),
    getSetting<boolean>('site.showAccountLinkInFooter', true),
    getFooterPage(),
    db.product.findMany({
      where: { visible: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: { id: true, slug: true, name: true, priceInCents: true },
    }),
    getSetting<string>('payments.currency', 'USD'),
    getCurrentUser(),
  ])

  return (
    <SiteFooter
      siteName={siteName}
      copyright={copyright}
      contactEmail={contactEmail}
      address={address}
      termsUrl={termsUrl}
      privacyUrl={privacyUrl}
      twitter={twitter}
      instagram={instagram}
      facebook={facebook}
      showChangelog={showChangelog}
      showAccountLink={showAccountLink}
      footerPageId={footerPage.id}
      customBlocks={footerPage.blocks.map((b) => ({
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
      }))}
      products={products}
      currency={currency}
      currentUser={currentUser}
    />
  )
}
