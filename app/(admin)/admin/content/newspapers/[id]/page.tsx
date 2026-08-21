import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { HeaderFooterEditor } from '@/components/admin/HeaderFooterEditor'

export const metadata: Metadata = { title: 'Edit issue' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function NewspaperIssueEditorPage({ params }: Props) {
  const { id } = await params

  const [issue, products, currency] = await Promise.all([
    db.cmsPage.findUnique({
      where: { id },
      include: { blocks: { orderBy: { blockOrder: 'asc' } } },
    }),
    db.product.findMany({
      where: { visible: true },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
      select: { id: true, slug: true, name: true, priceInCents: true, images: true },
    }),
    getSetting<string>('payments.currency', 'USD'),
  ])

  if (!issue || issue.pageType !== 'newspaper') notFound()

  const blocks = issue.blocks.map((b) => ({
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
      pageId={issue.id}
      label={`Issue — ${issue.tabLabel}`}
      helpText={
        issue.sentAt
          ? `This issue was already sent on ${issue.sentAt.toLocaleDateString()}. Edits here won't reach subscribers who already received it — go back to Newspaper to send an update.`
          : 'Compose this issue with the same blocks used on pages — headlines, images, body text, buttons. When ready, go back to Newspaper and click Send.'
      }
      initialBlocks={blocks}
      columnCount={1}
      layout={issue.layout}
      products={products}
      currency={currency}
    />
  )
}
