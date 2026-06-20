import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function ContentPagesPage() {
  const pages = await db.cmsPage.findMany({
    orderBy: { pageOrder: 'asc' },
    include: { _count: { select: { blocks: true } } },
  })

  return (
    <>
      <AdminHeader title="Pages" subtitle="Manage your Victorian newspaper pages and their content blocks." />
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
          <Link
            href="/admin/content/pages/new"
            className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] transition-colors"
          >
            + Add page
          </Link>
        </div>
        {pages.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-sm text-gray-400">
            No pages yet. Add your first page to start filling the Gazette.
          </div>
        ) : (
          <ul className="space-y-2">
            {pages.map((page) => (
              <li key={page.id} className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-center gap-4">
                <span className="text-gray-300 w-8 text-center font-playfair shrink-0">{page.tabNumeral}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{page.tabLabel}</div>
                  <div className="text-xs text-gray-400 mt-0.5 capitalize">
                    {page.layout.replace(/-/g, ' ')} · {page._count.blocks} block{page._count.blocks !== 1 ? 's' : ''}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${page.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {page.published ? 'Published' : 'Draft'}
                </span>
                <Link href={`/admin/content/pages/${page.id}`} className="text-sm text-[#C4AB77] hover:underline shrink-0">Settings</Link>
                {page.published && (
                  <Link
                    href={`/?cms_edit=${page.id}`}
                    target="_blank"
                    className="text-xs font-semibold px-2.5 py-1 bg-[#35291C] text-[#E8E6D8] rounded hover:bg-[#35291C] transition-colors shrink-0"
                  >
                    ✏ Edit on site →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
