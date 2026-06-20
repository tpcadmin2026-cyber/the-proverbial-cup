import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'
import { KbCategoryActions } from './KbCategoryActions'

export default async function KnowledgeBasePage() {
  const [categories, articleCount] = await Promise.all([
    db.kbCategory.findMany({
      include: {
        _count: { select: { articles: true } },
        articles: { orderBy: { title: 'asc' }, select: { id: true, title: true, slug: true, published: true } },
      },
      orderBy: { order: 'asc' },
    }),
    db.kbArticle.count(),
  ])

  const publishedCount = await db.kbArticle.count({ where: { published: true } })

  return (
    <>
      <AdminHeader
        title="Knowledge base"
        subtitle="Searchable help articles your customers can browse at /help."
      />
      <div className="p-8 max-w-4xl space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Categories"       value={categories.length} />
          <StatCard label="Published"        value={publishedCount} color="text-green-700" />
          <StatCard label="Draft"            value={articleCount - publishedCount} />
        </div>

        {/* Action bar */}
        <div className="flex gap-3">
          <Link
            href="/admin/help/knowledge-base/new"
            className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors"
          >
            + New article
          </Link>
          <KbCategoryActions />
        </div>

        {/* Categories + articles */}
        {categories.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No categories yet. Add a category to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">{cat.name}</span>
                    {cat.description && (
                      <span className="ml-2 text-xs text-gray-400">{cat.description}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{cat._count.articles} article{cat._count.articles !== 1 ? 's' : ''}</span>
                </div>
                {cat.articles.length === 0 ? (
                  <div className="px-5 py-4 text-xs text-gray-400 italic">No articles in this category yet.</div>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {cat.articles.map((article) => (
                      <li key={article.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${article.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="flex-1 text-sm text-gray-900">{article.title}</span>
                        <Link
                          href={`/admin/help/knowledge-base/${article.id}`}
                          className="text-xs text-[#C4AB77] hover:underline shrink-0"
                        >
                          Edit
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-400">
          Published articles are visible at <Link href="/help" className="text-[#C4AB77] hover:underline">/help</Link>.
        </div>
      </div>
    </>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
