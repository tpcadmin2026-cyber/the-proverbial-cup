import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'New Reading Room Post' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PostEditor } from '../PostEditor'

export default function NewReadingRoomPostPage() {
  return (
    <>
      <AdminHeader title="New Post" subtitle="Create a new members-only reading room article." />
      <div className="p-8 max-w-3xl">
        <PostEditor post={null} />
      </div>
    </>
  )
}
