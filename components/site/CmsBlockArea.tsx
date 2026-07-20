'use client'

import { useContext, useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent,
  DragOverlay, useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CmsEditContext, type EditBlock } from './CmsEditContext'
import { RichTextEditor } from './RichTextEditor'
import { RichText } from '@/lib/richText'

// ─── Block type definitions ──────────────────────────────────────────────────

export const BLOCK_TYPES = [
  // Typography
  { value: 'headline',     group: 'Text',       label: 'Headline',        description: 'Large article title', icon: 'H' },
  { value: 'subheadline',  group: 'Text',       label: 'Subheadline',     description: 'Smaller secondary title', icon: 'h' },
  { value: 'byline',       group: 'Text',       label: 'Byline',          description: 'Author credit — "By Our Correspondent"', icon: '✒' },
  { value: 'dateline',     group: 'Text',       label: 'Dateline',        description: 'Location and date — "LONDON, Thursday"', icon: '📍' },
  { value: 'body',         group: 'Text',       label: 'Body text',       description: 'Article paragraphs, formatted with the rich text toolbar', icon: '¶' },
  { value: 'pullquote',    group: 'Text',       label: 'Pull quote',      description: 'Highlighted quote or excerpt', icon: '"' },
  { value: 'advertisement',group: 'Text',       label: 'Advertisement',   description: 'Victorian-styled advertisement block', icon: '📢' },
  { value: 'cta',          group: 'Text',       label: 'Call to action',  description: 'Button linking to a page or URL', icon: '→' },
  // Media
  { value: 'image',        group: 'Media',      label: 'Image',           description: 'Image with optional alt text and caption', icon: '🖼' },
  { value: 'video',        group: 'Media',      label: 'Video embed',     description: 'Embed a YouTube or Vimeo video', icon: '▶' },
  // Data
  { value: 'table',        group: 'Data',       label: 'Table',           description: 'Data table with header row', icon: '⊞' },
  // Commerce
  { value: 'featured_products', group: 'Commerce', label: 'Featured products', description: 'Promote up to 6 products from your shop in a row — pair with "Span" for full width', icon: '⊡' },
  // Layout
  { value: 'section_label',group: 'Layout',     label: 'Section label',   description: 'Bold section heading with decorative rule', icon: '§' },
  { value: 'rule',         group: 'Layout',     label: 'Rule / divider',  description: 'Ornamental horizontal dividing rule', icon: '—' },
  { value: 'ornament',     group: 'Layout',     label: 'Ornament',        description: 'Decorative Victorian symbol or dingbat', icon: '❧' },
  { value: 'spacer',       group: 'Layout',     label: 'Spacer',          description: 'Blank vertical space between blocks', icon: '↕' },
  // Advanced
  { value: 'html',         group: 'Advanced',   label: 'Custom HTML',     description: 'Raw HTML — embeds, iframes, custom code', icon: '</>' },
] as const

export type BlockType = typeof BLOCK_TYPES[number]['value']

export interface ProductSummary {
  id: string
  slug: string
  name: string
  priceInCents: number
}

const ORNAMENT_PRESETS = [
  '❧ ✦ ❧', '⸻ ✦ ⸻', '✦ ✦ ✦', '❦', '☙ ❧', '◈', '⁂', '✤', '❊', '⁕ ⁕ ⁕',
]

function parseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T } catch { return fallback }
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

// ─── Static block renderer ───────────────────────────────────────────────────

export function StaticBlock({ block, products = [], currency = 'USD' }: { block: EditBlock; products?: ProductSummary[]; currency?: string }) {
  const text = block.content ?? ''
  switch (block.blockType as BlockType) {
    case 'headline':
      return <div className="article-headline" style={{ marginBottom: '0.5em' }}>{text}</div>
    case 'subheadline':
      return <div className="article-headline" style={{ marginBottom: '0.4em', fontSize: '85%', fontStyle: 'italic' }}>{text}</div>
    case 'byline':
      return <div className="body-text" style={{ marginBottom: '0.4em', fontStyle: 'italic', fontSize: '0.85em', color: 'var(--ink-faded)' }}>{text}</div>
    case 'dateline':
      return <div className="body-text" style={{ marginBottom: '0.4em', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.8em', fontWeight: 'bold' }}>{text}</div>
    case 'body':
      return <RichText as="div" className="body-text" style={{ marginBottom: '0.75em' }} content={text} />
    case 'pullquote':
      return <RichText as="blockquote" className="pull-quote" style={{ margin: '0.75em 0' }} content={text} />
    case 'advertisement':
      return (
        <div className="ad-block" style={{ margin: '0.75em 0', textAlign: 'center', border: '1px solid var(--ink-faded)', padding: '8px', fontStyle: 'italic' }}>
          {text}
        </div>
      )
    case 'cta': {
      const d = parseJson<{ text: string; url: string; style: string }>(text, { text: 'Subscribe Now', url: '/pricing', style: 'dark' })
      return (
        <div style={{ margin: '0.75em 0', textAlign: 'center' }}>
          <a
            href={d.url}
            style={{
              display: 'inline-block', padding: '8px 20px',
              backgroundColor: d.style === 'outline' ? 'transparent' : 'var(--ink)',
              color: d.style === 'outline' ? 'var(--ink)' : 'var(--paper)',
              border: '1px solid var(--ink)', textDecoration: 'none',
              fontFamily: 'var(--font-headline)', fontSize: '0.8em', letterSpacing: '0.08em',
            }}
          >
            {d.text}
          </a>
        </div>
      )
    }
    case 'image': {
      const d = parseJson<{ url: string; alt: string; caption: string; width: number; fit: string }>(text, { url: '', alt: '', caption: '', width: 100, fit: 'fit' })
      if (!d.url) return null
      const w = d.width ?? 100
      const fit = d.fit ?? 'fit'
      const caption = d.caption && (
        <figcaption className="body-text" style={{ fontSize: '0.75em', fontStyle: 'italic', marginTop: '4px', color: 'var(--ink-faded)', flexShrink: 0 }}>
          {d.caption}
        </figcaption>
      )
      if (fit === 'fit') {
        return (
          <figure style={{ margin: '0.75em 0', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.url} alt={d.alt} style={{ width: `${w}%`, maxWidth: '100%', border: '1px solid var(--ink-faded)', display: 'block', margin: '0 auto' }} />
            {caption}
          </figure>
        )
      }
      // "fill"/"stretch" — the image expands to fill the block's full height, leaving no gap
      // around it. Works best when the image is the only block in its column/span.
      return (
        <figure style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.url}
            alt={d.alt}
            style={{
              width: '100%', flex: '1 1 auto', minHeight: 0,
              objectFit: fit === 'stretch' ? 'fill' : 'cover',
              border: '1px solid var(--ink-faded)', display: 'block',
            }}
          />
          {caption}
        </figure>
      )
    }
    case 'video': {
      const videoUrl = text.trim()
      if (!videoUrl) return null
      const embedUrl = getVideoEmbedUrl(videoUrl)
      if (!embedUrl) return (
        <div style={{ margin: '0.75em 0', padding: '8px', border: '1px solid var(--ink-faded)', textAlign: 'center', fontStyle: 'italic', fontSize: '0.8em', color: 'var(--ink-faded)' }}>
          Invalid video URL
        </div>
      )
      return (
        <div style={{ margin: '0.75em 0', position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', border: '1px solid var(--ink-faded)' }}>
          <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
        </div>
      )
    }
    case 'featured_products': {
      const d = parseJson<{ heading: string; productIds: string[] }>(text, { heading: '', productIds: [] })
      const items = d.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is ProductSummary => !!p)
      if (items.length === 0) return null
      return (
        <div style={{ margin: '0.75em 0' }}>
          {d.heading && <div className="section-label" style={{ marginBottom: '8px' }}>{d.heading}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '10px' }}>
            {items.map((p) => (
              <a
                key={p.id}
                href={`/shop/${p.slug}`}
                style={{
                  display: 'block', textAlign: 'center', textDecoration: 'none', color: 'inherit',
                  border: '1px solid var(--ink-faded)', borderRadius: '2px', padding: '10px 4px',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                }}
              >
                <div style={{ fontSize: '1.6em', lineHeight: 1 }}>☕</div>
                <div className="body-text" style={{ fontSize: '0.68em', fontWeight: 'bold', margin: '6px 0 2px', lineHeight: 1.25 }}>{p.name}</div>
                <div style={{ fontSize: '0.65em', color: 'var(--red)' }}>{formatPrice(p.priceInCents, currency)}</div>
              </a>
            ))}
          </div>
        </div>
      )
    }
    case 'table': {
      const td = parseJson<{ headers: string[]; rows: string[][] }>(text, { headers: [], rows: [] })
      if (!td.headers.length && !td.rows.length) return null
      return (
        <div style={{ margin: '0.75em 0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)', fontSize: '0.85em' }}>
            {td.headers.length > 0 && (
              <thead>
                <tr>
                  {td.headers.map((h, i) => (
                    <th key={i} style={{ padding: '4px 8px', borderBottom: '2px solid var(--ink)', textAlign: 'left', fontFamily: 'var(--font-smallcaps)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.85em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {td.rows.map((row, ri) => (
                <tr key={ri} style={{ borderBottom: '1px solid rgba(26,16,8,0.2)' }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '4px 8px' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    case 'section_label':
      return <div className="section-label" style={{ margin: '0.5em 0' }}>{text}</div>
    case 'rule':
      return <div className="rule-triple" style={{ margin: '0.5em 0' }} />
    case 'ornament':
      return <div className="rule-ornate" style={{ margin: '0.5em 0', textAlign: 'center' }}>{text || '⸻ ✦ ⸻'}</div>
    case 'spacer':
      return <div style={{ height: `${parseInt(text) || 24}px` }} />
    case 'html':
      return <div style={{ margin: '0.5em 0' }} dangerouslySetInnerHTML={{ __html: text }} />
    default:
      return null
  }
}

// Convert YouTube/Vimeo watch URL to embed URL
function getVideoEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // YouTube
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v') ?? u.pathname.split('/').pop()
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    // Vimeo
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    // If it's already an embed URL, return as-is
    if (url.includes('/embed/') || url.includes('player.vimeo')) return url
    return null
  } catch {
    return null
  }
}

interface SpanCell { block: EditBlock; startCol: number; span: number }
interface BlockRow {
  spans: SpanCell[]
  columns: EditBlock[][] // length = columnCount; columns claimed by a span stay empty here
}

/** Clamps a block's colSpan/column into a valid 1-indexed start column within the layout. */
function spanStartCol(block: EditBlock, columnCount: number): { start: number; span: number } {
  const span = Math.min(Math.max(block.colSpan ?? 1, 1), columnCount)
  const maxStart = columnCount - span + 1
  const start = Math.min(Math.max(block.column ?? 1, 1), maxStart)
  return { start, span }
}

/**
 * Groups blocks (in order) into rows. Columns flow independently within a row — a
 * spanning block shares its row with normal blocks in whichever columns it doesn't
 * cover (e.g. a 2-column image beside a 1-column text sidebar) — and a row only ends
 * when something would actually overlap what's already been placed in it.
 */
function groupBlocksIntoRows(blocks: EditBlock[], columnCount: number): BlockRow[] {
  const rows: BlockRow[] = []
  let current: BlockRow = { spans: [], columns: Array.from({ length: columnCount }, () => []) }
  let spanClaimed = new Set<number>()  // columns reserved by a span in the current row
  let normalUsed = new Set<number>()   // columns that already hold a normal block in the current row

  function flush() {
    rows.push(current)
    current = { spans: [], columns: Array.from({ length: columnCount }, () => []) }
    spanClaimed = new Set()
    normalUsed = new Set()
  }

  for (const block of blocks) {
    const { start, span } = spanStartCol(block, columnCount)
    if (span > 1) {
      const range = Array.from({ length: span }, (_, i) => start + i)
      if (range.some((c) => spanClaimed.has(c) || normalUsed.has(c))) flush()
      current.spans.push({ block, startCol: start, span })
      range.forEach((c) => spanClaimed.add(c))
    } else {
      if (spanClaimed.has(start)) flush()
      current.columns[start - 1].push(block)
      normalUsed.add(start)
    }
  }
  // Always end with a row (even if empty) — the static view renders an empty one as
  // nothing, but the editor relies on it always existing as a drop target.
  flush()
  return rows
}

function StaticBlocks({ blocks, columnCount, products, currency }: { blocks: EditBlock[]; columnCount: number; products: ProductSummary[]; currency: string }) {
  const visible = blocks.filter((b) => b.visible)
  if (visible.length === 0) return null
  if (columnCount === 1) return <div>{visible.map((b) => <StaticBlock key={b.id} block={b} products={products} currency={currency} />)}</div>

  // Blocks with colSpan 1 keep flowing in their own independent column stack, like a
  // newspaper. A block spanning 2+ columns shares its row with normal blocks in
  // whichever columns it doesn't cover (e.g. an image beside a text sidebar) — a row
  // only breaks when something would actually overlap what's already in it.
  const rows = groupBlocksIntoRows(visible, columnCount)

  return (
    <div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: '0 12px' }}>
          {row.spans.map(({ block, startCol, span }) => (
            <div key={block.id} style={{ gridColumn: `${startCol} / span ${span}`, gridRow: 1 }}>
              <StaticBlock block={block} products={products} currency={currency} />
            </div>
          ))}
          {row.columns.map((colBlocks, ci) => colBlocks.length > 0 && (
            <div key={ci} style={{ gridColumn: `${ci + 1} / span 1`, gridRow: 1 }}>
              {colBlocks.map((b) => <StaticBlock key={b.id} block={b} products={products} currency={currency} />)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Portal dropdown ─────────────────────────────────────────────────────────

function AddBlockDropdown({ anchorRef, onAdd, onClose }: {
  anchorRef: React.RefObject<HTMLButtonElement | null>
  onAdd: (type: string) => void
  onClose: () => void
}) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openUp: true, maxHeight: 320 })

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      const margin = 8
      const spaceAbove = r.top - margin
      const spaceBelow = window.innerHeight - r.bottom - margin
      // Prefer opening above the button, but flip below if there isn't enough room
      const openUp = spaceAbove >= 200 || spaceAbove >= spaceBelow
      const available = openUp ? spaceAbove : spaceBelow
      setPos({
        top: openUp ? r.top - 4 : r.bottom + 4,
        left: r.left,
        width: r.width,
        openUp,
        maxHeight: Math.max(120, Math.min(available, window.innerHeight * 0.6)),
      })
    }
  }, [anchorRef])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!(e.target as Element)?.closest?.('[data-cms-dropdown]')) onClose()
    }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const groups = Array.from(new Set(BLOCK_TYPES.map((t) => t.group)))

  return createPortal(
    <div
      data-cms-dropdown
      style={{
        position: 'fixed',
        ...(pos.openUp
          ? { bottom: `calc(100vh - ${pos.top}px)` }
          : { top: `${pos.top}px` }),
        left: pos.left,
        width: Math.max(pos.width, 240),
        backgroundColor: '#faf9f4',
        border: '1px solid #c8c4a8',
        borderRadius: '6px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        zIndex: 99999,
        overflow: 'hidden',
        maxHeight: `${pos.maxHeight}px`,
        overflowY: 'auto',
      }}
    >
      {groups.map((group) => (
        <div key={group}>
          <div style={{ padding: '5px 12px 3px', fontSize: '9px', fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C4AB77', backgroundColor: '#f5f2e8', borderBottom: '1px solid #e8e4d0' }}>
            {group}
          </div>
          {BLOCK_TYPES.filter((t) => t.group === group).map((t) => (
            <button
              key={t.value}
              onMouseDown={(e) => { e.preventDefault(); onAdd(t.value); onClose() }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                width: '100%', textAlign: 'left', padding: '8px 12px',
                fontFamily: 'Inter, sans-serif', background: 'none', border: 'none',
                cursor: 'pointer', borderBottom: '1px solid #f5f2e8',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(139,105,20,0.08)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
            >
              <span style={{ fontSize: '14px', width: '20px', textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#35291C' }}>{t.label}</div>
                <div style={{ fontSize: '10px', color: '#C4AB77', marginTop: '1px' }}>{t.description}</div>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>,
    document.body
  )
}

function AddBlockButton({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <div style={{ marginTop: '8px' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', padding: '7px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, backgroundColor: 'transparent', border: '1px dashed #C4AB77', borderRadius: '4px', cursor: 'pointer', color: '#C4AB77', letterSpacing: '0.05em' }}
      >
        + Add block
      </button>
      {open && typeof window !== 'undefined' && (
        <AddBlockDropdown anchorRef={btnRef} onAdd={onAdd} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

// ─── Table editor component ──────────────────────────────────────────────────

function TableEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [data, setData] = useState<{ headers: string[]; rows: string[][] }>(() =>
    parseJson(value, { headers: ['Column 1', 'Column 2'], rows: [['', '']] })
  )

  function update(next: typeof data) {
    setData(next)
    onChange(JSON.stringify(next))
  }

  function setHeader(i: number, v: string) {
    const headers = [...data.headers]
    headers[i] = v
    update({ ...data, headers })
  }

  function setCell(ri: number, ci: number, v: string) {
    const rows = data.rows.map((r) => [...r])
    rows[ri][ci] = v
    update({ ...data, rows })
  }

  function addCol() {
    update({ headers: [...data.headers, `Column ${data.headers.length + 1}`], rows: data.rows.map((r) => [...r, '']) })
  }

  function removeCol(i: number) {
    if (data.headers.length <= 1) return
    update({ headers: data.headers.filter((_, j) => j !== i), rows: data.rows.map((r) => r.filter((_, j) => j !== i)) })
  }

  function addRow() {
    update({ ...data, rows: [...data.rows, Array(data.headers.length).fill('')] })
  }

  function removeRow(i: number) {
    update({ ...data, rows: data.rows.filter((_, j) => j !== i) })
  }

  const cell: React.CSSProperties = { padding: '4px', border: '1px solid #c8c4a8', borderRadius: 3, fontFamily: 'Inter, sans-serif', fontSize: '12px', width: '100%', boxSizing: 'border-box' }

  return (
    <div>
      <FieldLabel>Table content</FieldLabel>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
          <thead>
            <tr>
              {data.headers.map((h, i) => (
                <th key={i} style={{ padding: '2px 4px', minWidth: 100 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <input value={h} onChange={(e) => setHeader(i, e.target.value)} style={{ ...cell, fontWeight: 700 }} placeholder={`Header ${i + 1}`} />
                    {data.headers.length > 1 && (
                      <button onClick={() => removeCol(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A564C', fontSize: 14, padding: '0 2px' }} title="Remove column">✕</button>
                    )}
                  </div>
                </th>
              ))}
              <th><button onClick={addCol} style={{ background: 'none', border: '1px dashed #C4AB77', borderRadius: 3, cursor: 'pointer', color: '#C4AB77', fontSize: 11, padding: '2px 6px' }}>+ Col</button></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell_val, ci) => (
                  <td key={ci} style={{ padding: '2px 4px' }}>
                    <input value={cell_val} onChange={(e) => setCell(ri, ci, e.target.value)} style={cell} placeholder="—" />
                  </td>
                ))}
                <td style={{ padding: '2px 4px' }}>
                  <button onClick={() => removeRow(ri)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A564C', fontSize: 12 }} title="Remove row">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} style={{ background: 'none', border: '1px dashed #C4AB77', borderRadius: 3, cursor: 'pointer', color: '#C4AB77', fontSize: 11, padding: '4px 10px', width: '100%' }}>+ Add row</button>
    </div>
  )
}

// ─── Block edit modal ────────────────────────────────────────────────────────

const MAX_FEATURED_PRODUCTS = 6

function BlockEditModal({ block, onSave, onClose, columnCount, products, currency }: {
  block: EditBlock
  onSave: (updated: EditBlock) => void
  onClose: () => void
  columnCount: number
  products: ProductSummary[]
  currency: string
}) {
  const [type, setType] = useState<string>(block.blockType)
  const [column, setColumn] = useState(block.column)
  const [colSpan, setColSpan] = useState(block.colSpan ?? 1)

  // Simple text content
  const [text, setText] = useState(() => {
    // For JSON blocks, we'll have separate fields
    if (['image', 'cta'].includes(block.blockType)) return block.content
    return block.content
  })

  // Image-specific fields
  const imgData = parseJson<{ url: string; alt: string; caption: string; width: number; fit: string }>(block.blockType === 'image' ? block.content : '{}', { url: '', alt: '', caption: '', width: 100, fit: 'fit' })
  const [imgUrl, setImgUrl] = useState(imgData.url)
  const [imgAlt, setImgAlt] = useState(imgData.alt)
  const [imgCaption, setImgCaption] = useState(imgData.caption)
  const [imgWidth, setImgWidth] = useState(imgData.width ?? 100)
  const [imgFit, setImgFit] = useState(imgData.fit ?? 'fit')
  const [imgUploading, setImgUploading] = useState(false)
  const [imgUploadError, setImgUploadError] = useState('')

  async function handleImageUpload(file: File) {
    setImgUploading(true)
    setImgUploadError('')
    try {
      const presignRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Upload failed')

      await fetch(presignData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      setImgUrl(presignData.publicUrl)
    } catch (err) {
      setImgUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setImgUploading(false)
    }
  }

  // CTA-specific fields
  const ctaData = parseJson<{ text: string; url: string; style: string }>(block.blockType === 'cta' ? block.content : '{}', { text: 'Subscribe Now', url: '/pricing', style: 'dark' })
  const [ctaText, setCtaText] = useState(ctaData.text)
  const [ctaUrl, setCtaUrl] = useState(ctaData.url)
  const [ctaStyle, setCtaStyle] = useState(ctaData.style)

  // Ornament preset
  const [ornament, setOrnament] = useState(block.blockType === 'ornament' ? (block.content || '⸻ ✦ ⸻') : '⸻ ✦ ⸻')

  // Spacer height
  const [spacerHeight, setSpacerHeight] = useState(block.blockType === 'spacer' ? (parseInt(block.content) || 24) : 24)

  // Featured products fields
  const fpData = parseJson<{ heading: string; productIds: string[] }>(block.blockType === 'featured_products' ? block.content : '{}', { heading: 'Featured Products', productIds: [] })
  const [fpHeading, setFpHeading] = useState(fpData.heading)
  const [fpProductIds, setFpProductIds] = useState<string[]>(fpData.productIds)

  function toggleFeaturedProduct(id: string) {
    setFpProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= MAX_FEATURED_PRODUCTS) return prev
      return [...prev, id]
    })
  }

  function buildContent(): string {
    switch (type) {
      case 'image': return JSON.stringify({ url: imgUrl, alt: imgAlt, caption: imgCaption, width: imgWidth, fit: imgFit })
      case 'cta':   return JSON.stringify({ text: ctaText, url: ctaUrl, style: ctaStyle })
      case 'ornament': return ornament
      case 'spacer': return String(spacerHeight)
      case 'featured_products': return JSON.stringify({ heading: fpHeading, productIds: fpProductIds })
      default: return text
    }
  }

  function handleSave() {
    onSave({ ...block, blockType: type, content: buildContent(), column, colSpan })
    onClose()
  }

  const typeDef = BLOCK_TYPES.find((t) => t.value === type)

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ backgroundColor: '#faf9f4', border: '1px solid #c8c4a8', borderRadius: '8px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ backgroundColor: '#35291C', color: '#E8E6D8', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '16px' }}>{typeDef?.icon}</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, flex: 1 }}>
            {block.id.startsWith('new-') ? 'Add' : 'Edit'} — {typeDef?.label}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#b8b090', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px' }}>✕</button>
        </div>

        {/* Gold rule */}
        <div style={{ height: '2px', background: 'linear-gradient(to right, #35291C, #C4AB77, #35291C)', flexShrink: 0 }} />

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Type selector + column */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Block type</FieldLabel>
              <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
                {Array.from(new Set(BLOCK_TYPES.map((t) => t.group))).map((group) => (
                  <optgroup key={group} label={group}>
                    {BLOCK_TYPES.filter((t) => t.group === group).map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {columnCount > 1 && (
              <div style={{ width: '100px' }}>
                <FieldLabel>Column</FieldLabel>
                <select value={column} onChange={(e) => setColumn(Number(e.target.value))} style={selectStyle}>
                  {Array.from({ length: columnCount }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>Column {c}</option>
                  ))}
                </select>
              </div>
            )}
            {columnCount > 1 && !['rule', 'spacer'].includes(type) && (
              <div style={{ width: '110px' }}>
                <FieldLabel>Span</FieldLabel>
                <select value={colSpan} onChange={(e) => setColSpan(Number(e.target.value))} style={selectStyle}>
                  {Array.from({ length: columnCount }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n === 1 ? 'Normal' : `${n} columns`}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Type description */}
          {typeDef?.description && (
            <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#C4AB77', fontStyle: 'italic' }}>
              {typeDef.description}
            </p>
          )}

          {colSpan > 1 && (
            <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7A564C', backgroundColor: '#f5efe3', border: '1px solid #e8dcc4', borderRadius: '4px', padding: '6px 10px' }}>
              This block will break out of column {column}'s flow and span {colSpan} columns wide. Columns resume stacking independently below it.
            </p>
          )}

          {/* ── TEXT BLOCKS ── */}
          {['headline', 'subheadline', 'byline', 'dateline', 'section_label', 'advertisement'].includes(type) && (
            <div>
              <FieldLabel>Text</FieldLabel>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter') handleSave() }}
                autoFocus
                placeholder={BLOCK_TYPES.find((t) => t.value === type)?.description ?? ''}
                style={{ ...inputStyle, fontFamily: type === 'headline' || type === 'subheadline' ? "'Playfair Display', serif" : "'Libre Baskerville', serif", fontSize: type === 'headline' ? '15px' : '13px' }}
              />
            </div>
          )}

          {/* ── BODY TEXT ── */}
          {type === 'body' && (
            <div>
              <FieldLabel>Body text</FieldLabel>
              <RichTextEditor
                value={text}
                onChange={setText}
                placeholder="Write your article text here…"
                minHeight={200}
              />
              <HelpText>Formatting is applied with the toolbar above.</HelpText>
            </div>
          )}

          {/* ── PULL QUOTE ── */}
          {type === 'pullquote' && (
            <div>
              <FieldLabel>Quote text</FieldLabel>
              <RichTextEditor
                value={text}
                onChange={setText}
                placeholder="A memorable quote or excerpt from the article…"
                minHeight={80}
              />
            </div>
          )}

          {/* ── IMAGE ── */}
          {type === 'image' && (
            <>
              <div>
                <FieldLabel>Image</FieldLabel>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', backgroundColor: '#1a0a00', color: '#f9f0dc', borderRadius: 4, fontSize: 12, cursor: imgUploading ? 'not-allowed' : 'pointer', opacity: imgUploading ? 0.6 : 1, fontFamily: 'Inter, sans-serif' }}>
                    {imgUploading ? 'Uploading…' : '⬆ Upload file'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={imgUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }} />
                  </label>
                  <span style={{ color: '#8b9090', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>or paste a URL below</span>
                </div>
                {imgUploadError && <p style={{ color: '#c0392b', fontSize: 11, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{imgUploadError}</p>}
                <input type="url" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="https://example.com/image.jpg" style={inputStyle} />
                {imgUrl && (
                  <div style={{ marginTop: 8, height: 160, border: '1px solid #c8c4a8', borderRadius: 4, overflow: 'hidden', textAlign: 'center', backgroundColor: '#f0ece0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt="preview"
                      style={
                        imgFit === 'fit'
                          ? { width: `${imgWidth}%`, maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }
                          : { width: '100%', height: '100%', objectFit: imgFit === 'stretch' ? 'fill' : 'cover' }
                      }
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
              </div>
              <div>
                <FieldLabel>Alt text <span style={{ color: '#b8b090', fontWeight: 400 }}>(describes the image for accessibility)</span></FieldLabel>
                <input type="text" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} placeholder="A steaming cup of morning coffee" style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Caption <span style={{ color: '#b8b090', fontWeight: 400 }}>(optional, shown below the image)</span></FieldLabel>
                <input type="text" value={imgCaption} onChange={(e) => setImgCaption(e.target.value)} placeholder="The Gazette's recommended morning blend" style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Fit</FieldLabel>
                <select value={imgFit} onChange={(e) => setImgFit(e.target.value)} style={selectStyle}>
                  <option value="fit">Fit — scale down, no cropping (may leave space around it)</option>
                  <option value="cover">Fill — crop to fill the block completely, no gaps</option>
                  <option value="stretch">Stretch — fill exactly, may distort the image</option>
                </select>
                <HelpText>
                  {imgFit === 'fit'
                    ? 'Shrinks the image within its column or span — it stays centered.'
                    : 'Expands the image to fill its column or span with no empty space. Works best when this image is the only block there.'}
                </HelpText>
              </div>
              {imgFit === 'fit' && (
                <div>
                  <FieldLabel>Size <span style={{ color: '#b8b090', fontWeight: 400 }}>({imgWidth}% of column width)</span></FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={imgWidth}
                      onChange={(e) => setImgWidth(Number(e.target.value))}
                      style={{ flex: 1, accentColor: '#7A564C' }}
                    />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#4B4C44', width: 36, textAlign: 'right' }}>{imgWidth}%</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── CTA ── */}
          {type === 'cta' && (
            <>
              <div>
                <FieldLabel>Button text</FieldLabel>
                <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Subscribe Now" style={inputStyle} autoFocus />
              </div>
              <div>
                <FieldLabel>Link URL <span style={{ color: '#b8b090', fontWeight: 400 }}>(page path or full URL)</span></FieldLabel>
                <input type="text" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="/pricing" style={inputStyle} />
              </div>
              <div>
                <FieldLabel>Button style</FieldLabel>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ value: 'dark', label: 'Dark (filled)' }, { value: 'light', label: 'Light (filled)' }, { value: 'outline', label: 'Outline' }].map((s) => (
                    <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#35291C' }}>
                      <input type="radio" name="ctaStyle" value={s.value} checked={ctaStyle === s.value} onChange={() => setCtaStyle(s.value)} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── ORNAMENT ── */}
          {type === 'ornament' && (
            <div>
              <FieldLabel>Ornament symbol</FieldLabel>
              <input type="text" value={ornament} onChange={(e) => setOrnament(e.target.value)} style={{ ...inputStyle, fontFamily: "'Libre Baskerville', serif", fontSize: '18px', textAlign: 'center', letterSpacing: '0.2em' }} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {ORNAMENT_PRESETS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setOrnament(o)}
                    style={{ padding: '4px 10px', fontFamily: "'Libre Baskerville', serif", fontSize: '14px', border: `1px solid ${ornament === o ? '#C4AB77' : '#c8c4a8'}`, borderRadius: '4px', cursor: 'pointer', backgroundColor: ornament === o ? 'rgba(139,105,20,0.1)' : 'white', color: '#35291C' }}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SPACER ── */}
          {type === 'spacer' && (
            <div>
              <FieldLabel>Height (px)</FieldLabel>
              <input type="number" value={spacerHeight} onChange={(e) => setSpacerHeight(Number(e.target.value))} min={8} max={200} step={4} style={{ ...inputStyle, width: '120px' }} />
              <HelpText>Sets the amount of vertical blank space between blocks.</HelpText>
            </div>
          )}

          {/* ── VIDEO ── */}
          {type === 'video' && (
            <div>
              <FieldLabel>Video URL <span style={{ color: '#C4AB77', fontWeight: 400 }}>— YouTube or Vimeo</span></FieldLabel>
              <input type="url" value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
              <HelpText>Paste a YouTube or Vimeo watch link. The embed will be created automatically.</HelpText>
              {text && (() => {
                const embed = getVideoEmbedUrl(text)
                return embed ? (
                  <div style={{ marginTop: 10, position: 'relative', paddingBottom: '56.25%', height: 0, border: '1px solid #c8c4a8', borderRadius: 4, overflow: 'hidden' }}>
                    <iframe src={embed} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} title="Preview" allowFullScreen />
                  </div>
                ) : (
                  <p style={{ margin: '6px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#7A564C' }}>⚠ Could not recognise URL — paste a YouTube or Vimeo link</p>
                )
              })()}
            </div>
          )}

          {/* ── TABLE ── */}
          {type === 'table' && <TableEditor value={text} onChange={setText} />}

          {/* ── FEATURED PRODUCTS ── */}
          {type === 'featured_products' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <FieldLabel>Heading</FieldLabel>
                <input
                  type="text"
                  value={fpHeading}
                  onChange={(e) => setFpHeading(e.target.value)}
                  placeholder="Featured Products"
                  style={inputStyle}
                />
                <HelpText>Shown above the products. Leave blank to hide.</HelpText>
              </div>
              <div>
                <FieldLabel>
                  Products
                  <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#C4AB77' }}>
                    — {fpProductIds.length} of {MAX_FEATURED_PRODUCTS} selected
                  </span>
                </FieldLabel>
                {products.length === 0 ? (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#7A564C', margin: 0 }}>
                    No products in your shop yet. Add some under Store → Products first.
                  </p>
                ) : (
                  <div style={{ border: '1px solid #c8c4a8', borderRadius: '5px', maxHeight: '220px', overflowY: 'auto', backgroundColor: 'white' }}>
                    {products.map((p) => {
                      const checked = fpProductIds.includes(p.id)
                      const disabled = !checked && fpProductIds.length >= MAX_FEATURED_PRODUCTS
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px',
                            borderBottom: '1px solid #f0ede0', cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.45 : 1, fontFamily: 'Inter, sans-serif', fontSize: '12px',
                          }}
                        >
                          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleFeaturedProduct(p.id)} />
                          <span style={{ flex: 1, color: '#35291C' }}>{p.name}</span>
                          <span style={{ color: '#7A564C' }}>{formatPrice(p.priceInCents, currency)}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
                <HelpText>Pick 5–6 for a full-width row. Combine with the "Span" setting above so they stretch across the page.</HelpText>
              </div>
            </div>
          )}

          {/* ── HTML ── */}
          {type === 'html' && (
            <div>
              <FieldLabel>
                Custom HTML
                <span style={{ marginLeft: 6, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#7A564C' }}>
                  — use with care. Unsanitised HTML.
                </span>
              </FieldLabel>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                autoFocus
                placeholder={'<iframe src="..." />\n<!-- or any HTML -->'}
                onKeyDown={(e) => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && e.metaKey) handleSave() }}
                style={{ ...textareaStyle, fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}
              />
              <HelpText>Good for iframes, custom embeds, or advanced HTML. ⌘+Enter to save.</HelpText>
            </div>
          )}

          {/* ── RULE / no content ── */}
          {type === 'rule' && (
            <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#C4AB77', fontStyle: 'italic' }}>
              A triple rule will be inserted — no content needed.
            </p>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e8e4d0', display: 'flex', gap: '8px', justifyContent: 'flex-end', backgroundColor: '#f5f2e8', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, background: 'none', border: '1px solid #c8c4a8', borderRadius: '5px', cursor: 'pointer', color: '#4B4C44' }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ padding: '7px 16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, backgroundColor: '#C4AB77', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {block.id.startsWith('new-') ? 'Add block' : 'Save changes'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}

// ─── Tiny style helpers ──────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', border: '1px solid #c8c4a8', borderRadius: '5px', backgroundColor: 'white', boxSizing: 'border-box' }
const textareaStyle: React.CSSProperties = { ...inputStyle, resize: 'vertical' }
const selectStyle: React.CSSProperties = { ...inputStyle }

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#4B4C44', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '5px' }}>
      {children}
    </label>
  )
}
function HelpText({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#b8b090', marginTop: '3px' }}>{children}</div>
}

// ─── Column layout config ────────────────────────────────────────────────────

const LAYOUT_GRIDS: Record<string, string> = {
  'columns-1':   '1fr',
  'columns-2':   '1fr 1fr',
  'columns-3':   '1fr 1fr 1fr',
  'columns-2-1': '1.5fr 1.5fr 1fr',
  'columns-1-2': '1fr 1.5fr 1.5fr',
}

const LAYOUT_COL_NAMES: Record<string, string[]> = {
  'columns-1':   ['Content'],
  'columns-2':   ['Left column', 'Right column'],
  'columns-3':   ['Left', 'Centre', 'Right'],
  'columns-2-1': ['Main left', 'Main right', 'Sidebar'],
  'columns-1-2': ['Sidebar', 'Main left', 'Main right'],
}

// ─── Droppable column zone ────────────────────────────────────────────────────

function DroppableColumn({ dropId, col, colName, showLabel = true, isOver, children }: {
  dropId: string
  col: number
  colName: string
  showLabel?: boolean
  isOver: boolean
  children: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: dropId })
  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `${col} / span 1`,
        gridRow: 1,
        minHeight: '80px',
        borderRadius: '3px',
        outline: isOver ? '2px solid #C4AB77' : '2px solid transparent',
        backgroundColor: isOver ? 'rgba(139,105,20,0.04)' : 'transparent',
        transition: 'outline-color 0.12s, background-color 0.12s',
        position: 'relative',
      }}
    >
      {/* Column label — only visible in edit mode, on the first segment of this column */}
      {showLabel && (
        <div style={{
          fontSize: '9px', fontFamily: 'Inter, sans-serif', fontWeight: 700,
          color: '#C4AB77', textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '6px', paddingBottom: '4px',
          borderBottom: '1px solid rgba(139,105,20,0.25)',
        }}>
          {colName}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Visual sortable block (renders actual Victorian content) ─────────────────

function VisualSortableBlock({ block, products, currency, onEdit, onDelete, onDuplicate, onToggleVisible }: {
  block: EditBlock
  products: ProductSummary[]
  currency: string
  onEdit: (block: EditBlock) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onToggleVisible: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const [hovered, setHovered] = useState(false)
  const typeDef = BLOCK_TYPES.find((t) => t.value === block.blockType)
  const isFillImage = block.blockType === 'image' && (parseJson<{ fit?: string }>(block.content, {}).fit ?? 'fit') !== 'fit'

  return (
    <div
      ref={setNodeRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : block.visible ? 1 : 0.35,
        position: 'relative',
        height: isFillImage ? '100%' : undefined,
        marginBottom: '2px',
        borderRadius: '2px',
        paddingTop: (block.colSpan ?? 1) > 1 ? '20px' : undefined,
        outline: hovered && !isDragging ? '2px solid rgba(139,105,20,0.5)' : (block.colSpan ?? 1) > 1 ? '1px dashed rgba(122,86,76,0.5)' : '2px solid transparent',
        outlineOffset: '1px',
      }}
    >
      {/* Spans indicator */}
      {(block.colSpan ?? 1) > 1 && (
        <div style={{
          position: 'absolute', top: '3px', left: '3px', zIndex: 15,
          backgroundColor: 'rgba(122,86,76,0.9)', color: '#E8E6D8',
          fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700,
          padding: '2px 6px', borderRadius: '3px', pointerEvents: 'none',
        }}>
          ↔ spans {block.colSpan}
        </div>
      )}

      {/* Actual Victorian content */}
      <StaticBlock block={block} products={products} currency={currency} />

      {/* Hover toolbar */}
      {hovered && !isDragging && (
        <div style={{
          position: 'absolute', top: 0, right: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: '1px',
          backgroundColor: 'rgba(26,16,8,0.88)',
          borderRadius: '0 0 0 5px',
          padding: '3px 4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          {/* Block type label */}
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: '#C4AB77', marginRight: '4px', whiteSpace: 'nowrap' }}>
            {typeDef?.icon} {typeDef?.label}
          </span>

          {/* Drag handle */}
          <button
            {...attributes} {...listeners}
            title="Drag to move"
            style={{ cursor: 'grab', background: 'none', border: 'none', padding: '3px', color: '#C4AB77', display: 'flex', touchAction: 'none' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="5" r="1.8"/><circle cx="15" cy="5" r="1.8"/>
              <circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/>
              <circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/>
            </svg>
          </button>

          <ToolbarBtn title="Edit content" onClick={() => onEdit(block)} color="#E8E6D8">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title="Duplicate" onClick={() => onDuplicate(block.id)} color="#C4AB77">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </ToolbarBtn>
          <ToolbarBtn title={block.visible ? 'Hide block' : 'Show block'} onClick={() => onToggleVisible(block.id)} color={block.visible ? '#C4AB77' : '#7A564C'}>
            {block.visible
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            }
          </ToolbarBtn>
          <ToolbarBtn title="Delete block" onClick={() => onDelete(block.id)} color="#c0504d">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </ToolbarBtn>
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({ title, onClick, color, children }: { title: string; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      title={title} onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.15)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ─── Visual edit panel ────────────────────────────────────────────────────────

function EditablePanel({ pageId, columnCount, layout, products, currency }: { pageId: string; columnCount: number; layout: string; products: ProductSummary[]; currency: string }) {
  const ctx = useContext(CmsEditContext)!
  const blocks = ctx.getPageBlocks(pageId)
  const [editingBlock, setEditingBlock] = useState<EditBlock | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const gridTemplate = LAYOUT_GRIDS[layout] ?? `repeat(${columnCount}, 1fr)`
  const colNames = LAYOUT_COL_NAMES[layout] ?? Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`)

  // The blocks array's own order is the single source of truth for both each column's
  // relative order AND the page's overall reading sequence (which is what decides where
  // a spanning block breaks the column flow). blockOrder is only ever recomputed, from
  // this array order, at save time — nothing here reads its value.
  function getColBlocks(col: number) {
    return blocks.filter((b) => b.column === col)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragOver({ over }: { over: { id: string | number } | null }) {
    setOverId(over ? (over.id as string) : null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)
    if (!over) return

    const activeIdx = blocks.findIndex((b) => b.id === active.id)
    if (activeIdx === -1) return
    const activeBlock = blocks[activeIdx]

    const overRawId = over.id as string
    const colMatch = overRawId.match(/^drop-col-(\d+)-\d+$/)

    if (colMatch) {
      // Dropped on an empty segment/column, not on another block — move to the end
      // of that column's blocks (or the end of the page if the column has none yet).
      const targetCol = parseInt(colMatch[1])
      const without = blocks.filter((_, i) => i !== activeIdx)
      let insertAt = without.length
      for (let i = without.length - 1; i >= 0; i--) {
        if (without[i].column === targetCol) { insertAt = i + 1; break }
      }
      const next = [...without.slice(0, insertAt), { ...activeBlock, column: targetCol }, ...without.slice(insertAt)]
      ctx.setPageBlocks(pageId, next)
      return
    }

    const overIdx = blocks.findIndex((b) => b.id === overRawId)
    if (overIdx === -1 || overIdx === activeIdx) return
    const overBlock = blocks[overIdx]

    const withUpdatedColumn = activeBlock.column === overBlock.column
      ? blocks
      : blocks.map((b, i) => (i === activeIdx ? { ...b, column: overBlock.column } : b))

    ctx.setPageBlocks(pageId, arrayMove(withUpdatedColumn, activeIdx, overIdx))
  }

  const handleEditSave = useCallback((updated: EditBlock) => {
    ctx.setPageBlocks(pageId, blocks.map((b) => (b.id === updated.id ? updated : b)))
  }, [blocks, ctx, pageId])

  function handleDelete(id: string) {
    if (!confirm('Delete this block?')) return
    ctx.setPageBlocks(pageId, blocks.filter((b) => b.id !== id))
  }

  function handleDuplicate(id: string) {
    const idx = blocks.findIndex((b) => b.id === id)
    if (idx === -1) return
    const copy: EditBlock = { ...blocks[idx], id: `new-${Date.now()}` }
    const next = [...blocks]
    next.splice(idx + 1, 0, copy)
    ctx.setPageBlocks(pageId, next)
  }

  function handleAdd(type: string, col: number) {
    const nb: EditBlock = {
      id: `new-${Date.now()}`,
      blockType: type, content: '',
      column: col, colSpan: 1, visible: true,
      blockOrder: 0,
    }
    let insertAt = blocks.length
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].column === col) { insertAt = i + 1; break }
    }
    ctx.setPageBlocks(pageId, [...blocks.slice(0, insertAt), nb, ...blocks.slice(insertAt)])
    setEditingBlock(nb)
  }

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null

  // Same row-grouping the published page uses, so what you see while editing is
  // exactly what you'll see once saved — a spanning block shares its row with normal
  // blocks in the columns it doesn't cover, not just show a badge.
  const rows = groupBlocksIntoRows(blocks, columnCount)
  const lastRowIndex = rows.length - 1

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver as never}
        onDragEnd={handleDragEnd}
      >
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'grid', gridTemplateColumns: gridTemplate, gap: '0 12px', marginBottom: row.spans.length > 0 ? '8px' : undefined }}>
            {row.spans.map(({ block, startCol, span }) => (
              <div key={block.id} style={{ gridColumn: `${startCol} / span ${span}`, gridRow: 1 }}>
                <SortableContext items={[block.id]} strategy={verticalListSortingStrategy}>
                  <VisualSortableBlock
                    block={block}
                    products={products}
                    currency={currency}
                    onEdit={setEditingBlock}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onToggleVisible={(id) =>
                      ctx.setPageBlocks(pageId, blocks.map((b) => b.id === id ? { ...b, visible: !b.visible } : b))
                    }
                  />
                </SortableContext>
              </div>
            ))}
            {row.columns.map((colBlocks, ci) => {
              const col = ci + 1
              const spanClaimed = row.spans.some((s) => col >= s.startCol && col < s.startCol + s.span)
              if (spanClaimed) return null
              const dropId = `drop-col-${col}-${ri}`
              return (
                <DroppableColumn
                  key={col}
                  dropId={dropId}
                  col={col}
                  colName={colNames[ci] ?? `Column ${col}`}
                  showLabel={ri === 0}
                  isOver={overId === dropId}
                >
                  <SortableContext items={colBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    {colBlocks.length === 0 && !activeId && (
                      <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: "'Libre Baskerville', serif", color: 'rgba(139,105,20,0.5)', fontStyle: 'italic', fontSize: '12px', borderRadius: '2px', border: '1px dashed rgba(139,105,20,0.3)' }}>
                        Drop blocks here
                      </div>
                    )}
                    {colBlocks.map((block) => (
                      <VisualSortableBlock
                        key={block.id}
                        block={block}
                        products={products}
                        currency={currency}
                        onEdit={setEditingBlock}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                        onToggleVisible={(id) =>
                          ctx.setPageBlocks(pageId, blocks.map((b) => b.id === id ? { ...b, visible: !b.visible } : b))
                        }
                      />
                    ))}
                  </SortableContext>
                  {ri === lastRowIndex && <AddBlockButton onAdd={(type) => handleAdd(type, col)} />}
                </DroppableColumn>
              )
            })}
          </div>
        ))}

        {/* Drag overlay — shows block content while dragging */}
        <DragOverlay>
          {activeBlock && (
            <div style={{
              opacity: 0.85,
              transform: 'rotate(0.8deg)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.45)',
              backgroundColor: 'var(--paper, #faf9f4)',
              border: '2px solid #C4AB77',
              borderRadius: '2px',
              padding: '6px 8px',
              cursor: 'grabbing',
            }}>
              <StaticBlock block={activeBlock} products={products} currency={currency} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          onSave={handleEditSave}
          onClose={() => setEditingBlock(null)}
          columnCount={columnCount}
          products={products}
          currency={currency}
        />
      )}
    </>
  )
}

// ─── Public CmsBlockArea ─────────────────────────────────────────────────────

interface Props {
  pageId: string
  initialBlocks: EditBlock[]
  columnCount: number
  layout: string
  isPlaceholder: boolean
  products?: ProductSummary[]
  currency?: string
}

export function CmsBlockArea({ pageId, initialBlocks, columnCount, layout, isPlaceholder, products = [], currency = 'USD' }: Props) {
  const ctx = useContext(CmsEditContext)
  const isEditMode = ctx?.isEditMode ?? false
  const isCurrentPage = ctx?.currentPageId === pageId

  if (!isEditMode || !isCurrentPage) {
    if (isPlaceholder) {
      return (
        <p className="body-text" style={{ textAlign: 'center', color: 'var(--ink-faded)', fontStyle: 'italic' }}>
          This page is ready for content. Click <strong>Edit pages</strong> to start adding articles.
        </p>
      )
    }
    return <StaticBlocks blocks={initialBlocks} columnCount={columnCount} products={products} currency={currency} />
  }

  // Edit mode — render the visual in-place editor (no dark overlay, blocks look as published)
  return <EditablePanel pageId={pageId} columnCount={columnCount} layout={layout} products={products} currency={currency} />
}
