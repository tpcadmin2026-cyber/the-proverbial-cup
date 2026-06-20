import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Navigation' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { NavEditor } from './NavEditor'

export default async function NavigationAdminPage() {
  const [navItems, pages] = await Promise.all([
    db.navItem.findMany({ orderBy: { navOrder: 'asc' } }),
    db.cmsPage.findMany({ orderBy: { pageOrder: 'asc' }, select: { id: true, tabLabel: true, tabNumeral: true, pageOrder: true, published: true } }),
  ])

  return (
    <div>
      <AdminHeader
        title="Navigation"
        subtitle="Control which tabs appear in the side navigation alongside your newspaper pages."
      />
      <div className="p-6">
        <NavEditor navItems={navItems} pages={pages} />
      </div>
    </div>
  )
}
