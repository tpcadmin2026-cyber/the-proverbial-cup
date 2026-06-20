import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CmsPageEditor } from './CmsPageEditor'

interface Props {
  params: Promise<{ pageId: string }>
}

export default async function CmsPageEditorPage({ params }: Props) {
  const { pageId } = await params

  if (pageId === 'new') {
    const count = await db.cmsPage.count()
    return (
      <>
        <AdminHeader title="New page" subtitle="Add a new newspaper page to the Gazette." />
        <CmsPageEditor page={null} blocks={[]} defaultOrder={count + 1} />
      </>
    )
  }

  const page = await db.cmsPage.findUnique({
    where: { id: pageId },
    include: { blocks: { orderBy: { blockOrder: 'asc' } } },
  })

  if (!page) notFound()

  return (
    <>
      <AdminHeader title={`Edit page — ${page.tabLabel}`} subtitle={`Page ${page.tabNumeral} · ${page.layout.replace(/-/g, ' ')}`} />

      {/* Advanced editor banner */}
      {page.published && (
        <div className="mx-8 mt-6 flex items-center justify-between gap-4 bg-[#35291C] text-[#E8E6D8] rounded-lg px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Advanced on-page editor</p>
            <p className="text-xs text-[#b8b090] mt-0.5">
              Drag and drop blocks, edit text inline, add images and media — directly on the live newspaper.
            </p>
          </div>
          <Link
            href={`/?cms_edit=${page.id}`}
            target="_blank"
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#C4AB77] text-[#35291C] text-sm font-bold rounded hover:bg-[#9a7820] transition-colors whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Open advanced editor
          </Link>
        </div>
      )}
      {!page.published && (
        <div className="mx-8 mt-6 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 text-sm text-amber-800">
          <span>⚠</span>
          <span>Publish this page first to use the advanced on-page editor.</span>
        </div>
      )}

      <CmsPageEditor page={page} blocks={page.blocks} defaultOrder={page.pageOrder} />
    </>
  )
}
