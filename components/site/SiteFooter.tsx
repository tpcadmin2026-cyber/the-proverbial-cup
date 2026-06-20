import Link from 'next/link'

interface Props {
  siteName: string
  copyright: string
  contactEmail: string
  address: string
  termsUrl: string
  privacyUrl: string
  twitter: string
  instagram: string
  facebook: string
  showChangelog: boolean
}

export function SiteFooter({ siteName, copyright, contactEmail, address, termsUrl, privacyUrl, twitter, instagram, facebook, showChangelog }: Props) {
  const hasAddress = address.trim() !== ''
  const hasSocial = twitter || instagram || facebook

  return (
    <footer style={{ borderTop: '3px double var(--accent)', marginTop: '2rem', padding: '1.5rem 1rem', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--ink-faded)', lineHeight: '1.8' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        {/* Ornament */}
        <div style={{ fontSize: '1rem', letterSpacing: '0.3em', marginBottom: '0.75rem', color: 'var(--gold)' }}>
          ⸻ ✦ ⸻
        </div>

        {/* Site name */}
        <div style={{ fontFamily: 'var(--font-masthead)', fontSize: '1rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
          {siteName}
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem 1.2rem', marginBottom: '0.75rem' }}>
          <Link href="/" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Home</Link>
          <Link href="/pricing" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Subscribe</Link>
          <Link href="/quiz" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Find your plan</Link>
          <Link href="/shop" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Shop</Link>
          <Link href="/help" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Help</Link>
          <Link href="/contact" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Contact</Link>
          {showChangelog && (
            <Link href="/changelog" style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Updates</Link>
          )}
          {termsUrl && <Link href={termsUrl} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Terms</Link>}
          {privacyUrl && <Link href={privacyUrl} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>Privacy</Link>}
        </div>

        {/* Social links */}
        {hasSocial && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
            {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>𝕏</a>}
            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Instagram</a>}
            {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Facebook</a>}
          </div>
        )}

        {/* Address */}
        {hasAddress && (
          <div style={{ marginBottom: '0.5rem', whiteSpace: 'pre-line' }}>{address}</div>
        )}

        {/* Contact email */}
        {contactEmail && (
          <div style={{ marginBottom: '0.5rem' }}>
            <a href={`mailto:${contactEmail}`} style={{ color: 'var(--link-color)', textDecoration: 'none' }}>{contactEmail}</a>
          </div>
        )}

        {/* Copyright */}
        <div style={{ marginTop: '0.5rem' }}>{copyright}</div>

      </div>
    </footer>
  )
}
