'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CmsEditContext, type EditBlock } from '@/components/site/CmsEditContext'
import { EditablePanel, type ProductSummary } from '@/components/site/CmsBlockArea'

function withBlockKeys(blocks: EditBlock[]): EditBlock[] {
  return blocks.map((b) => (b.blockKey ? b : { ...b, blockKey: crypto.randomUUID() }))
}

interface Props {
  pageId: string
  label: string
  helpText: string
  initialBlocks: EditBlock[]
  columnCount: number
  layout: string
  products: ProductSummary[]
  currency: string
}

// A minimal, standalone stand-in for CmsEditProvider — that component's toolbar/FAB
// chrome is built around the newspaper's multi-page, enter/exit-edit-mode workflow.
// Header and footer are always-editable singleton regions, so they get their own
// lightweight save bar instead, wired to the same CmsEditContext that EditablePanel
// (and therefore the whole block editor: drag/drop, overlays, spans) already expects.
export function HeaderFooterEditor({ pageId, label, helpText, initialBlocks, columnCount, layout, products, currency }: Props) {
  const router = useRouter()
  const [blocks, setBlocks] = useState<EditBlock[]>(() => withBlockKeys(initialBlocks))
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const setPageBlocks = useCallback((_pageId: string, next: EditBlock[]) => {
    setBlocks(next)
    setIsDirty(true)
  }, [])

  const saveCurrentPage = useCallback(async () => {
    setIsSaving(true)
    try {
      await fetch(`/api/admin/cms/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: blocks.map((b, i) => ({
            blockType: b.blockType,
            content: b.content,
            column: b.column,
            colSpan: b.colSpan,
            visible: b.visible,
            blockOrder: i + 1,
            blockKey: b.blockKey ?? null,
            overlayOf: b.overlayOf ?? null,
            overlayPosition: b.overlayPosition ?? null,
            overlayOffsetX: b.overlayOffsetX ?? null,
            overlayOffsetY: b.overlayOffsetY ?? null,
          })),
        }),
      })
      setIsDirty(false)
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }, [pageId, blocks, router])

  return (
    <CmsEditContext.Provider
      value={{
        isEditMode: true,
        enterEditMode: () => {},
        exitEditMode: () => {},
        currentPageId: pageId,
        setCurrentPageId: () => {},
        getPageBlocks: () => blocks,
        setPageBlocks,
        isDirty,
        isSaving,
        saveCurrentPage,
      }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#35291C', color: '#E8E6D8', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
        <span style={{ fontSize: 11, color: '#C4AB77' }}>{isDirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <button
          onClick={saveCurrentPage}
          disabled={isSaving || !isDirty}
          style={{
            marginLeft: 'auto', padding: '6px 16px', fontSize: 12, fontWeight: 600, borderRadius: 4, border: 'none',
            backgroundColor: isDirty ? '#C4AB77' : '#5a5138', color: 'white',
            cursor: isDirty && !isSaving ? 'pointer' : 'default',
          }}
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div style={{ padding: '12px 4px', fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#7A564C', backgroundColor: '#f5efe3', borderBottom: '1px solid #e8dcc4' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>{helpText}</div>
      </div>
      <div style={{ padding: '24px 16px', maxWidth: 1000, margin: '0 auto' }}>
        <EditablePanel pageId={pageId} columnCount={columnCount} layout={layout} products={products} currency={currency} />
      </div>
    </CmsEditContext.Provider>
  )
}
