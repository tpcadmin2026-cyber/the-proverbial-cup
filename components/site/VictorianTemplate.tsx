import type { CmsPage, ContentBlock, NavItem } from '@prisma/client'
import { VictorianNav } from './VictorianNav'
import { CmsBlockArea } from './CmsBlockArea'

type PageWithBlocks = CmsPage & { blocks: ContentBlock[] }

interface Masthead {
  taglineLeft: string
  taglineCenter: string
  taglineRight: string
  motto: string
  editionDate: string
  volume: string
  issueNumber: string
  editionLabel: string
  establishedBy: string
}

const DEFAULT_MASTHEAD: Masthead = {
  taglineLeft:   'PRICE TWO PENCE',
  taglineCenter: '❧ ✦ ❧',
  taglineRight:  'FOR KING & COUNTRY',
  motto:         'Truth, Honour, Industry',
  editionDate:   'Thursday, 14th November, 1878',
  volume:        'XVI',
  issueNumber:   '841',
  editionLabel:  'LONDON MORNING EDITION',
  establishedBy: 'Established by Royal Charter',
}

interface Props {
  pages: PageWithBlocks[]
  navItems: NavItem[]
  siteName: string
  mastheadTitle: string
  masthead?: Masthead
}

const DEFAULT_PAGES: PageWithBlocks[] = [
  { id: 'p1', tabNumeral: 'I',   tabLabel: 'Front Page',         pageOrder: 1, slug: 'front-page',         layout: 'columns-3', published: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', tabNumeral: 'II',  tabLabel: 'Foreign & Commerce', pageOrder: 2, slug: 'foreign-commerce',   layout: 'columns-3', published: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p3', tabNumeral: 'III', tabLabel: 'Science & Arts',     pageOrder: 3, slug: 'science-arts',       layout: 'columns-3', published: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p4', tabNumeral: 'IV',  tabLabel: 'Sport & Letters',    pageOrder: 4, slug: 'sport-letters',      layout: 'columns-3', published: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
]

/** Convert markdown-lite inline markup to HTML safe string */
function inlineHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" style="color:var(--link-color,#7A564C);text-decoration:underline">$1</a>')
}

/** Render a body text block supporting paragraphs, bullet lists, numbered lists */
function renderBodyText(text: string, key: string) {
  const paragraphs = text.split(/\n\n+/)
  return (
    <div key={key} className="body-text" style={{ marginBottom: '0.75em' }}>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n').filter(Boolean)
        // Bullet list
        if (lines.every((l) => /^[-*•]\s/.test(l))) {
          return (
            <ul key={i} style={{ paddingLeft: '1.2em', margin: '0.4em 0', listStyleType: 'disc' }}>
              {lines.map((l, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: inlineHtml(l.replace(/^[-*•]\s+/, '')) }} />
              ))}
            </ul>
          )
        }
        // Numbered list
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={i} style={{ paddingLeft: '1.2em', margin: '0.4em 0', listStyleType: 'decimal' }}>
              {lines.map((l, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: inlineHtml(l.replace(/^\d+\.\s+/, '')) }} />
              ))}
            </ol>
          )
        }
        return <p key={i} style={{ margin: '0.4em 0' }} dangerouslySetInnerHTML={{ __html: inlineHtml(para) }} />
      })}
    </div>
  )
}

function renderBlock(block: ContentBlock) {
  const text = block.content ?? ''
  switch (block.blockType) {
    case 'headline':
      return (
        <div key={block.id} className="article-headline" style={{ marginBottom: '0.5em' }}>
          {text}
        </div>
      )
    case 'body':
      return renderBodyText(text, block.id)
    case 'pullquote':
      return (
        <blockquote key={block.id} className="pull-quote" style={{ margin: '0.75em 0' }}>
          {text}
        </blockquote>
      )
    case 'advertisement':
      return (
        <div key={block.id} className="ad-block" style={{ margin: '0.75em 0', textAlign: 'center', border: '1px solid var(--ink-faded)', padding: '8px', fontStyle: 'italic' }}>
          {text}
        </div>
      )
    case 'section_label':
      return (
        <div key={block.id} className="section-label" style={{ margin: '0.5em 0' }}>
          {text}
        </div>
      )
    case 'rule':
      return <div key={block.id} className="rule-triple" style={{ margin: '0.5em 0' }} />
    default:
      return null
  }
}

export function VictorianTemplate({ pages, navItems, siteName, mastheadTitle, masthead: mh }: Props) {
  const m = { ...DEFAULT_MASTHEAD, ...mh }
  const activePages = pages.length > 0 ? pages : DEFAULT_PAGES
  const navPages = activePages.map((p) => ({ id: p.id, tabNumeral: p.tabNumeral, tabLabel: p.tabLabel, pageOrder: p.pageOrder }))

  return (
    <div className="shell">
      <div className="tab-col tab-col-left" id="tabs-left" />

      <div className="news-viewport" id="viewport">
        {activePages.map((p, i) => {
          const isPlaceholder = pages.length === 0

          // Group blocks by column for multi-column layouts
          const columnCount = p.layout.includes('3') ? 3 : p.layout.includes('2') ? 2 : 1
          const columns: ContentBlock[][] = Array.from({ length: columnCount }, () => [])
          for (const block of p.blocks) {
            const col = Math.min(Math.max((block.column ?? 1) - 1, 0), columnCount - 1)
            columns[col].push(block)
          }
          const hasBlocks = p.blocks.length > 0

          return (
            <div className="page" id={`page-${p.id}`} key={p.id}>
              <div className="page-masthead">
                {i === 0 ? (
                  <>
                    <div className="tagline-row">
                      <span>{m.taglineLeft}</span>
                      <span className="dingbat">{m.taglineCenter}</span>
                      <span>{m.taglineRight}</span>
                    </div>
                    <div className="gazette-name">{mastheadTitle}</div>
                    <div className="tagline-row">
                      <span style={{ fontStyle: 'italic' }}>{m.motto}</span>
                      <span />
                      <span style={{ fontStyle: 'italic' }}>{m.editionDate}</span>
                    </div>
                    <div className="edition-bar">
                      <span>Vol. {m.volume} — No. {m.issueNumber}</span>
                      <span>{m.editionLabel}</span>
                      <span>{m.establishedBy}</span>
                    </div>
                  </>
                ) : (
                  <div className="tagline-row">
                    <span>{mastheadTitle.toUpperCase()}</span>
                    <span className="dingbat">✦</span>
                    <span>{m.editionDate.toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="rule-triple" />
              <div className="rule-ornate">⸻ ✦ ⸻</div>
              <div className="rule-triple" />

              {p.sectionLabel && (
                <div className="section-label" style={{ margin: '4px 0' }}>{p.sectionLabel}</div>
              )}

              <div style={{ padding: '16px 0', minHeight: 200, position: 'relative' }}>
                <CmsBlockArea
                  pageId={p.id}
                  initialBlocks={p.blocks.map((b) => ({
                    id: b.id,
                    blockType: b.blockType,
                    content: b.content ?? '',
                    column: b.column ?? 1,
                    visible: b.visible,
                    blockOrder: b.blockOrder,
                  }))}
                  columnCount={columnCount}
                  layout={p.layout}
                  isPlaceholder={isPlaceholder || !hasBlocks}
                />
              </div>

              <div className="rule-triple" style={{ marginTop: 10 }} />
              <div className="page-footer">
                <span>{siteName}</span>
                <span className="pg-number">PAGE {p.tabNumeral}</span>
                <span>All rights reserved</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="tab-col tab-col-right" id="tabs-right" />

      <VictorianNav pages={navPages} navItems={navItems} />
    </div>
  )
}
