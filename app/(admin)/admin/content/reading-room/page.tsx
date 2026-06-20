import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Reading Room' }
import Link from 'next/link'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { format } from 'date-fns'

export default async function ReadingRoomAdminPage() {
  const posts = await db.readingRoomPost.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <>
      <AdminHeader
        title="Reading Room"
        subtitle="Manage exclusive long-form content for subscribers."
        action={<Link href="/admin/content/reading-room/new" className="inline-flex items-center gap-1.5 bg-[#35291C] text-[#E8E6D8] px-4 py-2 rounded text-sm font-semibold hover:bg-[#4B4C44] transition-colors">+ New Post</Link>}
      />
      <div className="p-8 max-w-4xl">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No posts yet. <Link href="/admin/content/reading-room/new" className="text-[#C4AB77] hover:underline">Create your first reading room post</Link>.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            {posts.map((post) => (
              <div key={post.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{post.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {post.published
                      ? `Published ${post.publishedAt ? format(post.publishedAt, 'dd MMM yyyy') : ''}`
                      : 'Draft'}
                    {' · '}
                    <span className="text-[#C4AB77]">/members/{post.slug}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                  <Link href={`/admin/content/reading-room/${post.id}`} className="text-xs text-[#C4AB77] hover:underline">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
