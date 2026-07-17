'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CmsPage, ContentBlock } from '@prisma/client'

const BLOCK_TYPES = [
  { value: 'headline',      label: 'Headline',       description: 'Large article title' },
  { value: 'body',          label: 'Body text',      description: 'Paragraph of article text' },
  { value: 'pullquote',     label: 'Pull quote',     description: 'Highlighted quote or excerpt' },
  { value: 'advertisement', label: 'Advertisement',  description: 'Victorian-styled ad block' },
  { value: 'section_label', label: 'Section label',  description: 'Bold section divider' },
  { value: 'rule',          label: 'Rule / divider', description: 'Ornamental horizontal rule' },
]

const LAYOUTS = [
  { value: 'columns-1',   label: 'Single column',                cols: 1 },
  { value: 'columns-2',   label: 'Two columns (equal)',          cols: 2 },
  { value: 'columns-3',   label: 'Three columns',                cols: 3 },
  { value: 'columns-2-1', label: 'Two + one sidebar (right)',     cols: 3 },
  { value: 'columns-1-2', label: 'One sidebar + two (left)',      cols: 3 },
]

const COLUMN_NAMES: Record<string, string[]> = {
  'columns-1':   ['Column 1'],
  'columns-2':   ['Left', 'Right'],
  'columns-3':   ['Left', 'Centre', 'Right'],
  'columns-2-1': ['Main left', 'Main right', 'Sidebar'],
  'columns-1-2': ['Sidebar', 'Main left', 'Main right'],
}

interface Props {
  page: CmsPage | null
  blocks: ContentBlock[]
  defaultOrder: number
}

interface BlockDraft {
  id?: string
  blockType: string
  content: string
  column: number
  visible: boolean
  blockOrder: number
}

export function CmsPageEditor({ page, blocks: initialBlocks, defaultOrder }: Props) {
  const router = useRouter()

  const [tabLabel, setTabLabel] = useState(page?.tabLabel ?? '')
  const [tabNumeral, setTabNumeral] = useState(page?.tabNumeral ?? '')
  const [pageOrder, setPageOrder] = useState(page?.pageOrder ?? defaultOrder)
  const [layout, setLayout] = useState(page?.layout ?? 'columns-3')
  const [sectionLabel, setSectionLabel] = useState(page?.sectionLabel ?? '')
  const [published, setPublished] = useState(page?.published ?? false)
  const [showInNav, setShowInNav] = useState(page?.showInNav ?? true)
  const [publishAt, setPublishAt] = useState(page?.publishAt ? new Date(page.publishAt).toISOString().slice(0, 16) : '')
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription ?? '')
  const [seoImage, setSeoImage] = useState(page?.seoImage ?? '')
  const [customCss, setCustomCss] = useState(page?.customCss ?? '')
  const [customJs, setCustomJs] = useState(page?.customJs ?? '')

  const [blocks, setBlocks] = useState<BlockDraft[]>(
    initialBlocks.map((b) => ({
      id: b.id,
      blockType: b.blockType,
      content: b.content ?? '',
      column: b.column ?? 1,
      visible: b.visible,
      blockOrder: b.blockOrder,
    }))
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const columnCount = LAYOUTS.find(l => l.value === layout)?.cols ?? 1
  const columnNames = COLUMN_NAMES[layout] ?? Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`)

  // Returns blocks in a given column, sorted by blockOrder
  function blocksInColumn(col: number): BlockDraft[] {
    return blocks.filter(b => b.column === col).sort((a, b) => a.blockOrder - b.blockOrder)
  }

  // Find the global index of a block
  function globalIndex(block: BlockDraft): number {
    return blocks.indexOf(block)
  }

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setBlocks(prev => prev.map((b, i) => i === index ? { ...b, ...patch } : b))
  }

  function removeBlock(index: number) {
    setBlocks(prev => {
      const next = prev.filter((_, i) => i !== index)
      // Re-number blockOrders per column
      return renumber(next)
    })
  }

  function addBlock(type: string, col: number) {
    setBlocks(prev => {
      const colBlocks = prev.filter(b => b.column === col)
      const maxOrder = colBlocks.length > 0 ? Math.max(...colBlocks.map(b => b.blockOrder)) : 0
      return [...prev, { blockType: type, content: '', column: col, visible: true, blockOrder: maxOrder + 1 }]
    })
  }

  // Move a block up or down within its column
  function moveWithinColumn(block: BlockDraft, dir: -1 | 1) {
    const col = block.column
    const colBlocks = blocksInColumn(col)
    const pos = colBlocks.indexOf(block)
    const swapPos = pos + dir
    if (swapPos < 0 || swapPos >= colBlocks.length) return

    const other = colBlocks[swapPos]
    setBlocks(prev => prev.map(b => {
      if (b === block) return { ...b, blockOrder: other.blockOrder }
      if (b === other) return { ...b, blockOrder: block.blockOrder }
      return b
    }))
  }

  // Move a block to an adjacent column (left or right)
  function moveToColumn(block: BlockDraft, targetCol: number) {
    if (targetCol < 1 || targetCol > columnCount) return
    setBlocks(prev => {
      const targetColBlocks = prev.filter(b => b.column === targetCol)
      const maxOrder = targetColBlocks.length > 0 ? Math.max(...targetColBlocks.map(b => b.blockOrder)) : 0
      return renumber(prev.map(b => b === block ? { ...b, column: targetCol, blockOrder: maxOrder + 1 } : b))
    })
  }

  function renumber(list: BlockDraft[]): BlockDraft[] {
    const result = [...list]
    for (let col = 1; col <= 6; col++) {
      const inCol = result.filter(b => b.column === col).sort((a, b) => a.blockOrder - b.blockOrder)
      inCol.forEach((b, i) => { b.blockOrder = i + 1 })
    }
    return result
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // Assign final blockOrders: all blocks sorted by column then within-column order
      const finalBlocks = [...blocks].sort((a, b) => a.column - b.column || a.blockOrder - b.blockOrder)
        .map((b, i) => ({ ...b, blockOrder: i + 1 }))

      const res = await fetch(
        page ? `/api/admin/cms/pages/${page.id}` : '/api/admin/cms/pages',
        {
          method: page ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tabLabel, tabNumeral, pageOrder, layout, sectionLabel, published, showInNav,
            publishAt: publishAt || null,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            seoImage: seoImage || null,
            customCss: customCss || null,
            customJs: customJs || null,
            blocks: finalBlocks,
          }),
        }
      )
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to save page.')
      }
      router.push('/admin/content/pages')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="p-8 max-w-6xl space-y-6">

      {/* ── Page settings ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">Page settings</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tab label</label>
            <input type="text" value={tabLabel} onChange={e => setTabLabel(e.target.value)} required placeholder="Front Page"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]" />
            <p className="text-xs text-gray-400 mt-0.5">Shown on the side tab</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roman numeral</label>
            <input type="text" value={tabNumeral} onChange={e => setTabNumeral(e.target.value)} required placeholder="I"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]" />
            <p className="text-xs text-gray-400 mt-0.5">e.g. I, II, III</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Page order</label>
            <input type="number" value={pageOrder} onChange={e => setPageOrder(Number(e.target.value))} min={1}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Layout</label>
            <select value={layout} onChange={e => setLayout(e.target.value)}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]">
              {LAYOUTS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Section label</label>
            <input type="text" value={sectionLabel} onChange={e => setSectionLabel(e.target.value)} placeholder="Home & Foreign Intelligence"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] focus:ring-1 focus:ring-[#C4AB77]" />
            <p className="text-xs text-gray-400 mt-0.5">Shown top-left of the page</p>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C4AB77]" />
              </div>
              <span className="text-sm text-gray-700">{published ? 'Published — live on site' : 'Draft — not visible'}</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={showInNav} onChange={e => setShowInNav(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C4AB77]" />
              </div>
              <span className="text-sm text-gray-700">{showInNav ? 'Shown in navigation tabs' : 'Hidden from navigation — live but unlisted'}</span>
            </label>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Schedule publish <span className="font-normal normal-case text-gray-400">(optional)</span></label>
              <input type="datetime-local" value={publishAt} onChange={e => setPublishAt(e.target.value)}
                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── SEO ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5">SEO &amp; social sharing</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">SEO title <span className="font-normal normal-case text-gray-400">(overrides tab label in browser tab)</span></label>
            <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={tabLabel}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Meta description <span className="font-normal normal-case text-gray-400">(~155 chars)</span></label>
            <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2}
              placeholder="A brief description of this page for search engines…"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77] resize-none" />
            <p className="text-xs text-gray-400 mt-0.5">{seoDescription.length}/155 characters</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Social image URL <span className="font-normal normal-case text-gray-400">(og:image)</span></label>
            <input type="url" value={seoImage} onChange={e => setSeoImage(e.target.value)} placeholder="https://example.com/image.jpg"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#C4AB77]" />
          </div>
        </div>
      </div>

      {/* ── Custom code ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Custom code injection</h2>
        <p className="text-xs text-gray-400 mb-5">Advanced — inject CSS or JavaScript that only applies to this page.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Custom CSS</label>
            <textarea value={customCss} onChange={e => setCustomCss(e.target.value)} rows={4}
              placeholder=".article-headline { color: red; }"
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C4AB77] resize-y" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Custom JavaScript</label>
            <textarea value={customJs} onChange={e => setCustomJs(e.target.value)} rows={4}
              placeholder={'// Runs after the page loads\nconsole.log(\'Page loaded\');'}
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#C4AB77] resize-y" />
          </div>
        </div>
      </div>

      {/* ── Content blocks ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Content blocks</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {columnCount > 1
                ? 'Use ▲ ▼ to reorder within a column. Use ← → to move a block to the adjacent column.'
                : 'Use ▲ ▼ to reorder blocks.'}
            </p>
          </div>
          <span className="text-xs text-gray-400">{blocks.length} block{blocks.length !== 1 ? 's' : ''}</span>
        </div>

        {blocks.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">No blocks yet. Add your first block using the buttons below.</div>
        )}

        {/* ── Column layout view ── */}
        {blocks.length > 0 && (
          <div
            className="p-5 gap-4"
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)` }}
          >
            {Array.from({ length: columnCount }, (_, ci) => {
              const col = ci + 1
              const colBlocks = blocksInColumn(col)
              return (
                <div key={col} className="flex flex-col">
                  {/* Column header */}
                  <div className="text-xs font-semibold text-[#C4AB77] uppercase tracking-widest mb-3 pb-2 border-b border-[#e8e4d0] flex items-center justify-between">
                    <span>{columnNames[ci] ?? `Column ${col}`}</span>
                    <span className="font-normal text-gray-400 normal-case">{colBlocks.length} block{colBlocks.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Blocks in this column */}
                  <div className="flex-1 space-y-3">
                    {colBlocks.length === 0 && (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-xs text-gray-400">
                        Empty — add blocks below
                      </div>
                    )}

                    {colBlocks.map((block, posInCol) => {
                      const gi = globalIndex(block)
                      const isFirst = posInCol === 0
                      const isLast = posInCol === colBlocks.length - 1
                      const canMoveLeft = col > 1
                      const canMoveRight = col < columnCount

                      return (
                        <div key={gi} className="border border-gray-200 rounded-lg bg-[#fdfcf9] overflow-hidden">
                          {/* Block toolbar */}
                          <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100">
                            {/* Vertical move */}
                            <button type="button" onClick={() => moveWithinColumn(block, -1)} disabled={isFirst}
                              title="Move up in column"
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs px-1 py-0.5 rounded hover:bg-gray-200 transition-colors">▲</button>
                            <button type="button" onClick={() => moveWithinColumn(block, 1)} disabled={isLast}
                              title="Move down in column"
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs px-1 py-0.5 rounded hover:bg-gray-200 transition-colors">▼</button>

                            {/* Horizontal move */}
                            {columnCount > 1 && (
                              <>
                                <div className="w-px h-3 bg-gray-300 mx-1" />
                                <button type="button" onClick={() => moveToColumn(block, col - 1)} disabled={!canMoveLeft}
                                  title={`Move to ${columnNames[ci - 1] ?? 'previous column'}`}
                                  className="text-gray-400 hover:text-[#C4AB77] disabled:opacity-20 text-xs px-1 py-0.5 rounded hover:bg-amber-50 transition-colors">←</button>
                                <button type="button" onClick={() => moveToColumn(block, col + 1)} disabled={!canMoveRight}
                                  title={`Move to ${columnNames[ci + 1] ?? 'next column'}`}
                                  className="text-gray-400 hover:text-[#C4AB77] disabled:opacity-20 text-xs px-1 py-0.5 rounded hover:bg-amber-50 transition-colors">→</button>
                              </>
                            )}

                            {/* Block type selector */}
                            <select value={block.blockType} onChange={e => updateBlock(gi, { blockType: e.target.value })}
                              className="ml-1 border border-gray-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#C4AB77] bg-white">
                              {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>

                            {/* Visible toggle */}
                            <label className="flex items-center gap-1 ml-auto cursor-pointer" title="Toggle visibility">
                              <input type="checkbox" checked={block.visible} onChange={e => updateBlock(gi, { visible: e.target.checked })}
                                className="w-3 h-3 accent-[#C4AB77]" />
                              <span className="text-xs text-gray-400">Visible</span>
                            </label>

                            {/* Remove */}
                            <button type="button" onClick={() => removeBlock(gi)} title="Remove block"
                              className="text-xs text-red-400 hover:text-red-600 ml-1 px-1 py-0.5 rounded hover:bg-red-50 transition-colors">✕</button>
                          </div>

                          {/* Block content */}
                          {block.blockType !== 'rule' && (
                            <div className="p-3">
                              <textarea
                                value={block.content}
                                onChange={e => updateBlock(gi, { content: e.target.value })}
                                rows={block.blockType === 'body' ? 5 : 2}
                                placeholder={
                                  block.blockType === 'headline'      ? 'Article headline…' :
                                  block.blockType === 'body'          ? 'Article body text…\n\nUse **bold** and *italic* for formatting.' :
                                  block.blockType === 'pullquote'     ? 'A memorable quote or excerpt…' :
                                  block.blockType === 'advertisement' ? 'Advertisement copy…' :
                                  block.blockType === 'section_label' ? 'Section heading…' : ''
                                }
                                className="w-full text-sm focus:outline-none focus:border-[#C4AB77] resize-y bg-transparent"
                              />
                            </div>
                          )}

                          {block.blockType === 'rule' && (
                            <div className="px-3 py-3 flex items-center gap-2 text-xs text-gray-400 italic">
                              <div className="flex-1 h-px bg-gray-300" />
                              <span>Rule / divider</span>
                              <div className="flex-1 h-px bg-gray-300" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Add block to this column */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Add to {columnNames[ci] ?? `column ${col}`}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {BLOCK_TYPES.map(t => (
                        <button key={t.value} type="button" onClick={() => addBlock(t.value, col)}
                          title={t.description}
                          className="px-2 py-1 text-xs border border-gray-200 rounded hover:border-[#C4AB77] hover:text-[#C4AB77] transition-colors bg-white">
                          + {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add first block (when empty, show all columns) */}
        {blocks.length === 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Add a block to column 1:</p>
            <div className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => addBlock(t.value, 1)}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded hover:border-[#C4AB77] hover:text-[#C4AB77] transition-colors"
                  title={t.description}>
                  + {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving}
          className="px-6 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : page ? 'Save changes' : 'Create page'}
        </button>
        <button type="button" onClick={() => router.push('/admin/content/pages')}
          className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  )
}
