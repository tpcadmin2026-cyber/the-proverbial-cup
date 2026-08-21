import type { CmsPage, ContentBlock, NavItem } from '@prisma/client'
import { VictorianNav } from './VictorianNav'
import { CmsBlockArea, type ProductSummary } from './CmsBlockArea'
import { FooterWrapper } from './FooterWrapper'
import type { EditBlock } from './CmsEditContext'

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
  titleFont: string
  titleSize: string
  titleColor: string
  logoHeight: string
  showTaglineRow: boolean
  showMottoRow: boolean
  showEditionBar: boolean
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
  titleFont:     'Anton',
  titleSize:     'medium',
  titleColor:    '#35291C',
  logoHeight:    'medium',
  showTaglineRow: true,
  showMottoRow:   true,
  showEditionBar: true,
}

const TITLE_FONT_STACK: Record<string, string> = {
  Anton: "'Anton', sans-serif",
  'Playfair Display': "'Playfair Display', serif",
  Antonio: "'Antonio', sans-serif",
  UnifrakturMaguntia: "'UnifrakturMaguntia', cursive",
  Cinzel: "'Cinzel', serif",
}

const TITLE_SIZE_CLAMP: Record<string, string> = {
  small:  'clamp(1.1rem, 2.6vw, 2.4rem)',
  medium: 'clamp(1.6rem, 3.5vw, 3.4rem)',
  large:  'clamp(2.1rem, 4.6vw, 4.4rem)',
  xlarge: 'clamp(2.6rem, 5.8vw, 5.6rem)',
}

const LOGO_HEIGHT_CLAMP: Record<string, string> = {
  small:  'clamp(1.6rem, 3.6vw, 3rem)',
  medium: 'clamp(2.2rem, 5vw, 4.2rem)',
  large:  'clamp(2.8rem, 6.4vw, 5.4rem)',
}

interface Props {
  pages: PageWithBlocks[]
  navItems: NavItem[]
  siteName: string
  mastheadTitle: string
  mastheadLogoUrl?: string
  masthead?: Masthead
  products?: ProductSummary[]
  currency?: string
  currentUser?: { name: string | null; email: string; planName: string | null } | null
  headerPageId?: string
  headerBlocks?: EditBlock[]
}

const DEFAULT_PAGES: PageWithBlocks[] = [
  { id: 'p1', tabNumeral: 'I',   tabLabel: 'Front Page',         pageOrder: 1, slug: 'front-page',         layout: 'columns-3', pageType: 'content', sentAt: null, published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', tabNumeral: 'II',  tabLabel: 'Foreign & Commerce', pageOrder: 2, slug: 'foreign-commerce',   layout: 'columns-3', pageType: 'content', sentAt: null, published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p3', tabNumeral: 'III', tabLabel: 'Science & Arts',     pageOrder: 3, slug: 'science-arts',       layout: 'columns-3', pageType: 'content', sentAt: null, published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p4', tabNumeral: 'IV',  tabLabel: 'Sport & Letters',    pageOrder: 4, slug: 'sport-letters',      layout: 'columns-3', pageType: 'content', sentAt: null, published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
]


export function VictorianTemplate({ pages, navItems, siteName, mastheadTitle, mastheadLogoUrl, masthead: mh, products = [], currency = 'USD', currentUser = null, headerPageId, headerBlocks = [] }: Props) {
  const m = { ...DEFAULT_MASTHEAD, ...mh }
  const activePages = pages.length > 0 ? pages : DEFAULT_PAGES
  const navPages = activePages.map((p) => ({ id: p.id, tabNumeral: p.tabNumeral, tabLabel: p.tabLabel, pageOrder: p.pageOrder, showInNav: p.showInNav }))

  return (
    <div className="shell">
      <div className="site-header">
        {headerBlocks.length > 0 && headerPageId && (
          <div style={{ marginBottom: '4px' }}>
            <CmsBlockArea
              pageId={headerPageId}
              initialBlocks={headerBlocks}
              columnCount={3}
              layout="columns-3"
              isPlaceholder={false}
              products={products}
              currency={currency}
              currentUser={currentUser}
            />
          </div>
        )}
        <div className="page-masthead">
          {m.showTaglineRow && (
            <div className="tagline-row">
              <span>{m.taglineLeft}</span>
              <span className="dingbat">{m.taglineCenter}</span>
              <span>{m.taglineRight}</span>
            </div>
          )}
          {mastheadLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={mastheadLogoUrl}
              alt={mastheadTitle}
              className="gazette-logo"
              style={{ height: LOGO_HEIGHT_CLAMP[m.logoHeight] ?? LOGO_HEIGHT_CLAMP.medium }}
            />
          ) : (
            <div
              className="gazette-name"
              style={{
                fontFamily: TITLE_FONT_STACK[m.titleFont] ?? TITLE_FONT_STACK.Anton,
                fontSize: TITLE_SIZE_CLAMP[m.titleSize] ?? TITLE_SIZE_CLAMP.medium,
                color: m.titleColor || 'var(--ink)',
              }}
            >
              {mastheadTitle}
            </div>
          )}
          {m.showMottoRow && (
            <div className="tagline-row">
              <span style={{ fontStyle: 'italic' }}>{m.motto}</span>
              <span />
              <span style={{ fontStyle: 'italic' }}>{m.editionDate}</span>
            </div>
          )}
          {m.showEditionBar && (
            <div className="edition-bar">
              <span>Vol. {m.volume} — No. {m.issueNumber}</span>
              <span>{m.editionLabel}</span>
              <span>{m.establishedBy}</span>
            </div>
          )}
        </div>

        <div className="rule-triple" />

        <div className="nav-bar-horizontal" id="tabs-bar" />
      </div>

      <div className="news-viewport" id="viewport">
        {activePages.map((p) => {
          const isPlaceholder = pages.length === 0

          const columnCount = p.layout.includes('3') ? 3 : p.layout.includes('2') ? 2 : 1
          const hasBlocks = p.blocks.length > 0

          return (
            <div className="page" id={`page-${p.id}`} key={p.id}>
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
                    colSpan: b.colSpan ?? 1,
                    visible: b.visible,
                    blockOrder: b.blockOrder,
                    blockKey: b.blockKey,
                    overlayOf: b.overlayOf,
                    overlayPosition: b.overlayPosition,
                    overlayOffsetX: b.overlayOffsetX,
                    overlayOffsetY: b.overlayOffsetY,
                  }))}
                  columnCount={columnCount}
                  layout={p.layout}
                  isPlaceholder={isPlaceholder || !hasBlocks}
                  products={products}
                  currency={currency}
                  currentUser={currentUser}
                />
              </div>

              <div className="rule-triple" style={{ marginTop: 10 }} />
              <div className="page-footer">
                <span>{siteName}</span>
                <span className="pg-number">PAGE {p.tabNumeral}</span>
                <span>All rights reserved</span>
              </div>

              {/* The site footer lives inside each page's own scrollable area,
                  not after .shell — .shell is a fixed one-screen viewport with
                  .page handling its own internal scroll, so a footer placed
                  after .shell would need the OUTER page to scroll too, which
                  creates two competing scroll containers on screen at once
                  (scrolling near the boundary between them feels "stuck"). */}
              <div style={{ marginTop: '20px' }}>
                <FooterWrapper />
              </div>
            </div>
          )
        })}
      </div>

      <VictorianNav pages={navPages} navItems={navItems} />
    </div>
  )
}
