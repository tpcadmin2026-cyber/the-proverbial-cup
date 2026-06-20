import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { WaitlistManager } from './WaitlistManager'

export const metadata: Metadata = { title: 'Waitlist' }

export default async function WaitlistAdminPage() {
  const entries = await db.waitlistEntry.findMany({ orderBy: { position: 'asc' } })

  return (
    <>
      <AdminHeader
        title="Waitlist"
        subtitle="Readers who have reserved a place before launch."
      />
      <WaitlistManager initialEntries={entries} />
    </>
  )
}
