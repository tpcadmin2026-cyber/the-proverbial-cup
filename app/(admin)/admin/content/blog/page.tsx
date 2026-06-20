import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { format } from 'date-fns'

export const metadata: Metadata = { title: 'Blog' }

export default async function BlogListPage() {
  const posts = await db.blogPost.findMany({
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, slug: true, title: true, category: true, published: true, featured: true, publishedAt: true, createdAt: true },
  })

  type Post = typeof posts[number]
  const published = posts.filter((p: Post) => p.published)
  const drafts = posts.filter((p: Post) => !p.published)

  return (
    <>
      <AdminHeader
        title="Blog"
        subtitle="Write and publish editorial posts for your site."
        action={
          <Link
            href="/admin/content/blog/new"
            className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors"
          >
            + New post
          </Link>
        }
      />

      <div className="p-8 max-w-4xl space-y-8">

        {posts.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No posts yet. Click <strong>New post</strong> to write your first entry.
          </div>
        )}

        {published.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Published — {published.length}</h2>
            <ul className="space-y-2">
              {published.map((p) => <PostRow key={p.id} post={p} />)}
            </ul>
          </section>
        )}

        {drafts.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Drafts — {drafts.length}</h2>
            <ul className="space-y-2">
              {drafts.map((p) => <PostRow key={p.id} post={p} />)}
            </ul>
          </section>
        )}

      </div>
    </>
  )
}

function PostRow({ post }: {
  post: { id: string; slug: string; title: string; category: string; published: boolean; featured: boolean; publishedAt: Date | null; createdAt: Date }
}) {
  return (
    <li>
      <Link
        href={`/admin/content/blog/${post.id}`}
        className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex items-center gap-4 hover:border-[#C4AB77] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{post.title}</div>
          <div className="flex items-center gap-2 mt-0.5">
            {post.category && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">{post.category}</span>
            )}
            {post.featured && (
              <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded">Featured</span>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-400 whitespace-nowrap">
          {post.publishedAt ? format(post.publishedAt, 'dd MMM yyyy') : format(post.createdAt, 'dd MMM yyyy')}
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${post.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {post.published ? 'Live' : 'Draft'}
        </span>
        <span className="text-xs text-[#C4AB77]">Edit →</span>
      </Link>
    </li>
  )
}
