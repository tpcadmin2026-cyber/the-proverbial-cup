import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { NewsletterSignUp } from './NewsletterSignUp'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: `Newsletter`, description: `Subscribe to despatches from the ${siteName}.` }
}

export default async function NewsletterPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('newsletter')) {
    return <FeatureDisabled siteName={siteName} title="Newsletter" message="Our newsletter sign-up is not yet open. Please check back soon." />
  }
  const [heading, subheading, successMessage] = await Promise.all([
    getSetting<string>('newsletter.heading', 'Despatches from the Gazette'),
    getSetting<string>('newsletter.subheading', 'Receive the finest coffee dispatches, seasonal offerings, and editorial intelligence directly to your correspondence box.'),
    getSetting<string>('newsletter.successMessage', 'Splendid! You are now enrolled in our correspondence list.'),
  ])

  return (
    <NewsletterSignUp
      siteName={siteName}
      heading={heading}
      subheading={subheading}
      successMessage={successMessage}
    />
  )
}
