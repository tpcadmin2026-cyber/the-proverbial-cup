import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { db } from '@/lib/db'
import { getGroupSettings } from '../_shared'

// Same font list as the seed — curated to what's actually loaded via the Google
// Fonts <link> in app/layout.tsx, so picking one always does something visible.
const FONT_OPTIONS = JSON.stringify([
  { label: 'Playfair Display — Elegant Serif', value: 'Playfair Display' },
  { label: 'Libre Baskerville — Classic Serif', value: 'Libre Baskerville' },
  { label: 'Anton — Bold Impact', value: 'Anton' },
  { label: 'Antonio — Condensed', value: 'Antonio' },
  { label: 'Cinzel — Roman Engraved', value: 'Cinzel' },
  { label: 'UnifrakturMaguntia — Gothic Blackletter', value: 'UnifrakturMaguntia' },
])

// These settings existed in the database already (seeded before this page was
// wired up to actually apply anything), but their label/helpText/inputType may
// be stale relative to the current seed definition below — refreshed on every
// load so admins editing this page see the current, correct controls. This never
// touches `value`, so nobody's actual saved colour/font choice is overwritten.
const DESIGN_SETTINGS_DEFS: Array<{
  key: string; label: string; helpText: string; inputType: string; options?: string; defaultValue: string
}> = [
  { key: 'design.bgColor', label: 'Background colour', helpText: 'The main background colour of your site, behind the paper texture.', inputType: 'color', defaultValue: JSON.stringify('#E8E6D8') },
  { key: 'design.paperColor', label: 'Page / paper colour', helpText: 'The colour of the newspaper page surface itself. Leave transparent to let the background texture show through.', inputType: 'color', defaultValue: JSON.stringify('transparent') },
  { key: 'design.inkColor', label: 'Ink colour', helpText: 'The main text colour.', inputType: 'color', defaultValue: JSON.stringify('#35291C') },
  { key: 'design.accentColor', label: 'Accent colour (red)', helpText: 'Used for section labels, borders, and highlights.', inputType: 'color', defaultValue: JSON.stringify('#7A564C') },
  { key: 'design.goldColor', label: 'Gold colour', helpText: 'Used for ornamental details and dingbats.', inputType: 'color', defaultValue: JSON.stringify('#C4AB77') },
  { key: 'design.linkColor', label: 'Link colour', helpText: 'Colour of clickable links.', inputType: 'color', defaultValue: JSON.stringify('#7A564C') },
  { key: 'design.tabWidth', label: 'Tab width (px)', helpText: 'Minimum width of the side navigation tabs in pixels.', inputType: 'number', defaultValue: '40' },
  { key: 'design.slideMs', label: 'Page transition speed (ms)', helpText: 'How fast pages slide when you navigate. 500ms is the default.', inputType: 'number', defaultValue: '500' },
  { key: 'design.grain.enabled', label: 'Paper grain texture', helpText: 'Enables the paper texture effect on the background.', inputType: 'toggle', defaultValue: 'true' },
  { key: 'design.grain.baseFrequency', label: 'Grain frequency', helpText: 'Controls how fine or coarse the paper grain looks. Default: 0.62.', inputType: 'number', defaultValue: '0.62' },
  { key: 'design.grain.numOctaves', label: 'Grain octaves', helpText: 'Controls the complexity of the paper grain. Default: 4.', inputType: 'number', defaultValue: '4' },
  { key: 'design.grain.slope', label: 'Grain intensity', helpText: 'How strong the grain effect is. Default: 3.2.', inputType: 'number', defaultValue: '3.2' },
  { key: 'design.grain.opacity', label: 'Grain opacity', helpText: 'How visible the grain is, from 0 (invisible) to 1 (full). Default: 0.72.', inputType: 'number', defaultValue: '0.72' },
  { key: 'design.scrollbarThumb', label: 'Scrollbar colour', helpText: 'Colour of the scrollbar thumb.', inputType: 'color', defaultValue: JSON.stringify('#C4AB77') },
  { key: 'design.font.masthead', label: 'Masthead font (legacy — unused)', helpText: 'This field no longer does anything — the masthead title font is now controlled from Settings → Masthead → Title font, which actually applies it. Kept here only so nothing breaks for anyone who had it set.', inputType: 'text', defaultValue: JSON.stringify('UnifrakturMaguntia') },
  { key: 'design.font.headline', label: 'Headline font', helpText: 'Font used for headline and subheadline blocks.', inputType: 'select', options: FONT_OPTIONS, defaultValue: JSON.stringify('Playfair Display') },
  { key: 'design.font.body', label: 'Body text font', helpText: 'Font used for article body text sitewide.', inputType: 'select', options: FONT_OPTIONS, defaultValue: JSON.stringify('Libre Baskerville') },
  { key: 'design.font.smallCaps', label: 'Small caps / labels font', helpText: 'Font used for section labels and small caps text.', inputType: 'select', options: FONT_OPTIONS, defaultValue: JSON.stringify('Playfair Display') },
]

// This page's controls never actually applied to the live site until now — so
// whatever values were seeded originally could be wildly different from what
// the site has always actually looked like (hardcoded in app/globals.css). Since
// wiring the page up would otherwise silently change the live site's colours and
// fonts the moment this ships, any row still holding its *original, never-edited*
// seed value gets corrected here to match the real current appearance instead.
// A row holding anything else (a genuine admin edit) is left untouched.
const STALE_VALUE_FIXES: Array<{ key: string; staleValue: string; correctValue: string }> = [
  { key: 'design.inkColor', staleValue: JSON.stringify('#1a1008'), correctValue: JSON.stringify('#35291C') },
  { key: 'design.accentColor', staleValue: JSON.stringify('#7a1c1c'), correctValue: JSON.stringify('#7A564C') },
  { key: 'design.goldColor', staleValue: JSON.stringify('#8b6914'), correctValue: JSON.stringify('#C4AB77') },
  { key: 'design.linkColor', staleValue: JSON.stringify('#7a1c1c'), correctValue: JSON.stringify('#7A564C') },
  { key: 'design.scrollbarThumb', staleValue: JSON.stringify('#a89060'), correctValue: JSON.stringify('#C4AB77') },
  { key: 'design.tabWidth', staleValue: '44', correctValue: '40' },
  { key: 'design.font.headline', staleValue: JSON.stringify('Cinzel'), correctValue: JSON.stringify('Playfair Display') },
  { key: 'design.font.body', staleValue: JSON.stringify('IM Fell English'), correctValue: JSON.stringify('Libre Baskerville') },
  { key: 'design.font.smallCaps', staleValue: JSON.stringify('IM Fell English SC'), correctValue: JSON.stringify('Playfair Display') },
]

export default async function DesignSettingsPage() {
  await Promise.all([
    ...DESIGN_SETTINGS_DEFS.map((s) =>
      db.setting.upsert({
        where: { key: s.key },
        update: { label: s.label, helpText: s.helpText, inputType: s.inputType, options: s.options ?? null },
        create: { key: s.key, group: 'design', label: s.label, helpText: s.helpText, inputType: s.inputType, options: s.options, value: s.defaultValue },
      })
    ),
    ...STALE_VALUE_FIXES.map((f) =>
      db.setting.updateMany({ where: { key: f.key, value: f.staleValue }, data: { value: f.correctValue } })
    ),
  ])

  const rows = await getGroupSettings('design')
  return (
    <>
      <AdminHeader title="Design" subtitle="Colours, fonts, paper grain texture, and visual style." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
