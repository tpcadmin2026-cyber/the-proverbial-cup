import { db } from './db'

// Header and footer content are stored as CmsPages with a special `pageType`,
// reusing the same ContentBlock + block-editor system as regular pages
// instead of a separate model. They never appear as newspaper tabs and are
// excluded from every query that lists ordinary pages.
export const HEADER_SLUG = '__header__'
export const FOOTER_SLUG = '__footer__'

export async function ensureHeaderFooterPages() {
  await Promise.all([
    db.cmsPage.upsert({
      where: { slug: HEADER_SLUG },
      update: { layout: 'columns-3' },
      create: {
        slug: HEADER_SLUG,
        tabLabel: 'Header',
        tabNumeral: '',
        pageOrder: 0,
        pageType: 'header',
        layout: 'columns-3',
        published: true,
        showInNav: false,
      },
    }),
    db.cmsPage.upsert({
      where: { slug: FOOTER_SLUG },
      update: {},
      create: {
        slug: FOOTER_SLUG,
        tabLabel: 'Footer',
        tabNumeral: '',
        pageOrder: 0,
        pageType: 'footer',
        layout: 'columns-3',
        published: true,
        showInNav: false,
      },
    }),
  ])
}

export async function getHeaderPage() {
  await ensureHeaderFooterPages()
  return db.cmsPage.findUniqueOrThrow({
    where: { slug: HEADER_SLUG },
    include: { blocks: { where: { visible: true }, orderBy: { blockOrder: 'asc' } } },
  })
}

export async function getFooterPage() {
  await ensureHeaderFooterPages()
  return db.cmsPage.findUniqueOrThrow({
    where: { slug: FOOTER_SLUG },
    include: { blocks: { where: { visible: true }, orderBy: { blockOrder: 'asc' } } },
  })
}
