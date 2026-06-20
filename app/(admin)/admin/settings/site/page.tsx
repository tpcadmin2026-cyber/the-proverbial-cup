import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function SiteSettingsPage() {
  const rows = await getGroupSettings('site')
  return (
    <>
      <AdminHeader title="Site & branding" subtitle="Your site name, contact details, logo, and legal links." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
