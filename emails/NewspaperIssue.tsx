import { Hr, Img, Link, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailBase, styles } from './EmailBase'
import { richTextToHtml } from '@/lib/richText'

interface IssueBlock {
  blockType: string
  content: string
}

interface NewspaperIssueProps {
  title: string
  blocks: IssueBlock[]
  siteName?: string
  footerText?: string
  logoUrl?: string
  unsubscribeUrl?: string
}

function parseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T } catch { return fallback }
}

// Renders a stripped-down, email-safe version of the newspaper's content blocks —
// no CSS grid/flex (unsupported by most email clients), no video/table/account/HTML
// blocks (scripts and iframes get stripped by every mail provider anyway).
function BlockEmail({ block }: { block: IssueBlock }) {
  const text = block.content ?? ''
  switch (block.blockType) {
    case 'headline':
      return <Text style={{ ...styles.heading, marginBottom: 4 }}>{text}</Text>
    case 'subheadline':
      return <Text style={{ ...styles.subheading, marginTop: 0 }}>{text}</Text>
    case 'byline':
    case 'dateline':
      return <Text style={{ ...styles.small, fontStyle: 'italic' }}>{text}</Text>
    case 'body':
    case 'advertisement':
      return <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a0a00', marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: richTextToHtml(text) }} />
    case 'pullquote':
      return (
        <Text style={{ fontSize: 17, fontStyle: 'italic', borderLeft: '3px solid #8b6914', paddingLeft: 16, margin: '20px 0', color: '#1a0a00' }}>
          {text.replace(/<[^>]+>/g, '')}
        </Text>
      )
    case 'image': {
      const d = parseJson<{ url: string; alt: string; caption: string }>(text, { url: '', alt: '', caption: '' })
      if (!d.url) return null
      return (
        <Section style={{ margin: '16px 0', textAlign: 'center' as const }}>
          <Img src={d.url} alt={d.alt} width={520} style={{ maxWidth: '100%', margin: '0 auto' }} />
          {d.caption && <Text style={styles.small}>{d.caption}</Text>}
        </Section>
      )
    }
    case 'cta': {
      const d = parseJson<{ text: string; url: string }>(text, { text: 'Read more', url: '/' })
      if (!d.url) return null
      return (
        <Section style={{ textAlign: 'center' as const, margin: '20px 0' }}>
          <Link href={d.url} style={styles.button}>{d.text || 'Read more'}</Link>
        </Section>
      )
    }
    case 'section_label':
      return <Text style={{ ...styles.subheading, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{text}</Text>
    case 'rule':
    case 'ornament':
      return <Hr style={styles.divider} />
    case 'spacer':
      return <div style={{ height: Math.min(parseInt(text) || 24, 60) }} />
    default:
      return null // video/table/featured_products/account_widget/html/blank don't translate to email
  }
}

export function NewspaperIssue({ title, blocks, siteName, footerText, logoUrl, unsubscribeUrl }: NewspaperIssueProps) {
  return (
    <EmailBase previewText={title} siteName={siteName} footerText={footerText} logoUrl={logoUrl}>
      {blocks.map((b, i) => <BlockEmail key={i} block={b} />)}
      {unsubscribeUrl && (
        <>
          <Hr style={styles.divider} />
          <Text style={styles.small}>
            You are receiving this because you subscribed to our newsletter.{' '}
            <Link href={unsubscribeUrl} style={{ color: '#7a1515' }}>Unsubscribe</Link>
          </Text>
        </>
      )}
    </EmailBase>
  )
}

export default NewspaperIssue
