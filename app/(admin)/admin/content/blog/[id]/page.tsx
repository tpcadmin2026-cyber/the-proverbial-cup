import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { BlogEditor } from '../BlogEditor'

export const metadata: Metadata = { title: 'Edit Blog Post' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) notFound()

  return (
    <>
      <AdminHeader
        title="Edit post"
        subtitle={post.title}
        action={
          post.published && post.slug ? (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-[#C4AB77] border border-[#C4AB77] rounded hover:bg-amber-50 transition-colors"
            >
              View post ↗
            </a>
          ) : undefined
        }
      />
      <BlogEditor post={post} />
    </>
  )
}
