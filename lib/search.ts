// Full-text search engine using PostgreSQL tsvector/tsquery.
// Weighted fields: title/focusKw (A) > tags (B) > excerpt (C) > body (D)
// Boost multiplier set per-content-item via SeoMeta.searchBoost.

import { db } from './db'
import { Prisma } from '@prisma/client'

export type ContentType = 'article' | 'product' | 'plan' | 'page'

export interface SearchResult {
  id: string
  contentType: string
  contentId: string
  title: string
  excerpt: string | null
  url: string
  imageUrl: string | null
  boost: number
  rank: number
  highlighted: string | null
}

export interface SearchOptions {
  type?: ContentType
  limit?: number
  offset?: number
}

// ── Public search ──────────────────────────────────────────────────────────────

export async function searchContent(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const { type, limit = 20, offset = 0 } = options
  if (!query.trim()) return []

  // Sanitise: remove characters that break tsquery
  const safeQuery = query.replace(/[!&|*():'"\\]/g, ' ').trim()
  if (!safeQuery) return []

  try {
    const typeFilter = type ? Prisma.sql`AND "contentType" = ${type}` : Prisma.empty

    const results = await db.$queryRaw<SearchResult[]>`
      SELECT
        id,
        "contentType",
        "contentId",
        title,
        excerpt,
        url,
        "imageUrl",
        boost,
        ts_rank_cd(
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce("focusKw", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(tags, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(body, '')), 'D'),
          plainto_tsquery('english', ${safeQuery}),
          32
        ) * boost AS rank,
        ts_headline(
          'english',
          coalesce(excerpt, left(body, 500)),
          plainto_tsquery('english', ${safeQuery}),
          'MaxWords=35, MinWords=15, MaxFragments=2, StartSel=§§, StopSel=§§'
        ) AS highlighted
      FROM "SearchIndex"
      WHERE
        published = true
        ${typeFilter}
        AND (
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce("focusKw", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(tags, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(body, '')), 'D')
        ) @@ plainto_tsquery('english', ${safeQuery})
      ORDER BY rank DESC, "updatedAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    return results
  } catch (err) {
    // Fallback to simple LIKE search if FTS fails (e.g. empty index)
    console.error('[search] FTS query failed, falling back to LIKE:', err)
    return db.searchIndex.findMany({
      where: {
        published: true,
        ...(type ? { contentType: type } : {}),
        OR: [
          { title:   { contains: safeQuery, mode: 'insensitive' } },
          { excerpt: { contains: safeQuery, mode: 'insensitive' } },
          { body:    { contains: safeQuery, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      orderBy: [{ boost: 'desc' }, { updatedAt: 'desc' }],
    }).then(rows => rows.map(r => ({ ...r, rank: 0, highlighted: null })))
  }
}

// Count results per type for filter badges
export async function searchFacets(query: string): Promise<Record<string, number>> {
  const safeQuery = query.replace(/[!&|*():'"\\]/g, ' ').trim()
  if (!safeQuery) return {}

  try {
    const rows = await db.$queryRaw<{ contentType: string; count: bigint }[]>`
      SELECT "contentType", count(*)::int AS count
      FROM "SearchIndex"
      WHERE
        published = true
        AND (
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce("focusKw", '')), 'A') ||
          setweight(to_tsvector('english', coalesce(tags, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(excerpt, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(body, '')), 'D')
        ) @@ plainto_tsquery('english', ${safeQuery})
      GROUP BY "contentType"
    `
    return Object.fromEntries(rows.map(r => [r.contentType, Number(r.count)]))
  } catch {
    return {}
  }
}

// ── Index management ──────────────────────────────────────────────────────────

async function getSeoMeta(contentType: string, contentId: string) {
  return db.seoMeta.findUnique({ where: { contentType_contentId: { contentType, contentId } } })
}

// Upsert a single article into the index
export async function indexArticle(articleId: string) {
  const article = await db.kbArticle.findUnique({
    where: { id: articleId },
    include: { category: true },
  })
  if (!article) return
  const seo = await getSeoMeta('article', articleId)

  await db.searchIndex.upsert({
    where: { contentType_contentId: { contentType: 'article', contentId: articleId } },
    create: {
      contentType: 'article',
      contentId:   articleId,
      title:       seo?.seoTitle    || article.title,
      focusKw:     seo?.focusKeyword || null,
      tags:        [article.category.name, seo?.altKeywords || ''].filter(Boolean).join(', '),
      excerpt:     seo?.seoDescription || article.body.replace(/[#*_\[\]]/g, '').slice(0, 250),
      body:        article.body,
      url:         `/help/${article.category.slug}/${article.slug}`,
      boost:       seo?.searchBoost ?? 1.0,
      published:   article.published && !(seo?.noIndex ?? false),
    },
    update: {
      title:    seo?.seoTitle    || article.title,
      focusKw:  seo?.focusKeyword || null,
      tags:     [article.category.name, seo?.altKeywords || ''].filter(Boolean).join(', '),
      excerpt:  seo?.seoDescription || article.body.replace(/[#*_\[\]]/g, '').slice(0, 250),
      body:     article.body,
      boost:    seo?.searchBoost ?? 1.0,
      published: article.published && !(seo?.noIndex ?? false),
      updatedAt: new Date(),
    },
  })
}

// Upsert a single product into the index
export async function indexProduct(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) return
  const seo = await getSeoMeta('product', productId)

  const body = [product.name, product.description || ''].join(' ')
  await db.searchIndex.upsert({
    where: { contentType_contentId: { contentType: 'product', contentId: productId } },
    create: {
      contentType: 'product',
      contentId:   productId,
      title:       seo?.seoTitle    || product.name,
      focusKw:     seo?.focusKeyword || null,
      tags:        seo?.altKeywords  || null,
      excerpt:     seo?.seoDescription || product.description?.slice(0, 250) || null,
      body,
      url:         `/shop/${product.slug}`,
      boost:       seo?.searchBoost ?? 1.0,
      published:   product.visible && !(seo?.noIndex ?? false),
    },
    update: {
      title:     seo?.seoTitle    || product.name,
      focusKw:   seo?.focusKeyword || null,
      tags:      seo?.altKeywords  || null,
      excerpt:   seo?.seoDescription || product.description?.slice(0, 250) || null,
      body,
      boost:     seo?.searchBoost ?? 1.0,
      published: product.visible && !(seo?.noIndex ?? false),
      updatedAt: new Date(),
    },
  })
}

// Upsert a subscription plan into the index
export async function indexPlan(planId: string) {
  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan) return
  const seo = await getSeoMeta('plan', planId)

  const body = [plan.name, plan.description, plan.features].filter(Boolean).join(' ')
  await db.searchIndex.upsert({
    where: { contentType_contentId: { contentType: 'plan', contentId: planId } },
    create: {
      contentType: 'plan',
      contentId:   planId,
      title:       seo?.seoTitle    || plan.name,
      focusKw:     seo?.focusKeyword || null,
      tags:        seo?.altKeywords  || 'subscription coffee',
      excerpt:     seo?.seoDescription || plan.description || null,
      body,
      url:         `/subscribe/${plan.slug}`,
      boost:       (seo?.searchBoost ?? 1.0) * 1.2, // plans get a slight default boost
      published:   plan.visible && !(seo?.noIndex ?? false),
    },
    update: {
      title:     seo?.seoTitle    || plan.name,
      focusKw:   seo?.focusKeyword || null,
      tags:      seo?.altKeywords  || 'subscription coffee',
      excerpt:   seo?.seoDescription || plan.description || null,
      body,
      boost:     (seo?.searchBoost ?? 1.0) * 1.2,
      published: plan.visible && !(seo?.noIndex ?? false),
      updatedAt: new Date(),
    },
  })
}

// Upsert a CMS page into the index (uses existing seoTitle/seoDescription on CmsPage)
export async function indexPage(pageId: string) {
  const page = await db.cmsPage.findUnique({
    where: { id: pageId },
    include: { blocks: true },
  })
  if (!page) return

  const bodyText = page.blocks
    .map((b) => { try { return JSON.parse(b.content || '{}').text || '' } catch { return '' } })
    .join(' ')

  await db.searchIndex.upsert({
    where: { contentType_contentId: { contentType: 'page', contentId: pageId } },
    create: {
      contentType: 'page',
      contentId:   pageId,
      title:       page.seoTitle      || page.tabLabel,
      focusKw:     null,
      tags:        page.sectionLabel  || null,
      excerpt:     page.seoDescription || null,
      body:        bodyText,
      url:         `/?page=${page.slug}`,
      imageUrl:    page.seoImage      || null,
      boost:       0.8,
      published:   page.published,
    },
    update: {
      title:     page.seoTitle      || page.tabLabel,
      excerpt:   page.seoDescription || null,
      body:      bodyText,
      imageUrl:  page.seoImage      || null,
      published: page.published,
      updatedAt: new Date(),
    },
  })
}

// Full index rebuild — call from admin or on deploy
export async function rebuildSearchIndex(): Promise<{ indexed: number }> {
  await db.searchIndex.deleteMany()

  const [articles, products, plans, pages] = await Promise.all([
    db.kbArticle.findMany({ include: { category: true } }),
    db.product.findMany(),
    db.subscriptionPlan.findMany(),
    db.cmsPage.findMany({ include: { blocks: true } }),
  ])

  await Promise.all([
    ...articles.map(a => indexArticle(a.id)),
    ...products.map(p => indexProduct(p.id)),
    ...plans.map(p => indexPlan(p.id)),
    ...pages.map(p => indexPage(p.id)),
  ])

  return { indexed: articles.length + products.length + plans.length + pages.length }
}

// Remove a single item from the index (call on delete)
export async function removeFromIndex(contentType: string, contentId: string) {
  await db.searchIndex.deleteMany({ where: { contentType, contentId } })
}
