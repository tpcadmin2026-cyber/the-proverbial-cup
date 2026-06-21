export const dynamic = 'force-dynamic'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { TemplateManager } from './TemplateManager'
import { requireAdmin } from '@/lib/auth'

export default async function TemplatesPage() {
  await requireAdmin()

  return (
    <>
      <AdminHeader
        title="Template manager"
        subtitle="Export this site as a reusable template, or import a template to apply settings, design, and content structure."
      />
      <div className="p-8 max-w-3xl space-y-6">
        <TemplateManager />
      </div>
    </>
  )
}
