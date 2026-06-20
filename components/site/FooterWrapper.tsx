import { getSetting } from '@/lib/settings'
import { SiteFooter } from './SiteFooter'

export async function FooterWrapper() {
  const [siteName, copyright, contactEmail, address, termsUrl, privacyUrl, twitter, instagram, facebook, showChangelog] = await Promise.all([
    getSetting<string>('site.name',             'The Victorian Illustrated Gazette'),
    getSetting<string>('site.copyrightText',    '© The Victorian Illustrated Gazette. All rights reserved.'),
    getSetting<string>('site.contactEmail',     ''),
    getSetting<string>('site.address',          ''),
    getSetting<string>('site.termsUrl',         ''),
    getSetting<string>('site.privacyUrl',       ''),
    getSetting<string>('site.social.twitter',   ''),
    getSetting<string>('site.social.instagram', ''),
    getSetting<string>('site.social.facebook',  ''),
    getSetting<boolean>('changelog.public',     false),
  ])

  return (
    <SiteFooter
      siteName={siteName}
      copyright={copyright}
      contactEmail={contactEmail}
      address={address}
      termsUrl={termsUrl}
      privacyUrl={privacyUrl}
      twitter={twitter}
      instagram={instagram}
      facebook={facebook}
      showChangelog={showChangelog}
    />
  )
}
