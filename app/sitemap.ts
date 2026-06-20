import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? process.env.NEXTAUTH_URL ?? 'https://example.com').replace(/\/$/, '')

  const [products, kbCategories, kbArticles, plans] = await Promise.all([
    db.product.findMany({ where: { visible: true }, select: { slug: true, updatedAt: true } }),
    db.kbCategory.findMany({ select: { slug: true } }),
    db.kbArticle.findMany({ where: { published: true }, include: { category: { select: { slug: true } } } }),
    db.subscriptionPlan.findMany({ where: { visible: true }, select: { slug: true } }),
  ])

  const static_pages: MetadataRoute.Sitemap = [
    { url: baseUrl,                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${baseUrl}/pricing`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${baseUrl}/quiz`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/shop`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${baseUrl}/help`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${baseUrl}/contact`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/newsletter`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/changelog`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.4 },
    { url: `${baseUrl}/login`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/signup`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${baseUrl}/terms`,       lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${baseUrl}/privacy`,     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]

  const plan_pages: MetadataRoute.Sitemap = plans.map((p) => ({
    url: `${baseUrl}/subscribe/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const product_pages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/shop/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const kb_category_pages: MetadataRoute.Sitemap = kbCategories.map((c) => ({
    url: `${baseUrl}/help/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const kb_article_pages: MetadataRoute.Sitemap = kbArticles.map((a) => ({
    url: `${baseUrl}/help/${(a as any).category.slug}/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [...static_pages, ...plan_pages, ...product_pages, ...kb_category_pages, ...kb_article_pages]
}
