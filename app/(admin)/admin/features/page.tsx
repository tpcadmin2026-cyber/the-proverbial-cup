import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Feature Flags' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { FeatureToggle } from '@/components/admin/FeatureToggle'
import { getAllFlags } from '@/lib/features'

const CATEGORY_LABELS: Record<string, string> = {
  general:    'General',
  commerce:   'Commerce & payments',
  engagement: 'Engagement & marketing',
  support:    'Help & support',
}

export default async function FeaturesPage() {
  const flags = await getAllFlags()

  // Group by category
  const grouped = flags.reduce<Record<string, typeof flags>>((acc, flag) => {
    const cat = flag.category ?? 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(flag)
    return acc
  }, {})

  const categoryOrder = ['general', 'commerce', 'engagement', 'support']

  return (
    <>
      <AdminHeader
        title="Features"
        subtitle="Turn each part of your site on or off. Changes take effect immediately — no technical knowledge needed."
      />
      <div className="p-8 space-y-8 max-w-3xl">
        {categoryOrder.map((cat) => {
          const catFlags = grouped[cat]
          if (!catFlags?.length) return null
          return (
            <section key={cat}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <div className="space-y-2">
                {catFlags.map((flag) => (
                  <FeatureToggle
                    key={flag.key}
                    flagKey={flag.key}
                    label={flag.label}
                    description={flag.description}
                    enabled={flag.enabled}
                    category={flag.category}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
