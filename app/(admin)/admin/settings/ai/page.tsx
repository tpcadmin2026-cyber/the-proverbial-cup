import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function AISettingsPage() {
  const rows = await getGroupSettings('ai')
  return (
    <>
      <AdminHeader title="AI assistant" subtitle="Enable the chat widget, set your assistant's name and personality, and configure behaviour." />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
