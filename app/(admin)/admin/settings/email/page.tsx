import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function EmailSettingsPage() {
  const rows = await getGroupSettings('email')
  return (
    <>
      <AdminHeader title="Email" subtitle="Email delivery provider, sender name, reply-to address, and footer text." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
