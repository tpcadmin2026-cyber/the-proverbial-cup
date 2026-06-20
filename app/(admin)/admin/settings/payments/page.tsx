import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function PaymentsSettingsPage() {
  const rows = await getGroupSettings('payments')
  return (
    <>
      <AdminHeader title="Payments" subtitle="Currency, free shipping threshold, and default tax rate." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
