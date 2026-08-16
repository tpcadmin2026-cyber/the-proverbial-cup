import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { db } from '@/lib/db'
import { getGroupSettings } from '../_shared'

export default async function SiteSettingsPage() {
  // Self-healing — added after the initial settings seed.
  await db.setting.upsert({
    where: { key: 'site.showAccountLinkInFooter' },
    update: {},
    create: {
      key: 'site.showAccountLinkInFooter',
      group: 'site',
      value: JSON.stringify(true),
      label: 'Show "My Account" in footer',
      helpText: 'Adds a link to the account sign-in/profile page in the site footer.',
      inputType: 'toggle',
    },
  })

  const rows = await getGroupSettings('site')
  return (
    <>
      <AdminHeader title="Site & branding" subtitle="Your site name, contact details, logo, and legal links." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
