import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface EmailBaseProps {
  previewText: string
  siteName?: string
  logoUrl?: string
  footerText?: string
  children: React.ReactNode
}

const paper   = '#f9f0dc'
const ink     = '#1a0a00'
const gold    = '#8b6914'
const crimson = '#7a1515'
const outer   = '#0d0600'

export function EmailBase({
  previewText,
  siteName = 'The Victorian Illustrated Gazette',
  logoUrl,
  footerText,
  children,
}: EmailBaseProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: outer, margin: 0, padding: '32px 0', fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: paper }}>

          {/* Masthead */}
          <Section style={{ backgroundColor: ink, padding: '0 32px' }}>
            <Text style={{ color: gold, textAlign: 'center', fontSize: 11, letterSpacing: 4, margin: '16px 0 4px', textTransform: 'uppercase' }}>
              ✦ ✦ ✦
            </Text>
            {logoUrl ? (
              <Img src={logoUrl} alt={siteName} width={200} style={{ margin: '0 auto', display: 'block' }} />
            ) : (
              <Text style={{ color: paper, textAlign: 'center', fontSize: 28, fontWeight: 'bold', margin: '4px 0', letterSpacing: 2, lineHeight: 1.2 }}>
                {siteName}
              </Text>
            )}
            <Text style={{ color: gold, textAlign: 'center', fontSize: 10, letterSpacing: 6, margin: '4px 0 16px', textTransform: 'uppercase' }}>
              ─────────────────────
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px 40px' }}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: '#ede1c6', padding: '16px 40px', borderTop: `1px solid ${gold}` }}>
            <Text style={{ color: '#6b5a3e', fontSize: 11, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
              {footerText ?? `© ${siteName} · All Rights Reserved`}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// Shared style helpers exported for use in individual templates
export const styles = {
  heading: {
    color: crimson,
    fontSize: 22,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    margin: '0 0 8px',
    letterSpacing: 1,
  },
  subheading: {
    color: gold,
    fontSize: 11,
    textAlign: 'center' as const,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    margin: '0 0 24px',
  },
  body: {
    color: ink,
    fontSize: 15,
    lineHeight: 1.8,
    margin: '0 0 16px',
  },
  divider: {
    borderColor: gold,
    borderTopWidth: 1,
    margin: '24px 0',
  },
  button: {
    display: 'block' as const,
    backgroundColor: crimson,
    color: paper,
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '14px 32px',
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    margin: '24px auto',
    maxWidth: 280,
    border: `1px solid #5a0f0f`,
  },
  small: {
    color: '#6b5a3e',
    fontSize: 12,
    textAlign: 'center' as const,
    lineHeight: 1.6,
    margin: '8px 0 0',
  },
  label: {
    color: '#6b5a3e',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    margin: '16px 0 4px',
  },
  value: {
    color: ink,
    fontSize: 15,
    margin: '0 0 12px',
    fontWeight: 'bold' as const,
  },
}
