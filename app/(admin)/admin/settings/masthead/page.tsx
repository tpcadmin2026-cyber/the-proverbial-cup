import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { db } from '@/lib/db'
import { getGroupSettings } from '../_shared'

// Settings added after the initial seed — self-healed here so they exist even
// on databases that were seeded before these were introduced (the first admin
// to open this page on any given deploy creates any missing rows).
const SELF_HEALED_SETTINGS: Array<{
  key: string; value: string; label: string; helpText: string
  inputType: string; options?: string
}> = [
  {
    key: 'design.mastheadLogoUrl', value: JSON.stringify(''),
    label: 'Masthead logo',
    helpText: 'Optional — replaces the masthead title text with a logo image. Leave blank to keep the text title. Does not affect the page title used for search engines.',
    inputType: 'image',
  },
  {
    key: 'masthead.titleFont', value: JSON.stringify('Anton'),
    label: 'Title font',
    helpText: 'Font for the big title — only affects the text title, not an uploaded logo image.',
    inputType: 'select',
    options: JSON.stringify([
      { label: 'Anton — Bold Impact', value: 'Anton' },
      { label: 'Playfair Display — Elegant Serif', value: 'Playfair Display' },
      { label: 'Antonio — Condensed', value: 'Antonio' },
      { label: 'UnifrakturMaguntia — Gothic Blackletter', value: 'UnifrakturMaguntia' },
      { label: 'Cinzel — Roman Engraved', value: 'Cinzel' },
    ]),
  },
  {
    key: 'masthead.titleSize', value: JSON.stringify('medium'),
    label: 'Title size', helpText: 'How large the title text renders.',
    inputType: 'select',
    options: JSON.stringify([
      { label: 'Small', value: 'small' },
      { label: 'Medium (default)', value: 'medium' },
      { label: 'Large', value: 'large' },
      { label: 'Extra large', value: 'xlarge' },
    ]),
  },
  {
    key: 'masthead.titleColor', value: JSON.stringify('#35291C'),
    label: 'Title colour', helpText: 'Colour of the title text.', inputType: 'color',
  },
  {
    key: 'masthead.logoHeight', value: JSON.stringify('medium'),
    label: 'Logo size',
    helpText: 'Only used when a masthead logo image is set (above). Small/Large also affect a text title.',
    inputType: 'select',
    options: JSON.stringify([
      { label: 'Small', value: 'small' },
      { label: 'Medium (default)', value: 'medium' },
      { label: 'Large', value: 'large' },
    ]),
  },
  {
    key: 'masthead.showTaglineRow', value: 'true',
    label: 'Show tagline row',
    helpText: 'The decorative line above the title (e.g. "Price Two Pence … For King & Country").',
    inputType: 'toggle',
  },
  {
    key: 'masthead.showMottoRow', value: 'true',
    label: 'Show motto row',
    helpText: 'The line below the title with your motto and the edition date.',
    inputType: 'toggle',
  },
  {
    key: 'masthead.showEditionBar', value: 'true',
    label: 'Show edition bar',
    helpText: 'The volume / issue number / edition label line.',
    inputType: 'toggle',
  },
]

export default async function MastheadSettingsPage() {
  await Promise.all(SELF_HEALED_SETTINGS.map((s) =>
    db.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { ...s, group: 'masthead' },
    })
  ))

  const rows = await getGroupSettings('masthead')
  return (
    <>
      <AdminHeader title="Masthead" subtitle="Edition date, volume, issue number, tagline rows, edition bar content, title font/size/colour, and section visibility." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
