import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { getFooterPage } from '@/lib/headerFooterPages'
import { HeaderFooterEditor } from '@/components/admin/HeaderFooterEditor'

export const metadata: Metadata = { title: 'Footer' }

export default async function FooterAdminPage() {
  const [page, products, currency] = await Promise.all([
    getFooterPage(),
    db.product.findMany({
      where: { visible: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: { id: true, slug: true, name: true, priceInCents: true, images: true },
    }),
    getSetting<string>('payments.currency', 'USD'),
  ])

  const blocks = page.blocks.map((b) => ({
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

  return (
    <HeaderFooterEditor
      pageId={page.id}
      label="Footer"
      helpText="These blocks appear above the standard footer links (Contact, My Account, legal) on every non-newspaper page. Leave empty to show nothing extra."
      initialBlocks={blocks}
      columnCount={3}
      layout={page.layout}
      products={products}
      currency={currency}
    />
  )
}
