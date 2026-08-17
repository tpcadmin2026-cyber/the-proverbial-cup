import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { getHeaderPage } from '@/lib/headerFooterPages'
import { HeaderFooterEditor } from '@/components/admin/HeaderFooterEditor'

export const metadata: Metadata = { title: 'Header' }

export default async function HeaderAdminPage() {
  const [page, products, currency] = await Promise.all([
    getHeaderPage(),
    db.product.findMany({
      where: { visible: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: { id: true, slug: true, name: true, priceInCents: true },
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
      label="Header"
      helpText="These blocks appear as a banner above the masthead on every page — use them for an announcement, promo, or seasonal message. Leave empty to show nothing."
      initialBlocks={blocks}
      columnCount={3}
      layout={page.layout}
      products={products}
      currency={currency}
    />
  )
}
