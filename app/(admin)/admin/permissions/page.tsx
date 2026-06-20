import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Permissions' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { PERMISSION_CATEGORIES, PERMISSION_DEFINITIONS } from '@/lib/permissions'
import { CONFIGURABLE_ROLES, ROLE_LABELS } from '@/lib/access'
import { PermissionsMatrix } from './PermissionsMatrix'

export default async function PermissionsPage() {
  // Load all current role permissions from DB
  const rolePermissions = await db.rolePermission.findMany({
    include: { permission: true },
  })

  // Build a map: role → permissionKey → granted
  const matrix: Record<string, Record<string, boolean>> = {}
  for (const role of CONFIGURABLE_ROLES) {
    matrix[role] = {}
    for (const p of PERMISSION_DEFINITIONS) {
      matrix[role][p.key] = false
    }
  }
  for (const rp of rolePermissions) {
    if (matrix[rp.role]) {
      matrix[rp.role][rp.permission.key] = rp.granted
    }
  }

  return (
    <>
      <AdminHeader
        title="Permissions"
        subtitle="Control exactly what each role can do. Master Admin always has full access and cannot be restricted."
      />
      <div className="p-8 max-w-6xl space-y-6">

        {/* Role legend */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {CONFIGURABLE_ROLES.map((role) => {
            const info = ROLE_LABELS[role]
            return (
              <div key={role} className="bg-white rounded-lg border border-gray-200 p-4">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${info.color}`}>
                  {info.label}
                </span>
                <p className="text-xs text-gray-500">{info.description}</p>
              </div>
            )
          })}
          <div className="bg-white rounded-lg border border-[#7A564C] p-4 opacity-75">
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 bg-[#7A564C] text-white">
              Master Admin
            </span>
            <p className="text-xs text-gray-500">Always has every permission. Cannot be restricted here.</p>
          </div>
        </div>

        {/* Permissions matrix */}
        <PermissionsMatrix
          categories={PERMISSION_CATEGORIES}
          permissions={PERMISSION_DEFINITIONS}
          roles={[...CONFIGURABLE_ROLES]}
          roleLabels={ROLE_LABELS}
          initialMatrix={matrix}
        />
      </div>
    </>
  )
}
