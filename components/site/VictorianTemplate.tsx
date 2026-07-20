import type { CmsPage, ContentBlock, NavItem } from '@prisma/client'
import { VictorianNav } from './VictorianNav'
import { CmsBlockArea, type ProductSummary } from './CmsBlockArea'

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
  products?: ProductSummary[]
  currency?: string
}

const DEFAULT_PAGES: PageWithBlocks[] = [
  { id: 'p1', tabNumeral: 'I',   tabLabel: 'Front Page',         pageOrder: 1, slug: 'front-page',         layout: 'columns-3', published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', tabNumeral: 'II',  tabLabel: 'Foreign & Commerce', pageOrder: 2, slug: 'foreign-commerce',   layout: 'columns-3', published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p3', tabNumeral: 'III', tabLabel: 'Science & Arts',     pageOrder: 3, slug: 'science-arts',       layout: 'columns-3', published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p4', tabNumeral: 'IV',  tabLabel: 'Sport & Letters',    pageOrder: 4, slug: 'sport-letters',      layout: 'columns-3', published: true, showInNav: true, blocks: [], columnRatios: null, sectionLabel: null, footerLeft: null, footerCenter: null, footerRight: null, editionDate: null, volume: null, issueNumber: null, mastheadBar: null, taglineRow: null, publishAt: null, seoTitle: null, seoDescription: null, seoImage: null, customCss: null, customJs: null, createdAt: new Date(), updatedAt: new Date() },
]


export function VictorianTemplate({ pages, navItems, siteName, mastheadTitle, masthead: mh, products = [], currency = 'USD' }: Props) {
  const m = { ...DEFAULT_MASTHEAD, ...mh }
  const activePages = pages.length > 0 ? pages : DEFAULT_PAGES
  const navPages = activePages.map((p) => ({ id: p.id, tabNumeral: p.tabNumeral, tabLabel: p.tabLabel, pageOrder: p.pageOrder, showInNav: p.showInNav }))

  return (
    <div className="shell">
      <div className="site-header">
        <div className="page-masthead">
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
                  }))}
                  columnCount={columnCount}
                  layout={p.layout}
                  isPlaceholder={isPlaceholder || !hasBlocks}
                  products={products}
                  currency={currency}
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

      <VictorianNav pages={navPages} navItems={navItems} />
    </div>
  )
}
