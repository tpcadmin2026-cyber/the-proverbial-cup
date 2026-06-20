import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { ContactForm } from './ContactForm'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return { title: `Contact`, description: `Get in touch with the ${siteName} editorial desk.` }
}

export default async function ContactPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('contact_form')) {
    return <FeatureDisabled siteName={siteName} title="Contact Us" message="Our contact form is not yet available. Please check back soon." />
  }
  const [heading, subheading, successMessage, contactEmail] = await Promise.all([
    getSetting<string>('contact.heading', 'Correspond with the Gazette'),
    getSetting<string>('contact.subheading', 'Address your queries to our editorial desk. We endeavour to reply within two working days.'),
    getSetting<string>('contact.successMessage', 'Your message has been received. We shall be in correspondence directly.'),
    getSetting<string>('site.contactEmail', ''),
  ])

  return (
    <ContactForm
      siteName={siteName}
      heading={heading}
      subheading={subheading}
      successMessage={successMessage}
      contactEmail={contactEmail}
    />
  )
}
