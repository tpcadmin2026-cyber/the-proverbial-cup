import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Media' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { MediaLibrary } from './MediaLibrary'
import { getSetting } from '@/lib/settings'

export default async function MediaPage() {
  const [r2AccountId, r2Bucket] = await Promise.all([
    getSetting<string>('r2.accountId', ''),
    getSetting<string>('r2.bucket', ''),
  ])

  const configured = !!(
    (process.env.R2_ACCOUNT_ID || r2AccountId) &&
    (process.env.R2_BUCKET || r2Bucket)
  )

  return (
    <>
      <AdminHeader
        title="Media library"
        subtitle="Upload and manage images and files used across your site."
      />
      <MediaLibrary configured={configured} />
    </>
  )
}
