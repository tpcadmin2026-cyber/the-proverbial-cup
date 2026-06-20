import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { KbArticleEditor } from './KbArticleEditor'

interface Props {
  params: Promise<{ articleId: string }>
}

export default async function KbArticleEditorPage({ params }: Props) {
  const { articleId } = await params

  const [categories] = await Promise.all([
    db.kbCategory.findMany({ orderBy: { order: 'asc' } }),
  ])

  if (articleId === 'new') {
    if (categories.length === 0) {
      return (
        <>
          <AdminHeader title="New article" subtitle="Create a new knowledge base article." />
          <div className="p-8 max-w-2xl">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-800">
              You need at least one category before creating articles. Go back to the knowledge base and add a category first.
            </div>
          </div>
        </>
      )
    }
    return (
      <>
        <AdminHeader title="New article" subtitle="Write and publish a new help article." />
        <KbArticleEditor article={null} categories={categories} />
      </>
    )
  }

  const article = await db.kbArticle.findUnique({
    where: { id: articleId },
    include: { category: true },
  })

  if (!article) notFound()

  return (
    <>
      <AdminHeader title="Edit article" subtitle={article.title} />
      <KbArticleEditor article={article} categories={categories} />
    </>
  )
}
