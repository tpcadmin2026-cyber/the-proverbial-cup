export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Invitations' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { InvitePanel } from '../InvitePanel'
import { InviteList } from './InviteList'
import { db } from '@/lib/db'

export default async function InvitationsPage() {
  const invites = await db.invite.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <>
      <AdminHeader
        title="Invitations"
        subtitle="Invite team members to join the admin. Manage and revoke pending invites."
      />
      <div className="p-8 max-w-3xl space-y-8">
        <InvitePanel />
        <InviteList invites={invites} />
      </div>
    </>
  )
}
