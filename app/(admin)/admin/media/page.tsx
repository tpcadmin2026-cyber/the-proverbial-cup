export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Media' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { MediaLibrary } from './MediaLibrary'

export default async function MediaPage() {
  const configured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

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
