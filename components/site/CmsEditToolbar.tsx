'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Page {
  id: string
  tabLabel: string
  tabNumeral: string
  published: boolean
}

interface Props {
  pages: Page[]
  currentPageId: string | null
  setCurrentPageId: (id: string) => void
  isSaving: boolean
  isDirty: boolean
  canUndo: boolean
  canRedo: boolean
  onSave: () => Promise<void>
  onUndo: () => void
  onRedo: () => void
  onExit: () => void
}

const btn: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif', fontSize: '12px', border: 'none',
  cursor: 'pointer', borderRadius: '4px', fontWeight: 600, padding: '5px 12px',
}

function ExitConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#faf9f4', border: '1px solid #c8c4a8', borderRadius: '8px', width: '100%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ background: 'linear-gradient(to right, #35291C, #C4AB77, #35291C)', height: '3px' }} />
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', color: '#35291C', margin: '0 0 8px' }}>
            Unsaved Changes
          </h2>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '14px', color: '#4B4C44', margin: '0 0 20px', lineHeight: 1.6 }}>
            You have unsaved changes to this page. If you exit now, your changes will be lost and the page will revert to its last saved state.
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={onCancel}
              style={{ ...btn, backgroundColor: 'transparent', border: '1px solid #c8c4a8', color: '#4B4C44', padding: '8px 16px' }}
            >
              Keep editing
            </button>
            <button
              onClick={onConfirm}
              style={{ ...btn, backgroundColor: '#7A564C', color: 'white', padding: '8px 16px' }}
            >
              Discard &amp; exit
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function CmsEditToolbar({
  pages, currentPageId, setCurrentPageId,
  isSaving, isDirty, canUndo, canRedo,
  onSave, onUndo, onRedo, onExit,
}: Props) {
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Warn on browser tab close / navigation away
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); onUndo() }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); onRedo() }
      if (mod && e.key === 's') { e.preventDefault(); if (isDirty) onSave() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDirty, onSave, onUndo, onRedo])

  function handleExit() {
    if (isDirty) {
      setShowExitConfirm(true)
    } else {
      onExit()
    }
  }

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '48px', zIndex: 9001,
        backgroundColor: '#35291C', borderBottom: '2px solid #C4AB77',
        display: 'flex', alignItems: 'center', gap: '6px', padding: '0 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}>
        {/* Mode label */}
        <span style={{ color: '#C4AB77', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', marginRight: '4px', whiteSpace: 'nowrap' }}>
          ✏ EDITING
        </span>

        {/* Undo / Redo */}
        <button onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)" style={{ ...btn, padding: '4px 8px', backgroundColor: 'transparent', color: canUndo ? '#E8E6D8' : '#3a2f20', border: '1px solid transparent', fontSize: '14px' }}>↩</button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (⌘Y)" style={{ ...btn, padding: '4px 8px', backgroundColor: 'transparent', color: canRedo ? '#E8E6D8' : '#3a2f20', border: '1px solid transparent', fontSize: '14px' }}>↪</button>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', backgroundColor: '#35291C', margin: '0 2px' }} />

        {/* Page tabs */}
        <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', flex: 1 }}>
          {pages.map((page) => {
            const active = page.id === currentPageId
            return (
              <button
                key={page.id}
                onClick={() => {
                  setCurrentPageId(page.id)
                  window.dispatchEvent(new CustomEvent('gazette:goto', { detail: { pageId: page.id } }))
                }}
                style={{
                  ...btn, padding: '4px 10px', whiteSpace: 'nowrap',
                  backgroundColor: active ? '#C4AB77' : 'transparent',
                  color: active ? '#35291C' : '#b8b090',
                  border: '1px solid transparent',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {page.tabNumeral}. {page.tabLabel}
                {!page.published && <span style={{ marginLeft: 4, fontSize: '10px', opacity: 0.7 }}>(draft)</span>}
              </button>
            )
          })}
        </div>

        {/* Right-side controls */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
          {isDirty && !isSaving && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#C4AB77', whiteSpace: 'nowrap' }}>● Unsaved</span>
          )}
          <button
            onClick={() => { if (isDirty) onSave() }}
            disabled={isSaving || !isDirty}
            title="Save (⌘S)"
            style={{ ...btn, backgroundColor: isDirty && !isSaving ? '#C4AB77' : '#35291C', color: '#E8E6D8', opacity: isSaving ? 0.7 : 1, cursor: isSaving || !isDirty ? 'default' : 'pointer' }}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={handleExit}
            style={{ ...btn, backgroundColor: 'transparent', color: '#b8b090', border: '1px solid #3a2f20' }}
          >
            ✕ Exit
          </button>
        </div>
      </div>

      {showExitConfirm && (
        <ExitConfirmModal
          onConfirm={() => { setShowExitConfirm(false); onExit() }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </>
  )
}
