import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function MastheadSettingsPage() {
  const rows = await getGroupSettings('masthead')
  return (
    <>
      <AdminHeader title="Masthead" subtitle="Edition date, volume, issue number, tagline rows, and edition bar content." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
