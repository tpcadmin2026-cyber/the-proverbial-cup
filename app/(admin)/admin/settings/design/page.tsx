import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function DesignSettingsPage() {
  const rows = await getGroupSettings('design')
  return (
    <>
      <AdminHeader title="Design" subtitle="Colours, fonts, paper grain texture, and visual style." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
