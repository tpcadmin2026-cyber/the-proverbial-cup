'use client'

import { createContext, useContext } from 'react'

export interface EditBlock {
  id: string
  blockType: string
  content: string
  column: number
  visible: boolean
  blockOrder: number
}

export interface CmsEditContextValue {
  isEditMode: boolean
  enterEditMode: () => void
  exitEditMode: () => void
  currentPageId: string | null
  setCurrentPageId: (id: string) => void
  getPageBlocks: (pageId: string) => EditBlock[]
  setPageBlocks: (pageId: string, blocks: EditBlock[]) => void
  isDirty: boolean
  isSaving: boolean
  saveCurrentPage: () => Promise<void>
}

export const CmsEditContext = createContext<CmsEditContextValue | null>(null)

export function useCmsEdit() {
  const ctx = useContext(CmsEditContext)
  if (!ctx) throw new Error('useCmsEdit must be used within CmsEditProvider')
  return ctx
}
