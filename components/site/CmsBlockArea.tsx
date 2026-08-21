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
  { value: 'account_widget',    group: 'Commerce', label: 'Account',           description: 'Sign in/sign up prompt for guests, or a profile summary with quick links for logged-in visitors', icon: '◈' },
  // Layout
  { value: 'steps',        group: 'Layout',     label: 'Steps / Features',description: 'A centered title with repeatable image + title + text points — for "How it works" or "Choose your plan" style sections', icon: '⚏' },
  { value: 'social_links', group: 'Layout',     label: 'Social links',    description: 'Row of clickable icon links to your social media profiles', icon: '🔗' },
  { value: 'section_label',group: 'Layout',     label: 'Section label',   description: 'Bold section heading with decorative rule', icon: '§' },
  { value: 'rule',         group: 'Layout',     label: 'Rule / divider',  description: 'Ornamental horizontal dividing rule', icon: '—' },
  { value: 'ornament',     group: 'Layout',     label: 'Ornament',        description: 'Decorative Victorian symbol or dingbat', icon: '❧' },
  { value: 'spacer',       group: 'Layout',     label: 'Spacer',          description: 'Blank space to fill a gap — place in one column, or set Span to blank out a wider band', icon: '↕' },
  { value: 'blank',        group: 'Layout',     label: 'Blank block',     description: 'An empty panel with optional background colour and border — a canvas to layer overlay blocks on top of', icon: '▭' },
  // Advanced
  { value: 'html',         group: 'Advanced',   label: 'Custom HTML',     description: 'Raw HTML — embeds, iframes, custom code', icon: '</>' },
] as const

export type BlockType = typeof BLOCK_TYPES[number]['value']

export interface ProductSummary {
  id: string
  slug: string
  name: string
  priceInCents: number
  images?: string | null
}

/** First image URL from a product's `images` JSON field, if any. */
function firstProductImage(images?: string | null): string | null {
  if (!images) return null
  try {
    const arr = JSON.parse(images)
    return Array.isArray(arr) && typeof arr[0] === 'string' ? arr[0] : null
  } catch {
    return null
  }
}

export interface CurrentUser {
  name: string | null
  email: string
  planName: string | null
}

const ORNAMENT_PRESETS = [
  '❧ ✦ ❧', '⸻ ✦ ⸻', '✦ ✦ ✦', '❦', '☙ ❧', '◈', '⁂', '✤', '❊', '⁕ ⁕ ⁕',
]

export const FP_IMAGE_SIZES = [
  { value: 'small',  label: 'Small' },
  { value: 'medium', label: 'Medium (default)' },
  { value: 'large',  label: 'Large' },
] as const

// "medium" (undefined) leaves the tile's width uncapped — each product still
// gets an equal share of the row exactly as it always has.
const FP_IMAGE_MAXWIDTH: Record<string, string | undefined> = {
  small: '130px',
  medium: undefined,
  large: '260px',
}

export const STEPS_SIZES = [
  { value: 'small',  label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
] as const

const STEPS_SIZE_SCALE: Record<string, { icon: number; title: string; text: string; titleGap: string }> = {
  small:  { icon: 54,  title: '0.75em', text: '0.7em',  titleGap: '3px' },
  medium: { icon: 76,  title: '0.85em', text: '0.8em',  titleGap: '4px' },
  large:  { icon: 104, title: '1.05em', text: '0.9em',  titleGap: '5px' },
}

export const ALIGN_OPTIONS = [
  { value: 'left',   label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right',  label: 'Right' },
] as const

// ─── Widget background (transparent / solid colour + opacity) ────────────────

export const BG_STYLE_OPTIONS = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'color',       label: 'Solid colour' },
] as const

export interface WidgetBackground {
  style?: string
  color?: string
  opacity?: number
}

function hexToRgba(hex: string, opacity: number): string {
  const h = (hex || '#000000').replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.slice(0, 2), 16) || 0
  const g = parseInt(full.slice(2, 4), 16) || 0
  const b = parseInt(full.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/** Background colour + a little breathing-room padding, only when a widget's
 * background is explicitly set to a solid colour — transparent (the default)
 * adds nothing, so unedited widgets look exactly as they always have. */
function widgetBackgroundStyle(bg?: WidgetBackground): React.CSSProperties {
  if (!bg || bg.style !== 'color' || !bg.color) return {}
  return {
    backgroundColor: hexToRgba(bg.color, bg.opacity ?? 1),
    padding: '14px',
    borderRadius: '4px',
  }
}

export const BUTTON_SIZES = [
  { value: 'small',  label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
] as const

const BUTTON_SIZE_SCALE: Record<string, { padding: string; fontSize: string }> = {
  small:  { padding: '5px 14px',  fontSize: '0.68em' },
  medium: { padding: '8px 20px',  fontSize: '0.8em' },
  large:  { padding: '12px 30px', fontSize: '0.95em' },
}

function ctaButtonStyle(style: string, size: string): React.CSSProperties {
  const s = BUTTON_SIZE_SCALE[size] ?? BUTTON_SIZE_SCALE.medium
  return {
    display: 'inline-block', padding: s.padding,
    backgroundColor: style === 'outline' ? 'transparent' : 'var(--ink)',
    color: style === 'outline' ? 'var(--ink)' : 'var(--paper)',
    border: '1px solid var(--ink)', textDecoration: 'none',
    fontFamily: 'var(--font-headline)', fontSize: s.fontSize, letterSpacing: '0.08em',
  }
}

function parseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T } catch { return fallback }
}

// ─── Text block sizing / alignment ───────────────────────────────────────────
// Headline, subheadline, byline, dateline, body, pull quote, advertisement, and
// section label all share the same size/align mechanism. Content is stored as
// JSON ({ text, align, size }) going forward, but parseTextContent falls back
// to treating the raw string as plain legacy text when it isn't valid JSON —
// so existing unedited blocks keep rendering exactly as they did before.

const TEXT_STYLED_TYPES = ['headline', 'subheadline', 'byline', 'dateline', 'section_label', 'advertisement', 'pullquote', 'body']

export const TEXT_SIZES = [
  { value: '',       label: 'Default' },
  { value: 'small',  label: 'Small' },
  { value: 'large',  label: 'Large' },
  { value: 'xlarge', label: 'X-Large' },
] as const

export const TEXT_ALIGN_OPTIONS = [
  { value: '',       label: 'Default' },
  { value: 'left',   label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right',  label: 'Right' },
] as const

const TEXT_SIZE_PX: Record<string, Record<string, string>> = {
  headline:      { small: '0.85rem', large: '1.5rem',  xlarge: '2rem' },
  subheadline:   { small: '0.68rem', large: '1.05rem', xlarge: '1.35rem' },
  byline:        { small: '0.65rem', large: '1rem',    xlarge: '1.25rem' },
  dateline:      { small: '0.62rem', large: '0.95rem', xlarge: '1.2rem' },
  body:          { small: '0.5rem',  large: '0.9rem',  xlarge: '1.15rem' },
  pullquote:     { small: '0.68rem', large: '1.15rem', xlarge: '1.5rem' },
  advertisement: { small: '0.65rem', large: '1rem',    xlarge: '1.3rem' },
  section_label: { small: '0.46rem', large: '0.85rem', xlarge: '1.1rem' },
}

function textStyleOverrides(kind: string, size: string, align: string): React.CSSProperties {
  const style: React.CSSProperties = {}
  if (align) style.textAlign = align as React.CSSProperties['textAlign']
  if (size && TEXT_SIZE_PX[kind]?.[size]) style.fontSize = TEXT_SIZE_PX[kind][size]
  return style
}

function parseTextContent(raw: string): { text: string; align: string; size: string } {
  if (raw) {
    try {
      const obj = JSON.parse(raw)
      if (obj && typeof obj === 'object' && typeof obj.text === 'string') {
        return { text: obj.text, align: obj.align ?? '', size: obj.size ?? '' }
      }
    } catch { /* legacy plain-string content — fall through */ }
  }
  return { text: raw ?? '', align: '', size: '' }
}

// ─── Social links widget ─────────────────────────────────────────────────────

export const SOCIAL_PLATFORMS = [
  { key: 'twitter',   label: 'X / Twitter' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook',  label: 'Facebook' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'linkedin',  label: 'LinkedIn' },
] as const

const SOCIAL_SIZE_SCALE: Record<string, { box: string; icon: string }> = {
  small:  { box: '26px', icon: '13px' },
  medium: { box: '34px', icon: '17px' },
  large:  { box: '44px', icon: '22px' },
}

const SOCIAL_ICON_PATHS: Record<string, React.ReactNode> = {
  twitter: <path d="M4 4l16 16M20 4L4 20" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: <path d="M14 9h3V5.5h-3c-2.2 0-4 1.8-4 4V11H7v3.5h3V21h3.5v-6.5H16l.6-3.5h-3.1V9.6c0-.4.3-.6.6-.6z" fill="currentColor" stroke="none" />,
  youtube: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="3" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: <path d="M14 3v10.2a2.6 2.6 0 1 1-2-2.53V8.6a5 5 0 1 0 4.5 4.97V9.8a6 6 0 0 0 3.5 1.1V8.4a3.6 3.6 0 0 1-2.5-1V3z" fill="currentColor" stroke="none" />,
  pinterest: <path d="M12 2a10 10 0 0 0-3.6 19.3c0-.8 0-1.8.2-2.6l1.4-6s-.3-.7-.3-1.7c0-1.6.9-2.8 2.1-2.8 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.1 1.8 2.1 2.1 0 3.7-2.2 3.7-5.4 0-2.8-2-4.8-4.9-4.8-3.3 0-5.3 2.5-5.3 5.1 0 1 .4 2.1.9 2.6.1.1.1.2.1.3l-.3 1.4c0 .2-.2.3-.4.2-1.4-.6-2.3-2.6-2.3-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.8-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2z" fill="currentColor" stroke="none" />,
  linkedin: <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3a1.96 1.96 0 1 0 0 3.92A1.96 1.96 0 0 0 5.25 3zM20.45 20h-3.37v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.68V8.5h3.24v1.57h.05c.45-.85 1.55-1.75 3.2-1.75 3.42 0 4.05 2.25 4.05 5.18V20z" fill="currentColor" stroke="none" />,
}

function SocialIcon({ platform, size }: { platform: string; size: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {SOCIAL_ICON_PATHS[platform]}
    </svg>
  )
}

function SocialLinksWidget({ data }: { data: { align?: string; size?: string; style?: string; links?: Record<string, string>; background?: WidgetBackground } }) {
  const align = data.align || 'center'
  const scale = SOCIAL_SIZE_SCALE[data.size ?? 'medium'] ?? SOCIAL_SIZE_SCALE.medium
  const outline = (data.style ?? 'outline') === 'outline'
  const entries = SOCIAL_PLATFORMS.filter((p) => data.links?.[p.key])
  if (entries.length === 0) return null
  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'
  return (
    <div style={{ display: 'flex', justifyContent: justify, gap: '10px', margin: '0.5em 0', ...widgetBackgroundStyle(data.background) }}>
      {entries.map((p) => (
        <a
          key={p.key}
          href={data.links![p.key]}
          target="_blank"
          rel="noopener noreferrer"
          title={p.label}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: scale.box, height: scale.box, borderRadius: '50%', flexShrink: 0,
            border: outline ? '1.5px solid var(--ink)' : 'none',
            backgroundColor: outline ? 'transparent' : 'var(--ink)',
            color: outline ? 'var(--ink)' : 'var(--paper)',
          }}
        >
          <SocialIcon platform={p.key} size={scale.icon} />
        </a>
      ))}
    </div>
  )
}

/** Short human label for a block, used in the "overlay on" target picker. */
function blockLabel(b: EditBlock): string {
  const typeDef = BLOCK_TYPES.find((t) => t.value === b.blockType)
  const name = typeDef?.label ?? b.blockType
  if (b.blockType === 'image') {
    const d = parseJson<{ alt?: string }>(b.content, {})
    return d.alt ? `${name} — "${d.alt}"` : name
  }
  let raw = b.content ?? ''
  try {
    const obj = JSON.parse(raw)
    if (obj && typeof obj === 'object') {
      if (typeof obj.text === 'string') raw = obj.text
      else if (typeof obj.title === 'string') raw = obj.title
    }
  } catch { /* plain string content */ }
  const snippet = raw.replace(/<[^>]+>/g, '').trim().slice(0, 30)
  return snippet ? `${name} — "${snippet}${snippet.length === 30 ? '…' : ''}"` : name
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

// ─── Static block renderer ───────────────────────────────────────────────────

export function StaticBlock({ block, products = [], currency = 'USD', currentUser = null }: { block: EditBlock; products?: ProductSummary[]; currency?: string; currentUser?: CurrentUser | null }) {
  const text = block.content ?? ''
  switch (block.blockType as BlockType) {
    case 'account_widget': {
      const d = parseJson<{ align?: string; background?: WidgetBackground }>(text, {})
      return <AccountWidget currentUser={currentUser} align={d.align ?? 'center'} background={d.background} />
    }
    case 'headline': {
      const d = parseTextContent(text)
      return (
        <div style={{
          fontFamily: 'var(--font-headline)', fontWeight: 900,
          fontSize: 'clamp(.72rem, 1.3vw, 1.05rem)', lineHeight: 1.15,
          color: 'var(--ink)', marginBottom: '0.5em',
          ...textStyleOverrides('headline', d.size, d.align),
        }}>{d.text}</div>
      )
    }
    case 'subheadline': {
      const d = parseTextContent(text)
      return (
        <div style={{
          fontFamily: 'var(--font-headline)', fontWeight: 700, fontStyle: 'italic',
          fontSize: '85%', marginBottom: '0.4em', color: 'var(--ink)',
          ...textStyleOverrides('subheadline', d.size, d.align),
        }}>{d.text}</div>
      )
    }
    case 'byline': {
      const d = parseTextContent(text)
      return (
        <div className="body-text" style={{
          marginBottom: '0.4em', fontStyle: 'italic', fontSize: '0.85em', color: 'var(--ink-faded)',
          ...textStyleOverrides('byline', d.size, d.align),
        }}>{d.text}</div>
      )
    }
    case 'dateline': {
      const d = parseTextContent(text)
      return (
        <div className="body-text" style={{
          marginBottom: '0.4em', textTransform: 'uppercase', letterSpacing: '0.05em',
          fontSize: '0.8em', fontWeight: 'bold',
          ...textStyleOverrides('dateline', d.size, d.align),
        }}>{d.text}</div>
      )
    }
    case 'body': {
      const d = parseTextContent(text)
      return <RichText as="div" className="body-text" style={{ marginBottom: '0.75em', ...textStyleOverrides('body', d.size, d.align) }} content={d.text} />
    }
    case 'pullquote': {
      const d = parseTextContent(text)
      return (
        <RichText
          as="blockquote"
          style={{
            margin: '0.75em 0', borderLeft: '3px solid var(--red)', paddingLeft: '14px',
            fontStyle: 'italic', fontSize: 'clamp(.68rem, 1.05vw, .88rem)', color: 'var(--ink-faded)',
            ...textStyleOverrides('pullquote', d.size, d.align),
          }}
          content={d.text}
        />
      )
    }
    case 'advertisement': {
      const d = parseTextContent(text)
      const bg = parseJson<{ background?: WidgetBackground }>(text, {}).background
      return (
        <div className="ad-block" style={{
          margin: '0.75em 0', textAlign: 'center', border: '1px solid var(--ink-faded)',
          padding: '8px', fontStyle: 'italic',
          ...textStyleOverrides('advertisement', d.size, d.align),
          ...widgetBackgroundStyle(bg),
        }}>
          {d.text}
        </div>
      )
    }
    case 'social_links': {
      const d = parseJson<{ align?: string; size?: string; style?: string; links?: Record<string, string>; background?: WidgetBackground }>(text, {})
      return <SocialLinksWidget data={d} />
    }
    case 'cta': {
      const d = parseJson<{ text: string; url: string; style: string; size?: string; align?: string; background?: WidgetBackground }>(text, { text: 'Subscribe Now', url: '/pricing', style: 'dark' })
      return (
        <div style={{ margin: '0.75em 0', textAlign: (d.align as React.CSSProperties['textAlign']) ?? 'center', ...widgetBackgroundStyle(d.background) }}>
          <a href={d.url} style={ctaButtonStyle(d.style, d.size ?? 'medium')}>
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
      const d = parseJson<{ heading: string; productIds: string[]; imageSize?: string; background?: WidgetBackground }>(text, { heading: '', productIds: [] })
      const items = d.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is ProductSummary => !!p)
      if (items.length === 0) return null
      // Each tile still gets an equal share of the row (unchanged default layout)
      // — a size choice only caps how big the photo+card is allowed to grow
      // *within* that share, centered, rather than reshaping the grid itself.
      const fpMaxWidth = FP_IMAGE_MAXWIDTH[d.imageSize ?? 'medium']
      return (
        <div style={{ margin: '0.75em 0', ...widgetBackgroundStyle(d.background) }}>
          {d.heading && <div className="section-label" style={{ marginBottom: '8px' }}>{d.heading}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '10px' }}>
            {items.map((p) => {
              const img = firstProductImage(p.images)
              return (
                <a
                  key={p.id}
                  href={`/shop/${p.slug}`}
                  style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none', color: 'inherit',
                    border: '1px solid var(--ink-faded)', borderRadius: '2px', padding: '10px 4px',
                    backgroundColor: 'rgba(255,255,255,0.4)',
                    maxWidth: fpMaxWidth, margin: fpMaxWidth ? '0 auto' : undefined,
                  }}
                >
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={img} alt={p.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '2px' }} />
                  ) : (
                    <div style={{ fontSize: '1.6em', lineHeight: 1 }}>☕</div>
                  )}
                  <div className="body-text" style={{ fontSize: '0.68em', fontWeight: 'bold', margin: '6px 0 2px', lineHeight: 1.25 }}>{p.name}</div>
                  <div style={{ fontSize: '0.65em', color: 'var(--red)' }}>{formatPrice(p.priceInCents, currency)}</div>
                </a>
              )
            })}
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
    case 'steps': {
      const d = parseJson<{ title: string; size?: string; align?: string; background?: WidgetBackground; items: { image: string; title: string; text: string; text2?: string; align?: string; buttonText?: string; buttonUrl?: string; buttonSize?: string }[] }>(text, { title: '', items: [] })
      if (!d.title && d.items.length === 0) return null
      const scale = STEPS_SIZE_SCALE[d.size ?? 'medium'] ?? STEPS_SIZE_SCALE.medium
      const align = d.align ?? 'center'
      const justify = align === 'left' ? 'start' : align === 'right' ? 'end' : 'center'
      return (
        <div style={{ margin: '1em 0', ...widgetBackgroundStyle(d.background) }}>
          {d.title && (
            <div style={{ textAlign: align as React.CSSProperties['textAlign'], marginBottom: '1em' }}>
              <span style={{
                fontFamily: 'var(--font-headline, "Playfair Display", serif)', fontWeight: 700,
                fontSize: '1.4em', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--red)',
                borderBottom: '2px solid var(--red)', paddingBottom: '5px', display: 'inline-block',
              }}>
                {d.title}
              </span>
            </div>
          )}
          {d.items.length > 0 && (
            // flexbox + wrap, not CSS grid — with an item count that doesn't evenly
            // divide the row (e.g. 4 items in a 3-wide row), grid's justifyItems only
            // centers each item within its own column track, leaving a leftover last
            // row pinned to the start instead of centered as a group. Flexbox's
            // justify-content centers each wrapped row correctly regardless.
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : 'center' }}>
              {d.items.map((item, i) => {
                // Each point can override the block's overall alignment. This also
                // has to be set explicitly on the text lines themselves, not just
                // inherited from the wrapper — .body-text (the real, working class
                // used below) sets text-align: justify, which otherwise wins over
                // whatever alignment the parent wrapper is given.
                const itemAlign = (item.align ?? align) as React.CSSProperties['textAlign']
                return (
                  <div key={i} style={{ textAlign: itemAlign, flex: '1 1 140px', maxWidth: '220px' }}>
                    {item.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.image} alt={item.title} style={{ width: `${scale.icon}px`, height: `${scale.icon}px`, objectFit: 'contain', margin: itemAlign === 'left' ? '0 0 10px' : itemAlign === 'right' ? '0 0 10px auto' : '0 auto 10px' }} />
                    )}
                    {item.title && (
                      <div style={{ fontFamily: 'var(--font-smallcaps)', fontWeight: 'bold', fontSize: scale.title, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: scale.titleGap, textAlign: itemAlign }}>
                        {item.title}
                      </div>
                    )}
                    {item.text && (
                      <div className="body-text" style={{ fontSize: scale.text, color: 'var(--ink-faded)', textAlign: itemAlign }}>{item.text}</div>
                    )}
                    {item.text2 && (
                      <div className="body-text" style={{ fontSize: scale.text, color: 'var(--ink-faded)', marginTop: '4px', textAlign: itemAlign }}>{item.text2}</div>
                    )}
                    {item.buttonText && item.buttonUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <a href={item.buttonUrl} style={ctaButtonStyle('dark', item.buttonSize ?? 'small')}>{item.buttonText}</a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }
    case 'section_label': {
      const d = parseTextContent(text)
      return <div className="section-label" style={{ margin: '0.5em 0', ...textStyleOverrides('section_label', d.size, d.align) }}>{d.text}</div>
    }
    case 'rule':
      return <div className="rule-triple" style={{ margin: '0.5em 0' }} />
    case 'ornament':
      return <div className="rule-ornate" style={{ margin: '0.5em 0', textAlign: 'center' }}>{text || '⸻ ✦ ⸻'}</div>
    case 'spacer':
      return <div style={{ height: `${parseInt(text) || 24}px` }} />
    case 'blank': {
      const d = parseJson<{ height: number; backgroundColor: string; bordered: boolean }>(text, { height: 200, backgroundColor: 'transparent', bordered: false })
      return (
        <div style={{
          height: `${d.height ?? 200}px`,
          backgroundColor: d.backgroundColor || 'transparent',
          border: d.bordered ? '1px solid var(--ink-faded)' : undefined,
        }} />
      )
    }
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

// ─── Account widget block ─────────────────────────────────────────────────────
// Shows a sign-in/sign-up prompt when logged out, or a small account summary
// with quick links when logged in. currentUser is resolved server-side once
// per page load and threaded down — no client-side session fetch needed.

function AccountWidget({ currentUser, align = 'center', background }: { currentUser?: CurrentUser | null; align?: string; background?: WidgetBackground }) {
  const wrapStyle: React.CSSProperties = {
    margin: '0.25em 0', textAlign: align as React.CSSProperties['textAlign'],
    fontSize: '0.72em', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    ...widgetBackgroundStyle(background),
  }
  const linkStyle: React.CSSProperties = {
    color: 'var(--red)', textDecoration: 'underline',
  }
  const sepStyle: React.CSSProperties = { color: 'var(--ink-faded)', margin: '0 5px' }

  if (!currentUser) {
    return (
      <div style={wrapStyle}>
        <a href="/login" style={linkStyle}>Sign in</a>
        <span style={sepStyle}>·</span>
        <a href="/signup" style={linkStyle}>Create account</a>
      </div>
    )
  }

  const firstName = (currentUser.name || currentUser.email).split(' ')[0]

  return (
    <div style={wrapStyle}>
      <span className="body-text" style={{ fontWeight: 'bold' }}>Hi, {firstName}</span>
      <span style={sepStyle}>·</span>
      <a href="/account" style={linkStyle}>Profile</a>
      <span style={sepStyle}>·</span>
      <a href="/account?tab=orders" style={linkStyle}>Orders</a>
      <span style={sepStyle}>·</span>
      <a href="/account?tab=overview" style={linkStyle}>Plan</a>
    </div>
  )
}

// ─── Overlay positioning ─────────────────────────────────────────────────────
// A block can be layered on top of another (e.g. a button over an image) instead
// of taking its own place in the column flow. `overlayOf` stores the target
// block's `blockKey` — a client-generated id that (unlike `id`) survives the
// save cycle, since the page-save route deletes and recreates every block row.

export const OVERLAY_POSITIONS = [
  { value: 'top-left',      label: '↖' }, { value: 'top-center',    label: '↑' }, { value: 'top-right',     label: '↗' },
  { value: 'middle-left',   label: '←' }, { value: 'center',        label: '•' }, { value: 'middle-right',  label: '→' },
  { value: 'bottom-left',   label: '↙' }, { value: 'bottom-center', label: '↓' }, { value: 'bottom-right',  label: '↘' },
] as const

const OVERLAY_POSITION_STYLES: Record<string, React.CSSProperties> = {
  'top-left':      { top: '10px', left: '10px' },
  'top-center':    { top: '10px', left: '50%', transform: 'translateX(-50%)' },
  'top-right':     { top: '10px', right: '10px' },
  'middle-left':   { top: '50%', left: '10px', transform: 'translateY(-50%)' },
  'center':        { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  'middle-right':  { top: '50%', right: '10px', transform: 'translateY(-50%)' },
  'bottom-left':   { bottom: '10px', left: '10px' },
  'bottom-center': { bottom: '10px', left: '50%', transform: 'translateX(-50%)' },
  'bottom-right':  { bottom: '10px', right: '10px' },
}

/** Groups blocks by the blockKey they overlay, keyed on target blockKey. */
function groupOverlays(blocks: EditBlock[]): Map<string, EditBlock[]> {
  const map = new Map<string, EditBlock[]>()
  const keys = new Set(blocks.map((b) => b.blockKey).filter(Boolean))
  for (const b of blocks) {
    if (!b.overlayOf || !keys.has(b.overlayOf)) continue // orphaned overlay — target missing, render in normal flow instead
    if (!map.has(b.overlayOf)) map.set(b.overlayOf, [])
    map.get(b.overlayOf)!.push(b)
  }
  return map
}

function StaticBlockWithOverlays({ block, overlays, products, currency, currentUser }: {
  block: EditBlock; overlays: EditBlock[]
  products: ProductSummary[]; currency: string; currentUser?: CurrentUser | null
}) {
  if (overlays.length === 0) return <StaticBlock block={block} products={products} currency={currency} currentUser={currentUser} />
  return (
    <div style={{ position: 'relative' }}>
      <StaticBlock block={block} products={products} currency={currency} currentUser={currentUser} />
      {overlays.map((ov) => (
        <div key={ov.id} style={{
          position: 'absolute', zIndex: 5,
          ...(OVERLAY_POSITION_STYLES[ov.overlayPosition ?? 'center'] ?? OVERLAY_POSITION_STYLES.center),
          marginLeft: ov.overlayOffsetX || undefined,
          marginTop: ov.overlayOffsetY || undefined,
        }}>
          <StaticBlock block={ov} products={products} currency={currency} currentUser={currentUser} />
        </div>
      ))}
    </div>
  )
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
function freshRow(columnCount: number): BlockRow {
  return { spans: [], columns: Array.from({ length: columnCount }, () => []) }
}

function isEmptyRow(row: BlockRow): boolean {
  return row.spans.length === 0 && row.columns.every((c) => c.length === 0)
}

function groupBlocksIntoRows(blocks: EditBlock[], columnCount: number): BlockRow[] {
  const rows: BlockRow[] = []
  let current: BlockRow = freshRow(columnCount)
  let spanClaimed = new Set<number>()  // columns reserved by a span in the current row
  let normalUsed = new Set<number>()   // columns that already hold a normal block in the current row

  function flush() {
    rows.push(current)
    current = freshRow(columnCount)
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
  // Always end with a genuine empty row as a drop target for the editor — the static
  // view renders an empty row as nothing, so this is harmless there. Without this, a
  // page ending in a full-width span (e.g. Featured products) had no row left for
  // "+ Add block" to render into, since every column in the span's own row was claimed.
  rows.push(current)
  if (!isEmptyRow(current)) rows.push(freshRow(columnCount))
  return rows
}

function StaticBlocks({ blocks, columnCount, products, currency, currentUser }: { blocks: EditBlock[]; columnCount: number; products: ProductSummary[]; currency: string; currentUser?: CurrentUser | null }) {
  const visible = blocks.filter((b) => b.visible)
  if (visible.length === 0) return null

  // Overlay blocks (e.g. a button layered on an image) are pulled out of the normal
  // flow entirely and rendered inside their target block's wrapper instead.
  const overlaysByTarget = groupOverlays(visible)
  const overlaidIds = new Set(Array.from(overlaysByTarget.values()).flat().map((b) => b.id))
  const flowBlocks = visible.filter((b) => !overlaidIds.has(b.id))

  if (columnCount === 1) return <div>{flowBlocks.map((b) => <StaticBlockWithOverlays key={b.id} block={b} overlays={overlaysByTarget.get(b.blockKey ?? '') ?? []} products={products} currency={currency} currentUser={currentUser} />)}</div>

  // Blocks with colSpan 1 keep flowing in their own independent column stack, like a
  // newspaper. A block spanning 2+ columns shares its row with normal blocks in
  // whichever columns it doesn't cover (e.g. an image beside a text sidebar) — a row
  // only breaks when something would actually overlap what's already in it.
  const rows = groupBlocksIntoRows(flowBlocks, columnCount)

  return (
    <div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: '0 12px' }}>
          {row.spans.map(({ block, startCol, span }) => (
            <div key={block.id} style={{ gridColumn: `${startCol} / span ${span}`, gridRow: 1 }}>
              <StaticBlockWithOverlays block={block} overlays={overlaysByTarget.get(block.blockKey ?? '') ?? []} products={products} currency={currency} currentUser={currentUser} />
            </div>
          ))}
          {row.columns.map((colBlocks, ci) => colBlocks.length > 0 && (
            <div key={ci} style={{ gridColumn: `${ci + 1} / span 1`, gridRow: 1 }}>
              {colBlocks.map((b) => <StaticBlockWithOverlays key={b.id} block={b} overlays={overlaysByTarget.get(b.blockKey ?? '') ?? []} products={products} currency={currency} currentUser={currentUser} />)}
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

function BlockEditModal({ block, allBlocks, onSave, onClose, columnCount, products, currency }: {
  block: EditBlock
  allBlocks: EditBlock[]
  onSave: (updated: EditBlock) => void
  onClose: () => void
  columnCount: number
  products: ProductSummary[]
  currency: string
}) {
  const [type, setType] = useState<string>(block.blockType)
  const [column, setColumn] = useState(block.column)
  const [colSpan, setColSpan] = useState(block.colSpan ?? 1)
  const [overlayOf, setOverlayOf] = useState<string>(block.overlayOf ?? '')
  const [overlayPosition, setOverlayPosition] = useState<string>(block.overlayPosition ?? 'center')
  const [overlayOffsetX, setOverlayOffsetX] = useState<number>(block.overlayOffsetX ?? 0)
  const [overlayOffsetY, setOverlayOffsetY] = useState<number>(block.overlayOffsetY ?? 0)

  // Any other block on the page can be an overlay target — except blocks that are
  // themselves overlaying something (no overlay-on-overlay chains) or this block itself.
  const overlayTargets = allBlocks.filter((b) => b.id !== block.id && b.blockKey && !b.overlayOf)

  // Simple text content — headline/subheadline/byline/dateline/section_label/
  // advertisement/pullquote/body store {text, align, size} JSON; parseTextContent
  // extracts just the text portion here (and falls back cleanly for legacy plain-
  // string content), while other block types keep using raw content directly.
  const parsedText = TEXT_STYLED_TYPES.includes(block.blockType) ? parseTextContent(block.content) : null
  const [text, setText] = useState(() => (parsedText ? parsedText.text : block.content))
  const [textAlign, setTextAlign] = useState(parsedText?.align ?? '')
  const [textSize, setTextSize] = useState(parsedText?.size ?? '')

  // Image-specific fields
  const imgData = parseJson<{ url: string; alt: string; caption: string; width: number; fit: string }>(block.blockType === 'image' ? block.content : '{}', { url: '', alt: '', caption: '', width: 100, fit: 'fit' })
  const [imgUrl, setImgUrl] = useState(imgData.url ?? '')
  const [imgAlt, setImgAlt] = useState(imgData.alt ?? '')
  const [imgCaption, setImgCaption] = useState(imgData.caption ?? '')
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
  const ctaData = parseJson<{ text: string; url: string; style: string; size?: string; align?: string }>(block.blockType === 'cta' ? block.content : '{}', { text: 'Subscribe Now', url: '/pricing', style: 'dark' })
  const [ctaText, setCtaText] = useState(ctaData.text ?? 'Subscribe Now')
  const [ctaUrl, setCtaUrl] = useState(ctaData.url ?? '/pricing')
  const [ctaStyle, setCtaStyle] = useState(ctaData.style ?? 'dark')
  const [ctaSize, setCtaSize] = useState(ctaData.size ?? 'medium')
  const [ctaAlign, setCtaAlign] = useState(ctaData.align ?? 'center')

  // Background fields — shared by every widget type that supports a background
  // (only one type is ever being edited at a time, so one set of state suffices).
  const BG_CAPABLE_TYPES = ['account_widget', 'steps', 'social_links', 'cta', 'advertisement', 'featured_products']
  const bgData = parseJson<{ background?: WidgetBackground }>(BG_CAPABLE_TYPES.includes(block.blockType) ? block.content : '{}', {}).background
  const [bgStyle, setBgStyle] = useState(bgData?.style ?? 'transparent')
  const [bgColor, setBgColor] = useState(bgData?.color ?? '#E8E6D8')
  const [bgOpacity, setBgOpacity] = useState(bgData?.opacity ?? 1)
  const background: WidgetBackground = { style: bgStyle, color: bgColor, opacity: bgOpacity }

  // Account widget fields
  const accountData = parseJson<{ align?: string }>(block.blockType === 'account_widget' ? block.content : '{}', {})
  const [accountAlign, setAccountAlign] = useState(accountData.align ?? 'center')

  // Social links fields
  const socialData = parseJson<{ align?: string; size?: string; style?: string; links?: Record<string, string> }>(block.blockType === 'social_links' ? block.content : '{}', {})
  const [socialAlign, setSocialAlign] = useState(socialData.align ?? 'center')
  const [socialSize, setSocialSize] = useState(socialData.size ?? 'medium')
  const [socialStyle, setSocialStyle] = useState(socialData.style ?? 'outline')
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(socialData.links ?? {})
  function setSocialLink(key: string, url: string) {
    setSocialLinks((prev) => ({ ...prev, [key]: url }))
  }

  // Ornament preset
  const [ornament, setOrnament] = useState(block.blockType === 'ornament' ? (block.content || '⸻ ✦ ⸻') : '⸻ ✦ ⸻')

  // Spacer height
  const [spacerHeight, setSpacerHeight] = useState(block.blockType === 'spacer' ? (parseInt(block.content) || 24) : 24)

  // Blank block fields
  const blankData = parseJson<{ height: number; backgroundColor: string; bordered: boolean }>(block.blockType === 'blank' ? block.content : '{}', { height: 200, backgroundColor: '', bordered: false })
  const [blankHeight, setBlankHeight] = useState(blankData.height ?? 200)
  const [blankBg, setBlankBg] = useState(blankData.backgroundColor ?? '')
  const [blankBordered, setBlankBordered] = useState(blankData.bordered ?? false)

  // Steps / Features fields
  type StepItem = { image: string; title: string; text: string; text2?: string; align?: string; buttonText?: string; buttonUrl?: string; buttonSize?: string }
  const stepsData = parseJson<{ title: string; size?: string; align?: string; items: StepItem[] }>(
    block.blockType === 'steps' ? block.content : '{}',
    { title: '', size: 'medium', align: 'center', items: [{ image: '', title: '', text: '', text2: '' }] }
  )
  const [stepsTitle, setStepsTitle] = useState(stepsData.title ?? '')
  const [stepsSize, setStepsSize] = useState(stepsData.size ?? 'medium')
  const [stepsAlign, setStepsAlign] = useState(stepsData.align ?? 'center')
  const [stepsItems, setStepsItems] = useState<StepItem[]>(stepsData.items?.length > 0 ? stepsData.items : [{ image: '', title: '', text: '', text2: '' }])
  const [stepsUploadingIndex, setStepsUploadingIndex] = useState<number | null>(null)

  function updateStepItem(i: number, patch: Partial<StepItem>) {
    setStepsItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  }
  function addStepItem() {
    setStepsItems((prev) => [...prev, { image: '', title: '', text: '', text2: '' }])
  }
  function removeStepItem(i: number) {
    setStepsItems((prev) => prev.filter((_, idx) => idx !== i))
  }
  async function handleStepImageUpload(i: number, file: File) {
    setStepsUploadingIndex(i)
    try {
      const presignRes = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error ?? 'Upload failed')
      await fetch(presignData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      updateStepItem(i, { image: presignData.publicUrl })
    } catch {
      // Silently ignore — the URL field stays editable so they can paste one manually
    } finally {
      setStepsUploadingIndex(null)
    }
  }

  // Featured products fields
  const fpData = parseJson<{ heading: string; productIds: string[]; imageSize?: string }>(block.blockType === 'featured_products' ? block.content : '{}', { heading: 'Featured Products', productIds: [] })
  const [fpHeading, setFpHeading] = useState(fpData.heading ?? 'Featured Products')
  const [fpProductIds, setFpProductIds] = useState<string[]>(fpData.productIds ?? [])
  const [fpImageSize, setFpImageSize] = useState(fpData.imageSize ?? 'medium')

  function toggleFeaturedProduct(id: string) {
    setFpProductIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= MAX_FEATURED_PRODUCTS) return prev
      return [...prev, id]
    })
  }

  function buildContent(): string {
    if (TEXT_STYLED_TYPES.includes(type)) {
      const extra = type === 'advertisement' ? { background } : {}
      return JSON.stringify({ text, align: textAlign, size: textSize, ...extra })
    }
    switch (type) {
      case 'image': return JSON.stringify({ url: imgUrl, alt: imgAlt, caption: imgCaption, width: imgWidth, fit: imgFit })
      case 'cta':   return JSON.stringify({ text: ctaText, url: ctaUrl, style: ctaStyle, size: ctaSize, align: ctaAlign, background })
      case 'account_widget': return JSON.stringify({ align: accountAlign, background })
      case 'social_links': return JSON.stringify({ align: socialAlign, size: socialSize, style: socialStyle, links: Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => v.trim())), background })
      case 'ornament': return ornament
      case 'spacer': return String(spacerHeight)
      case 'blank': return JSON.stringify({ height: blankHeight, backgroundColor: blankBg, bordered: blankBordered })
      case 'steps': return JSON.stringify({ title: stepsTitle, size: stepsSize, align: stepsAlign, items: stepsItems.filter((it) => it.image || it.title || it.text || it.text2 || it.buttonText), background })
      case 'featured_products': return JSON.stringify({ heading: fpHeading, productIds: fpProductIds, imageSize: fpImageSize, background })
      default: return text
    }
  }

  function handleSave() {
    onSave({
      ...block, blockType: type, content: buildContent(), column, colSpan,
      overlayOf: overlayOf || null,
      overlayPosition: overlayOf ? overlayPosition : null,
      overlayOffsetX: overlayOf ? (overlayOffsetX || null) : null,
      overlayOffsetY: overlayOf ? (overlayOffsetY || null) : null,
    })
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
            {columnCount > 1 && type !== 'rule' && (
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

          {/* ── OVERLAY ── */}
          {overlayTargets.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <FieldLabel>Overlay</FieldLabel>
                <select value={overlayOf} onChange={(e) => setOverlayOf(e.target.value)} style={selectStyle}>
                  <option value="">Normal block — own place in the layout</option>
                  {overlayTargets.map((t) => (
                    <option key={t.blockKey} value={t.blockKey ?? ''}>Layer on: {blockLabel(t)}</option>
                  ))}
                </select>
                <HelpText>Places this block on top of another instead of in the normal flow — e.g. a button over an image.</HelpText>
              </div>
              {overlayOf && (
                <div>
                  <FieldLabel>Position</FieldLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px' }}>
                    {OVERLAY_POSITIONS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setOverlayPosition(p.value)}
                        title={p.value.replace('-', ' ')}
                        style={{
                          width: '30px', height: '30px', fontSize: '14px', lineHeight: 1,
                          border: overlayPosition === p.value ? '2px solid #C4AB77' : '1px solid #c8c4a8',
                          borderRadius: '4px', backgroundColor: overlayPosition === p.value ? 'rgba(196,171,119,0.15)' : 'white',
                          cursor: 'pointer', color: '#4B4C44', padding: 0,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {overlayOf && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div style={{ width: '64px' }}>
                    <FieldLabel>Shift X</FieldLabel>
                    <input
                      type="number"
                      value={overlayOffsetX}
                      onChange={(e) => setOverlayOffsetX(Number(e.target.value))}
                      title="Fine-tune horizontal position in pixels — negative shifts left"
                      style={{ ...inputStyle, padding: '8px 6px', textAlign: 'center' }}
                    />
                  </div>
                  <div style={{ width: '64px' }}>
                    <FieldLabel>Shift Y</FieldLabel>
                    <input
                      type="number"
                      value={overlayOffsetY}
                      onChange={(e) => setOverlayOffsetY(Number(e.target.value))}
                      title="Fine-tune vertical position in pixels — negative shifts up"
                      style={{ ...inputStyle, padding: '8px 6px', textAlign: 'center' }}
                    />
                  </div>
                </div>
              )}
            </div>
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
              <TextSizeAlignRow size={textSize} align={textAlign} onSize={setTextSize} onAlign={setTextAlign} />
              {type === 'advertisement' && (
                <div style={{ marginTop: '10px' }}>
                  <BackgroundFieldsGroup style={bgStyle} color={bgColor} opacity={bgOpacity} onStyle={setBgStyle} onColor={setBgColor} onOpacity={setBgOpacity} />
                </div>
              )}
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
              <TextSizeAlignRow size={textSize} align={textAlign} onSize={setTextSize} onAlign={setTextAlign} />
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
              <TextSizeAlignRow size={textSize} align={textAlign} onSize={setTextSize} onAlign={setTextAlign} />
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Button size</FieldLabel>
                  <select value={ctaSize} onChange={(e) => setCtaSize(e.target.value)} style={selectStyle}>
                    {BUTTON_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Alignment</FieldLabel>
                  <select value={ctaAlign} onChange={(e) => setCtaAlign(e.target.value)} style={selectStyle}>
                    {ALIGN_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>
              <BackgroundFieldsGroup style={bgStyle} color={bgColor} opacity={bgOpacity} onStyle={setBgStyle} onColor={setBgColor} onOpacity={setBgOpacity} />
            </>
          )}

          {/* ── ACCOUNT WIDGET ── */}
          {type === 'account_widget' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <FieldLabel>Alignment</FieldLabel>
                <select value={accountAlign} onChange={(e) => setAccountAlign(e.target.value)} style={{ ...selectStyle, maxWidth: '160px' }}>
                  {ALIGN_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <HelpText>Which side of its column the sign-in prompt (or profile links, once signed in) sits on.</HelpText>
              </div>
              <BackgroundFieldsGroup style={bgStyle} color={bgColor} opacity={bgOpacity} onStyle={setBgStyle} onColor={setBgColor} onOpacity={setBgOpacity} />
            </div>
          )}

          {/* ── SOCIAL LINKS ── */}
          {type === 'social_links' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Icon size</FieldLabel>
                  <select value={socialSize} onChange={(e) => setSocialSize(e.target.value)} style={selectStyle}>
                    {BUTTON_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Alignment</FieldLabel>
                  <select value={socialAlign} onChange={(e) => setSocialAlign(e.target.value)} style={selectStyle}>
                    {ALIGN_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Icon style</FieldLabel>
                  <select value={socialStyle} onChange={(e) => setSocialStyle(e.target.value)} style={selectStyle}>
                    <option value="outline">Outline</option>
                    <option value="filled">Filled</option>
                  </select>
                </div>
              </div>
              {SOCIAL_PLATFORMS.map((p) => (
                <div key={p.key}>
                  <FieldLabel>{p.label}</FieldLabel>
                  <input type="url" value={socialLinks[p.key] ?? ''} onChange={(e) => setSocialLink(p.key, e.target.value)} placeholder="https://…" style={inputStyle} />
                </div>
              ))}
              <HelpText>Leave a field blank to hide that icon — only the profiles you fill in will show up.</HelpText>
              <BackgroundFieldsGroup style={bgStyle} color={bgColor} opacity={bgOpacity} onStyle={setBgStyle} onColor={setBgColor} onOpacity={setBgOpacity} />
            </div>
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

          {/* ── BLANK BLOCK ── */}
          {type === 'blank' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ width: '120px' }}>
                  <FieldLabel>Height (px)</FieldLabel>
                  <input type="number" value={blankHeight} onChange={(e) => setBlankHeight(Number(e.target.value))} min={20} max={2000} step={10} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Background colour</FieldLabel>
                  <input type="text" value={blankBg} onChange={(e) => setBlankBg(e.target.value)} placeholder="e.g. #f5f2e8 or transparent" style={inputStyle} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4B4C44', cursor: 'pointer' }}>
                <input type="checkbox" checked={blankBordered} onChange={(e) => setBlankBordered(e.target.checked)} />
                Show a thin border around the panel
              </label>
              <HelpText>A plain empty panel — use it as a canvas to layer overlay blocks on top of, or just as a coloured spacer band.</HelpText>
            </div>
          )}

          {/* ── STEPS / FEATURES ── */}
          {type === 'steps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>Section title</FieldLabel>
                  <input type="text" value={stepsTitle} onChange={(e) => setStepsTitle(e.target.value)} placeholder="How It Works" style={inputStyle} />
                </div>
                <div style={{ width: '110px' }}>
                  <FieldLabel>Size</FieldLabel>
                  <select value={stepsSize} onChange={(e) => setStepsSize(e.target.value)} style={selectStyle}>
                    {STEPS_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '110px' }}>
                  <FieldLabel>Alignment</FieldLabel>
                  <select value={stepsAlign} onChange={(e) => setStepsAlign(e.target.value)} style={selectStyle}>
                    {ALIGN_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              {stepsItems.map((item, i) => (
                <div key={i} style={{ border: '1px solid #e8dcc4', borderRadius: 6, padding: 12, backgroundColor: '#faf7ee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#7A564C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Point {i + 1}
                    </span>
                    {stepsItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStepItem(i)}
                        style={{ background: 'none', border: 'none', color: '#c0504d', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 72, flexShrink: 0, textAlign: 'center' }}>
                      {item.image ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.image} alt="" style={{ width: 56, height: 56, objectFit: 'contain', margin: '0 auto 6px', display: 'block' }} />
                      ) : (
                        <div style={{ width: 56, height: 56, margin: '0 auto 6px', borderRadius: 4, backgroundColor: '#f0ece0', border: '1px dashed #c8c4a8' }} />
                      )}
                      <label style={{ display: 'block', fontSize: 10, color: '#7A564C', cursor: stepsUploadingIndex === i ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        {stepsUploadingIndex === i ? 'Uploading…' : 'Upload'}
                        <input
                          type="file" accept="image/*" style={{ display: 'none' }}
                          disabled={stepsUploadingIndex === i}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStepImageUpload(i, f) }}
                        />
                      </label>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        type="text" value={item.title} onChange={(e) => updateStepItem(i, { title: e.target.value })}
                        placeholder="Take the Quiz" style={{ ...inputStyle, fontWeight: 600 }}
                      />
                      <input
                        type="text" value={item.text} onChange={(e) => updateStepItem(i, { text: e.target.value })}
                        placeholder="Tell us your taste preferences." style={inputStyle}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text" value={item.text2 ?? ''} onChange={(e) => updateStepItem(i, { text2: e.target.value })}
                          placeholder="Optional second line of description" style={{ ...inputStyle, flex: 1 }}
                        />
                        <select
                          value={item.align ?? stepsAlign} onChange={(e) => updateStepItem(i, { align: e.target.value })}
                          title="This point's alignment"
                          style={{ ...selectStyle, width: 100 }}
                        >
                          {ALIGN_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                        </select>
                      </div>
                      <input
                        type="url" value={item.image} onChange={(e) => updateStepItem(i, { image: e.target.value })}
                        placeholder="or paste an image URL" style={{ ...inputStyle, fontSize: 11 }}
                      />
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#b8b090' }}>
                        Best size: ~150–200px square, transparent PNG or SVG works best.
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          type="text" value={item.buttonText ?? ''} onChange={(e) => updateStepItem(i, { buttonText: e.target.value })}
                          placeholder="Button text (optional)" style={{ ...inputStyle, flex: 1.4 }}
                        />
                        <input
                          type="text" value={item.buttonUrl ?? ''} onChange={(e) => updateStepItem(i, { buttonUrl: e.target.value })}
                          placeholder="/link" style={{ ...inputStyle, flex: 1 }}
                        />
                        <select
                          value={item.buttonSize ?? 'small'} onChange={(e) => updateStepItem(i, { buttonSize: e.target.value })}
                          style={{ ...selectStyle, width: 90 }}
                        >
                          {BUTTON_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button" onClick={addStepItem}
                style={{ padding: '8px', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, backgroundColor: 'transparent', border: '1px dashed #C4AB77', borderRadius: 4, cursor: 'pointer', color: '#C4AB77' }}
              >
                + Add point
              </button>
              <HelpText>Add as many points as you like — each gets its own image, title, up to two lines of description, an optional button, and its own alignment (next to the second description line) that overrides the section's overall Alignment above.</HelpText>
              <BackgroundFieldsGroup style={bgStyle} color={bgColor} opacity={bgOpacity} onStyle={setBgStyle} onColor={setBgColor} onOpacity={setBgOpacity} />
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
                <FieldLabel>Image size</FieldLabel>
                <select value={fpImageSize} onChange={(e) => setFpImageSize(e.target.value)} style={{ ...selectStyle, maxWidth: '160px' }}>
                  {FP_IMAGE_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <HelpText>Each product still gets an equal share of the row — this caps how large the photo is allowed to grow within it.</HelpText>
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
              <BackgroundFieldsGroup style={bgStyle} color={bgColor} opacity={bgOpacity} onStyle={setBgStyle} onColor={setBgColor} onOpacity={setBgOpacity} />
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

function TextSizeAlignRow({ size, align, onSize, onAlign }: { size: string; align: string; onSize: (v: string) => void; onAlign: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
      <div style={{ flex: 1 }}>
        <FieldLabel>Text size</FieldLabel>
        <select value={size} onChange={(e) => onSize(e.target.value)} style={selectStyle}>
          {TEXT_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <FieldLabel>Alignment</FieldLabel>
        <select value={align} onChange={(e) => onAlign(e.target.value)} style={selectStyle}>
          {TEXT_ALIGN_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>
    </div>
  )
}

function BackgroundFieldsGroup({ style, color, opacity, onStyle, onColor, onOpacity }: {
  style: string; color: string; opacity: number
  onStyle: (v: string) => void; onColor: (v: string) => void; onOpacity: (v: number) => void
}) {
  return (
    <div>
      <FieldLabel>Background</FieldLabel>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <select value={style} onChange={(e) => onStyle(e.target.value)} style={{ ...selectStyle, maxWidth: '150px' }}>
          {BG_STYLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {style === 'color' && (
          <>
            <input
              type="color" value={color} onChange={(e) => onColor(e.target.value)}
              style={{ width: '38px', height: '34px', padding: '2px', border: '1px solid #c8c4a8', borderRadius: '4px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <input
                type="range" min={0} max={1} step={0.05} value={opacity}
                onChange={(e) => onOpacity(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#7A564C' }}
              />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4B4C44', width: '34px', textAlign: 'right' }}>{Math.round(opacity * 100)}%</span>
            </div>
          </>
        )}
      </div>
      <HelpText>Solid colour adds a card-like background behind this widget, with adjustable opacity.</HelpText>
    </div>
  )
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

function VisualSortableBlock({ block, allBlocks, products, currency, onEdit, onDelete, onDuplicate, onToggleVisible }: {
  block: EditBlock
  allBlocks: EditBlock[]
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
  const overlayTarget = block.overlayOf ? allBlocks.find((b) => b.blockKey === block.overlayOf) : null

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
        marginBottom: '9px',
        borderRadius: '2px',
        paddingTop: (block.colSpan ?? 1) > 1 ? '20px' : undefined,
        outline: hovered && !isDragging ? '2px solid rgba(139,105,20,0.5)' : '2px solid transparent',
        outlineOffset: '1px',
      }}
    >
      {/* Drag handle — a tall, always-present grip on the left edge (much easier to
          grab and aim than a tiny corner icon). Brightens on hover; the whole strip
          is the drag surface, not just the icon glyph. */}
      <div
        {...attributes} {...listeners}
        title="Drag to move"
        style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 18,
          width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none',
          backgroundColor: hovered && !isDragging ? 'rgba(26,16,8,0.55)' : 'transparent',
          borderRadius: '2px 0 0 2px',
          opacity: hovered && !isDragging ? 1 : 0.22,
          transition: 'opacity 0.12s, background-color 0.12s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill={hovered ? '#E8E6D8' : '#7A564C'}>
          <circle cx="9" cy="5" r="1.8"/><circle cx="15" cy="5" r="1.8"/>
          <circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/>
          <circle cx="9" cy="19" r="1.8"/><circle cx="15" cy="19" r="1.8"/>
        </svg>
      </div>

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

      {/* Overlay indicator — this block won't take its own place in the layout;
          it renders on top of its target on the published page. */}
      {block.overlayOf && (
        <div style={{
          position: 'absolute', top: '3px', left: '3px', zIndex: 15,
          backgroundColor: 'rgba(139,105,20,0.9)', color: '#E8E6D8',
          fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700,
          padding: '2px 6px', borderRadius: '3px', pointerEvents: 'none',
        }}>
          ⧉ overlay{overlayTarget ? ` → ${blockLabel(overlayTarget)}` : ' (target missing)'}
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

export function EditablePanel({ pageId, columnCount, layout, products, currency }: { pageId: string; columnCount: number; layout: string; products: ProductSummary[]; currency: string }) {
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

  // Computes the block order that results from moving `activeBlockId` to wherever
  // `overRawId` points (either another block's id, to be inserted next to, or a
  // `drop-col-N-row` empty-segment id, appended to the end of that column).
  function moveBlock(overRawId: string, activeBlockId: string): EditBlock[] | null {
    const activeIdx = blocks.findIndex((b) => b.id === activeBlockId)
    if (activeIdx === -1) return null
    const activeBlock = blocks[activeIdx]

    const colMatch = overRawId.match(/^drop-col-(\d+)-\d+$/)
    if (colMatch) {
      const targetCol = parseInt(colMatch[1])
      const without = blocks.filter((_, i) => i !== activeIdx)
      let insertAt = without.length
      for (let i = without.length - 1; i >= 0; i--) {
        if (without[i].column === targetCol) { insertAt = i + 1; break }
      }
      return [...without.slice(0, insertAt), { ...activeBlock, column: targetCol }, ...without.slice(insertAt)]
    }

    const overIdx = blocks.findIndex((b) => b.id === overRawId)
    if (overIdx === -1 || overIdx === activeIdx) return null
    const overBlock = blocks[overIdx]

    const withUpdatedColumn = activeBlock.column === overBlock.column
      ? blocks
      : blocks.map((b, i) => (i === activeIdx ? { ...b, column: overBlock.column } : b))

    return arrayMove(withUpdatedColumn, activeIdx, overIdx)
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
    const next = moveBlock(over.id as string, active.id as string)
    if (next) ctx.setPageBlocks(pageId, next)
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
    const copy: EditBlock = { ...blocks[idx], id: `new-${Date.now()}`, blockKey: crypto.randomUUID() }
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
      blockKey: crypto.randomUUID(),
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
                    allBlocks={blocks}
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
                      <div style={{ padding: '16px 0', textAlign: 'center', fontFamily: "'Libre Baskerville', serif", color: 'rgba(139,105,20,0.5)', fontStyle: 'italic', fontSize: '12px' }}>
                        Drop blocks here
                      </div>
                    )}
                    {colBlocks.map((block) => (
                      <VisualSortableBlock
                        key={block.id}
                        block={block}
                        allBlocks={blocks}
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

        {/* Drag overlay — portaled to document.body because DragOverlay positions
            itself with `position: fixed`, and .page (the newspaper's scrollable
            viewport) has its own `transform` set for the page-turn slide animation.
            Per the CSS spec, ANY transform on an ancestor — even an identity
            translateX(0px) — makes that ancestor the containing block for
            position:fixed descendants instead of the real viewport. Left un-portaled,
            the dragged block silently renders offset from the cursor by however far
            .page's own box (padding, scroll position) differs from the viewport —
            this is exactly the "mouse goes out of alignment with the block being
            dragged" bug. Same pattern already used below for AddBlockDropdown and
            BlockEditModal, which escape .page for the same reason. */}
        {typeof window !== 'undefined' && createPortal(
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
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          allBlocks={blocks}
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
  currentUser?: CurrentUser | null
}

export function CmsBlockArea({ pageId, initialBlocks, columnCount, layout, isPlaceholder, products = [], currency = 'USD', currentUser = null }: Props) {
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
    return <StaticBlocks blocks={initialBlocks} columnCount={columnCount} products={products} currency={currency} currentUser={currentUser} />
  }

  // Edit mode — render the visual in-place editor (no dark overlay, blocks look as published)
  return <EditablePanel pageId={pageId} columnCount={columnCount} layout={layout} products={products} currency={currency} />
}
