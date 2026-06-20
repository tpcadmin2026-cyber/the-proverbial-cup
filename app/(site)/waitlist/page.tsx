import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { WaitlistForm } from './WaitlistForm'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: `Join the Waitlist`, description: `Reserve your place on the ${siteName} waiting list.` }
}

export default async function WaitlistPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('waitlist')) {
    return <FeatureDisabled siteName={siteName} title="Join the Waitlist" message="Our waitlist is not yet open. Please check back soon." />
  }
  const [heading, subheading, successMessage, showPosition] = await Promise.all([
    getSetting<string>('waitlist.heading', 'Secure Your Place at the Gazette'),
    getSetting<string>('waitlist.subheading', 'We are preparing something rather splendid. Leave your card and we shall write to you the moment subscriptions open.'),
    getSetting<string>('waitlist.successMessage', 'Your card has been received. We shall be in correspondence directly.'),
    getSetting<boolean>('waitlist.showPosition', true),
  ])

  return (
    <WaitlistForm
      siteName={siteName}
      heading={heading}
      subheading={subheading}
      successMessage={successMessage}
      showPosition={showPosition}
    />
  )
}
