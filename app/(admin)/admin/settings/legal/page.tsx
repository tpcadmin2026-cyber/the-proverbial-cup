import { AdminHeader } from '@/components/admin/AdminHeader'
import { SettingsGroupPage } from '@/components/admin/SettingsGroupPage'
import { getGroupSettings } from '../_shared'

export default async function LegalSettingsPage() {
  const rows = await getGroupSettings('legal')
  return (
    <>
      <AdminHeader
        title="Legal"
        subtitle="Your terms & conditions and privacy policy. Use blank lines to separate paragraphs. Start a line with ## for a section heading."
      />
      <SettingsGroupPage rows={rows} />
    </>
  )
}
