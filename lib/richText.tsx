// Shared rich text rendering — used by both the CMS editor's live preview
// and the public site renderer, so the two never drift apart.
//
// Content is stored as either:
//   - HTML produced by the Tiptap rich text editor (new content), or
//   - plain text with lightweight markdown (**bold**, *italic*, - bullets) —
//     the format every block saved before the rich text editor existed.
// looksLikeHtml() tells the two apart so old content keeps rendering correctly.

// Dependency-free allowlist sanitizer — runs identically on server and client.
// (isomorphic-dompurify's bundled jsdom doesn't survive Next.js's server webpack
// bundling, so we hand-roll this instead of fighting that.) Tiptap's own schema is
// the primary defense: its toolbar only ever emits these tags/attributes in the
// first place. This is a defense-in-depth pass for anything pasted in directly.

const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'br', 'span', 'h1', 'h2', 'h3', 'blockquote'])
const ALLOWED_ATTRS = new Set(['href', 'target', 'rel', 'style'])
const ALLOWED_STYLE_PROPS = new Set(['font-family', 'color', 'text-align'])

function sanitizeStyleAttr(value: string): string {
  return value.split(';').map((decl) => {
    const [propRaw, ...rest] = decl.split(':')
    const prop = propRaw?.trim().toLowerCase()
    const val = rest.join(':').trim()
    if (!prop || !val || !ALLOWED_STYLE_PROPS.has(prop)) return null
    if (/url\s*\(|expression\s*\(|javascript:/i.test(val)) return null
    return `${prop}: ${val}`
  }).filter(Boolean).join('; ')
}

function sanitizeHrefAttr(value: string): string | null {
  const trimmed = value.trim()
  return /^(?:https?:|mailto:|tel:|\/|#)/i.test(trimmed) ? trimmed : null
}

const ATTR_PATTERN = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g

export function sanitizeRichHtml(html: string): string {
  // Drop dangerous elements entirely, including their contents
  let out = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[^>]*\/?>/gi, '')

  // Strip any tag not on the allowlist (keeping its inner text), and filter
  // attributes on the tags we do keep down to href/target/rel/style only.
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\s*\/?>/g, (match, tagNameRaw: string, attrsRaw: string) => {
    const tagName = tagNameRaw.toLowerCase()
    if (!ALLOWED_TAGS.has(tagName)) return ''
    if (match.startsWith('</')) return `</${tagName}>`

    const kept: string[] = []
    let attrMatch: RegExpExecArray | null
    ATTR_PATTERN.lastIndex = 0
    while ((attrMatch = ATTR_PATTERN.exec(attrsRaw))) {
      const name = attrMatch[1].toLowerCase()
      const rawVal = attrMatch[3] ?? attrMatch[4] ?? attrMatch[5] ?? ''
      if (!ALLOWED_ATTRS.has(name)) continue
      if (name === 'style') {
        const cleaned = sanitizeStyleAttr(rawVal)
        if (cleaned) kept.push(`style="${cleaned.replace(/"/g, '&quot;')}"`)
      } else if (name === 'href') {
        const cleaned = sanitizeHrefAttr(rawVal)
        if (cleaned) kept.push(`href="${cleaned.replace(/"/g, '&quot;')}"`)
      } else if (name === 'target') {
        if (rawVal === '_blank') kept.push('target="_blank"')
      } else if (name === 'rel') {
        kept.push('rel="noopener noreferrer"')
      }
    }
    return `<${tagName}${kept.length ? ' ' + kept.join(' ') : ''}>`
  })

  return out
}

function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text)
}

// ── Legacy markdown-lite renderer (pre-rich-text-editor content) ─────────────

function legacyInlineHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" style="color:var(--link-color,#7A564C);text-decoration:underline">$1</a>')
}

function legacyBodyHtml(text: string): string {
  return text.split(/\n\n+/).map((para) => {
    const lines = para.split('\n').filter(Boolean)
    if (lines.every((l) => /^[-*•]\s/.test(l))) {
      return `<ul>${lines.map((l) => `<li>${legacyInlineHtml(l.replace(/^[-*•]\s+/, ''))}</li>`).join('')}</ul>`
    }
    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      return `<ol>${lines.map((l) => `<li>${legacyInlineHtml(l.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`
    }
    return `<p>${legacyInlineHtml(para)}</p>`
  }).join('')
}

/** Render stored block content (HTML or legacy markdown-lite) as sanitized HTML. */
export function richTextToHtml(content: string): string {
  const text = content ?? ''
  if (!text) return ''
  return looksLikeHtml(text) ? sanitizeRichHtml(text) : legacyBodyHtml(text)
}

interface RichTextProps {
  content: string
  className?: string
  style?: React.CSSProperties
  as?: 'div' | 'blockquote'
}

/** Renders stored block content, transparently supporting both HTML and legacy plain text. */
export function RichText({ content, className, style, as: Tag = 'div' }: RichTextProps) {
  const html = richTextToHtml(content)
  if (!html) return null
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />
}
