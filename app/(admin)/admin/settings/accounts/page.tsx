import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function AccountsSettingsPage() {
  const rows = await getGroupSettings('auth')
  return (
    <>
      <AdminHeader title="User accounts" subtitle="Registration, email verification, login methods, and session settings." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
