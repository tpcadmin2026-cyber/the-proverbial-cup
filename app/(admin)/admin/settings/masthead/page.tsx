import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { db } from '@/lib/db'
import { getGroupSettings } from '../_shared'

export default async function MastheadSettingsPage() {
  // Self-healing — this key was added after the initial settings seed, so make
  // sure the row exists (first admin to open this page on any given deploy creates it).
  await db.setting.upsert({
    where: { key: 'design.mastheadLogoUrl' },
    update: {},
    create: {
      key: 'design.mastheadLogoUrl',
      group: 'masthead',
      value: JSON.stringify(''),
      label: 'Masthead logo',
      helpText: 'Optional — replaces the masthead title text with a logo image. Leave blank to keep the text title. Does not affect the page title used for search engines.',
      inputType: 'image',
    },
  })

  const rows = await getGroupSettings('masthead')
  return (
    <>
      <AdminHeader title="Masthead" subtitle="Edition date, volume, issue number, tagline rows, and edition bar content." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
