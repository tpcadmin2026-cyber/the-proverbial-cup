import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function MaintenanceSettingsPage() {
  const rows = await getGroupSettings('maintenance')
  return (
    <>
      <AdminHeader title="Maintenance mode" subtitle="Take the site offline for visitors while you make changes. Admins can still log in." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
