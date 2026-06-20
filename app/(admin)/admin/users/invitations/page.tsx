import { AdminHeader } from '@/components/admin/AdminHeader'
import { InvitePanel } from '../InvitePanel'

export default function InvitationsPage() {
  return (
    <>
      <AdminHeader
        title="Invitations"
        subtitle="Invite team members to join the admin. Choose their role and send or copy the invite link."
      />
      <div className="p-8 max-w-3xl">
        <InvitePanel />
      </div>
    </>
  )
}
