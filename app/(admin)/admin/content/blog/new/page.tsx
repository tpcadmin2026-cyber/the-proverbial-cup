import type { Metadata } from 'next'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BlogEditor } from '../BlogEditor'

export const metadata: Metadata = { title: 'New Blog Post' }

export default function NewBlogPostPage() {
  return (
    <>
      <AdminHeader title="New blog post" subtitle="Write and publish a new post." />
      <BlogEditor post={null} />
    </>
  )
}
