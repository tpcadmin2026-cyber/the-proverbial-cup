import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateData {
  templateVersion: string
  generatedAt: string
  meta: {
    name: string        // e.g. "The Victorian Illustrated Gazette"
    description: string // short blurb shown in setup wizard
    category: string    // e.g. "coffee subscription" | "newsletter" | "ecommerce"
    thumbnail: string | null
  }
  settings: Array<{ key: string; value: string; group: string; label: string; helpText: string | null; inputType: string; options: string | null }>
  featureFlags: Array<{ key: string; enabled: boolean }>
  navItems: Array<{ label: string; numeral: string; href: string; navOrder: number; visible: boolean; openInNewTab: boolean }>
  cmsPages: Array<{
    slug: string; tabLabel: string; tabNumeral: string; pageOrder: number; layout: string
    columnRatios: string | null; sectionLabel: string | null; footerLeft: string | null
    footerCenter: string | null; footerRight: string | null; published: boolean
    seoTitle: string | null; seoDescription: string | null
    blocks: Array<{ blockType: string; content: string | null; blockOrder: number; visible: boolean; column: number | null; colSpan: number }>
  }>
  subscriptionPlans: Array<{
    slug: string; name: string; description: string | null; priceMonthly: number | null
    priceYearly: number | null; trialDays: number; features: string | null
    highlightFeature: string | null; isHighlighted: boolean; highlightLabel: string | null
    visible: boolean; displayOrder: number; maxPauseDays: number
    stripePriceIdMonthly: string | null; stripePriceIdYearly: string | null
  }>
  kbCategories: Array<{
    slug: string; name: string; description: string | null; order: number
    articles: Array<{ slug: string; title: string; body: string; published: boolean }>
  }>
  pauseReminders: Array<{ daysBeforeResume: number; subject: string; bodyText: string; active: boolean; order: number }>
  cancelReasons: Array<{ label: string; order: number; active: boolean; allowFreeText: boolean }>
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function exportTemplate(): Promise<TemplateData> {
  const [
    settings,
    featureFlags,
    navItems,
    cmsPages,
    subscriptionPlans,
    kbCategories,
    pauseReminders,
    cancelReasons,
  ] = await Promise.all([
    db.setting.findMany({ orderBy: { key: 'asc' } }),
    db.featureFlag.findMany({ orderBy: { key: 'asc' } }),
    db.navItem.findMany({ orderBy: { navOrder: 'asc' } }),
    db.cmsPage.findMany({
      orderBy: { pageOrder: 'asc' },
      include: { blocks: { orderBy: { blockOrder: 'asc' } } },
    }),
    db.subscriptionPlan.findMany({ orderBy: { displayOrder: 'asc' } }),
    db.kbCategory.findMany({
      orderBy: { order: 'asc' },
      include: { articles: { orderBy: { createdAt: 'asc' } } },
    }),
    db.pauseReminder.findMany({ orderBy: { order: 'asc' } }),
    db.cancelReason.findMany({ orderBy: { order: 'asc' } }),
  ])

  const siteName = settings.find((s) => s.key === 'site.name')?.value?.replace(/^"|"$/g, '') ?? 'My Site'

  return {
    templateVersion: '1.0',
    generatedAt: new Date().toISOString(),
    meta: {
      name: siteName,
      description: settings.find((s) => s.key === 'site.tagline')?.value?.replace(/^"|"$/g, '') ?? '',
      category: 'coffee subscription',
      thumbnail: null,
    },
    settings: settings.map(({ key, value, group, label, helpText, inputType, options }) => ({
      key, value, group, label, helpText, inputType, options,
    })),
    featureFlags: featureFlags.map(({ key, enabled }) => ({ key, enabled })),
    navItems: navItems.map(({ label, numeral, href, navOrder, visible, openInNewTab }) => ({
      label, numeral, href, navOrder, visible, openInNewTab,
    })),
    cmsPages: cmsPages.map(({ slug, tabLabel, tabNumeral, pageOrder, layout, columnRatios, sectionLabel, footerLeft, footerCenter, footerRight, published, seoTitle, seoDescription, blocks }) => ({
      slug, tabLabel, tabNumeral, pageOrder, layout, columnRatios, sectionLabel,
      footerLeft, footerCenter, footerRight, published, seoTitle, seoDescription,
      blocks: blocks.map(({ blockType, content, blockOrder, visible, column, colSpan }) => ({
        blockType, content, blockOrder, visible, column, colSpan,
      })),
    })),
    subscriptionPlans: subscriptionPlans.map(({ slug, name, description, priceMonthly, priceYearly, trialDays, features, highlightFeature, isHighlighted, highlightLabel, visible, displayOrder, maxPauseDays, stripePriceIdMonthly, stripePriceIdYearly }) => ({
      slug, name, description, priceMonthly, priceYearly, trialDays, features,
      highlightFeature, isHighlighted, highlightLabel, visible, displayOrder, maxPauseDays,
      stripePriceIdMonthly, stripePriceIdYearly,
    })),
    kbCategories: kbCategories.map(({ slug, name, description, order, articles }) => ({
      slug, name, description, order,
      articles: articles.map(({ slug, title, body, published }) => ({
        slug, title, body, published,
      })),
    })),
    pauseReminders: pauseReminders.map(({ daysBeforeResume, subject, bodyText, active, order }) => ({ daysBeforeResume, subject, bodyText, active, order })),
    cancelReasons: cancelReasons.map(({ label, order, active, allowFreeText }) => ({ label, order, active, allowFreeText })),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function importTemplate(data: TemplateData): Promise<{ imported: string[] }> {
  const imported: string[] = []

  // Settings — upsert by key
  if (data.settings?.length) {
    for (const s of data.settings) {
      await db.setting.upsert({
        where: { key: s.key },
        update: { value: s.value },
        create: { key: s.key, value: s.value, group: s.group, label: s.label, helpText: s.helpText, inputType: s.inputType, options: s.options },
      })
    }
    imported.push(`${data.settings.length} settings`)
  }

  // Feature flags — upsert by key
  if (data.featureFlags?.length) {
    for (const f of data.featureFlags) {
      await db.featureFlag.updateMany({ where: { key: f.key }, data: { enabled: f.enabled } })
    }
    imported.push(`${data.featureFlags.length} feature flags`)
  }

  // Nav items — replace all
  if (data.navItems?.length) {
    await db.navItem.deleteMany()
    await db.navItem.createMany({ data: data.navItems })
    imported.push(`${data.navItems.length} nav items`)
  }

  // CMS pages + blocks — replace all
  if (data.cmsPages?.length) {
    await db.contentBlock.deleteMany()
    await db.cmsPage.deleteMany()
    for (const page of data.cmsPages) {
      const { blocks, ...pageData } = page
      const created = await db.cmsPage.create({ data: pageData })
      if (blocks?.length) {
        await db.contentBlock.createMany({
          data: blocks.map((b) => ({ ...b, pageId: created.id })),
        })
      }
    }
    imported.push(`${data.cmsPages.length} CMS pages`)
  }

  // Subscription plans — upsert by slug
  if (data.subscriptionPlans?.length) {
    for (const plan of data.subscriptionPlans) {
      await db.subscriptionPlan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
      })
    }
    imported.push(`${data.subscriptionPlans.length} subscription plans`)
  }

  // KB categories + articles — upsert by slug
  if (data.kbCategories?.length) {
    for (const cat of data.kbCategories) {
      const { articles, slug, name, description, order } = cat
      const category = await db.kbCategory.upsert({
        where: { slug },
        update: { name, description, order },
        create: { slug, name, description, order },
      })
      if (articles?.length) {
        for (const article of articles) {
          const { slug, title, body, published } = article
          await db.kbArticle.upsert({
            where: { slug },
            update: { title, body, published, categoryId: category.id },
            create: { slug, title, body, published, categoryId: category.id },
          })
        }
      }
    }
    imported.push(`${data.kbCategories.length} KB categories`)
  }

  // Pause reminders — replace
  if (data.pauseReminders?.length) {
    await db.pauseReminder.deleteMany()
    await db.pauseReminder.createMany({ data: data.pauseReminders })
    imported.push(`${data.pauseReminders.length} pause reminders`)
  }

  // Cancel reasons — replace
  if (data.cancelReasons?.length) {
    await db.cancelReason.deleteMany()
    await db.cancelReason.createMany({ data: data.cancelReasons })
    imported.push(`${data.cancelReasons.length} cancel reasons`)
  }

  return { imported }
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP — seed fresh instance from template + create master admin
// ─────────────────────────────────────────────────────────────────────────────

export async function setupFromTemplate(
  template: TemplateData,
  adminEmail: string,
  adminPassword: string,
  adminName: string,
  overrides: { siteName?: string; tagline?: string; contactEmail?: string }
): Promise<void> {
  // Apply template
  await importTemplate(template)

  // Apply site-name overrides so the new site has its own identity
  if (overrides.siteName) {
    await db.setting.updateMany({ where: { key: 'site.name' }, data: { value: JSON.stringify(overrides.siteName) } })
  }
  if (overrides.tagline) {
    await db.setting.updateMany({ where: { key: 'site.tagline' }, data: { value: JSON.stringify(overrides.tagline) } })
  }
  if (overrides.contactEmail) {
    await db.setting.updateMany({ where: { key: 'site.contactEmail' }, data: { value: JSON.stringify(overrides.contactEmail) } })
  }

  // Create master admin user
  const passwordHash = await hashPassword(adminPassword)
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'master_admin', name: adminName, passwordHash, emailVerified: new Date() },
    create: { email: adminEmail, name: adminName, role: 'master_admin', passwordHash, emailVerified: new Date() },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECT SETUP NEEDED — no settings exist means fresh install
// ─────────────────────────────────────────────────────────────────────────────

export async function isSetupNeeded(): Promise<boolean> {
  try {
    const count = await db.setting.count()
    return count === 0
  } catch {
    return false
  }
}
