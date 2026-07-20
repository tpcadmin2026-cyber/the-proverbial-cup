'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { CmsEditContext, type EditBlock } from './CmsEditContext'
import { CmsEditToolbar } from './CmsEditToolbar'
import { CmsEditFAB } from './CmsEditFAB'

export interface CmsPageMeta {
  id: string
  tabLabel: string
  tabNumeral: string
  published: boolean
  blocks: EditBlock[]
}

interface Props {
  children: React.ReactNode
  pages: CmsPageMeta[]
}

const HISTORY_LIMIT = 50

export function CmsEditProvider({ children, pages }: Props) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentPageId, setCurrentPageId] = useState<string | null>(pages[0]?.id ?? null)
  const [pageBlocks, setPageBlocksState] = useState<Record<string, EditBlock[]>>(() => {
    const map: Record<string, EditBlock[]> = {}
    for (const p of pages) map[p.id] = p.blocks
    return map
  })
  const [dirtyPages, setDirtyPages] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // Undo/redo history — per page
  const historyRef = useRef<Record<string, EditBlock[][]>>({})
  const historyIndexRef = useRef<Record<string, number>>({})

  function pushHistory(pageId: string, blocks: EditBlock[]) {
    const hist = historyRef.current[pageId] ?? []
    const idx = historyIndexRef.current[pageId] ?? -1
    // Truncate any redo states
    const trimmed = hist.slice(0, idx + 1)
    trimmed.push(blocks)
    if (trimmed.length > HISTORY_LIMIT) trimmed.shift()
    historyRef.current[pageId] = trimmed
    historyIndexRef.current[pageId] = trimmed.length - 1
  }

  function canUndo() {
    if (!currentPageId) return false
    return (historyIndexRef.current[currentPageId] ?? -1) > 0
  }

  function canRedo() {
    if (!currentPageId) return false
    const hist = historyRef.current[currentPageId] ?? []
    const idx = historyIndexRef.current[currentPageId] ?? -1
    return idx < hist.length - 1
  }

  // Force re-render when undo/redo state changes
  const [, forceUpdate] = useState(0)

  const undo = useCallback(() => {
    if (!currentPageId) return
    const idx = historyIndexRef.current[currentPageId] ?? -1
    if (idx <= 0) return
    const newIdx = idx - 1
    historyIndexRef.current[currentPageId] = newIdx
    const blocks = historyRef.current[currentPageId][newIdx]
    setPageBlocksState((prev) => ({ ...prev, [currentPageId]: blocks }))
    setDirtyPages((prev) => new Set(prev).add(currentPageId))
    forceUpdate((n) => n + 1)
  }, [currentPageId])

  const redo = useCallback(() => {
    if (!currentPageId) return
    const hist = historyRef.current[currentPageId] ?? []
    const idx = historyIndexRef.current[currentPageId] ?? -1
    if (idx >= hist.length - 1) return
    const newIdx = idx + 1
    historyIndexRef.current[currentPageId] = newIdx
    const blocks = hist[newIdx]
    setPageBlocksState((prev) => ({ ...prev, [currentPageId]: blocks }))
    setDirtyPages((prev) => new Set(prev).add(currentPageId))
    forceUpdate((n) => n + 1)
  }, [currentPageId])

  // Auto-enter edit mode if ?cms_edit=<pageId> is in the URL (arriving from admin)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editPageId = params.get('cms_edit')
    if (editPageId && pages.some((p) => p.id === editPageId)) {
      const url = new URL(window.location.href)
      url.searchParams.delete('cms_edit')
      window.history.replaceState({}, '', url.toString())
      setCurrentPageId(editPageId)
      setIsEditMode(true)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('gazette:goto', { detail: { pageId: editPageId } }))
      }, 400)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync currentPageId when VictorianNav changes page
  useEffect(() => {
    function onPageChange(e: Event) {
      const id = (e as CustomEvent<{ pageId: string }>).detail?.pageId
      if (id) setCurrentPageId(id)
    }
    window.addEventListener('gazette:pagechange', onPageChange)
    return () => window.removeEventListener('gazette:pagechange', onPageChange)
  }, [])

  // Adjust site-root height when toolbar appears/disappears
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.site-root')
    if (!root) return
    if (isEditMode) {
      root.style.marginTop = '48px'
      root.style.height = 'calc(100vh - 48px)'
    } else {
      root.style.marginTop = ''
      root.style.height = ''
    }
  }, [isEditMode])

  const enterEditMode = useCallback(() => {
    // Seed history with current state for each page
    for (const p of pages) {
      historyRef.current[p.id] = [p.blocks]
      historyIndexRef.current[p.id] = 0
    }
    setIsEditMode(true)
  }, [pages])

  const exitEditMode = useCallback(() => {
    setIsEditMode(false)
    setDirtyPages(new Set())
    historyRef.current = {}
    historyIndexRef.current = {}
    const map: Record<string, EditBlock[]> = {}
    for (const p of pages) map[p.id] = p.blocks
    setPageBlocksState(map)
  }, [pages])

  const getPageBlocks = useCallback(
    (pageId: string) => pageBlocks[pageId] ?? [],
    [pageBlocks]
  )

  const setPageBlocks = useCallback((pageId: string, blocks: EditBlock[]) => {
    setPageBlocksState((prev) => ({ ...prev, [pageId]: blocks }))
    setDirtyPages((prev) => new Set(prev).add(pageId))
    pushHistory(pageId, blocks)
    forceUpdate((n) => n + 1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveCurrentPage = useCallback(async () => {
    if (!currentPageId) return
    setIsSaving(true)
    try {
      const blocks = pageBlocks[currentPageId] ?? []
      await fetch(`/api/admin/cms/pages/${currentPageId}`, {
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
          })),
        }),
      })
      setDirtyPages((prev) => {
        const next = new Set(prev)
        next.delete(currentPageId)
        return next
      })
    } finally {
      setIsSaving(false)
    }
  }, [currentPageId, pageBlocks])

  const isDirty = dirtyPages.size > 0

  return (
    <CmsEditContext.Provider value={{
      isEditMode,
      enterEditMode,
      exitEditMode,
      currentPageId,
      setCurrentPageId,
      getPageBlocks,
      setPageBlocks,
      isDirty,
      isSaving,
      saveCurrentPage,
    }}>
      {isEditMode && (
        <CmsEditToolbar
          pages={pages}
          currentPageId={currentPageId}
          setCurrentPageId={setCurrentPageId}
          isSaving={isSaving}
          isDirty={isDirty}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onSave={saveCurrentPage}
          onUndo={undo}
          onRedo={redo}
          onExit={exitEditMode}
        />
      )}
      {!isEditMode && <CmsEditFAB onEdit={enterEditMode} />}
      {children}
    </CmsEditContext.Provider>
  )
}
