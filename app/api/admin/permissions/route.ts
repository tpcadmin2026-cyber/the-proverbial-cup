import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { isAdminRole } from '@/lib/access'
import { logChange } from '@/lib/changelog'
import { ROLE_DEFAULTS } from '@/lib/permissions'

// POST /api/admin/permissions — save the full role permissions matrix
export async function POST(req: NextRequest) {
  try {
    // Auth — only admin or master_admin can change permissions
    const cookieStore = await cookies()
    const token = cookieStore.get('authjs.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    })
    if (!session || !isAdminRole(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { matrix } = await req.json() as {
      matrix: Record<string, Record<string, boolean>>
    }

    // Load all permissions to get their IDs
    const allPermissions = await db.permission.findMany()
    const permMap = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]))

    // Upsert every role+permission combination
    const ops: Promise<unknown>[] = []
    for (const [role, perms] of Object.entries(matrix)) {
      if (role === 'master_admin') continue // never restrict master_admin
      for (const [permKey, granted] of Object.entries(perms)) {
        const permissionId = permMap[permKey]
        if (!permissionId) continue
        ops.push(
          db.rolePermission.upsert({
            where:  { role_permissionId: { role, permissionId } },
            update: { granted, updatedAt: new Date() },
            create: { role, permissionId, granted },
          })
        )
      }
    }
    await Promise.all(ops)

    await logChange({
      eventType: 'settings_change',
      title:     'Role permissions updated',
      actor:     session.user.email,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[permissions]', err)
    return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 })
  }
}

// PUT /api/admin/permissions — reset all role permissions to built-in defaults
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authjs.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    })
    if (!session || session.user.role !== 'master_admin') {
      return NextResponse.json({ error: 'Unauthorised — master_admin only' }, { status: 401 })
    }

    const allPermissions = await db.permission.findMany()
    const permMap = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]))

    const ops: Promise<unknown>[] = []
    for (const [role, grantedKeys] of Object.entries(ROLE_DEFAULTS)) {
      if (role === 'master_admin') continue
      for (const perm of allPermissions) {
        const granted = (grantedKeys as string[]).includes(perm.key)
        const permissionId = permMap[perm.key]
        ops.push(
          db.rolePermission.upsert({
            where:  { role_permissionId: { role, permissionId } },
            update: { granted, updatedAt: new Date() },
            create: { role, permissionId, granted },
          })
        )
      }
    }
    await Promise.all(ops)

    await logChange({
      eventType: 'settings_change',
      title:     'Role permissions reset to defaults',
      actor:     session.user.email,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[permissions reset]', err)
    return NextResponse.json({ error: 'Failed to reset permissions' }, { status: 500 })
  }
}

// GET /api/admin/permissions/user — get a specific user's permission overrides
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authjs.session-token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const overrides = await db.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    })

    return NextResponse.json({ overrides })
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
