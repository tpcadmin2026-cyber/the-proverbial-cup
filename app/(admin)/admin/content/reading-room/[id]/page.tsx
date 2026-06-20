import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { PostEditor } from '../PostEditor'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const post = await db.readingRoomPost.findUnique({ where: { id }, select: { title: true } })
  return { title: post ? `Edit: ${post.title}` : 'Edit Post' }
}

export default async function EditReadingRoomPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await db.readingRoomPost.findUnique({ where: { id } })
  if (!post) notFound()

  return (
    <>
      <AdminHeader title="Edit Post" subtitle={post.title} />
      <div className="p-8 max-w-3xl">
        <PostEditor post={post} />
      </div>
    </>
  )
}
