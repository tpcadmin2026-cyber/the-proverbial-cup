import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { logChange } from '@/lib/changelog'

// GET — return the user's current permission overrides
export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await requireAdmin()
    const { userId } = await params

    const overrides = await db.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    })

    return NextResponse.json({
      overrides: Object.fromEntries(overrides.map((o) => [o.permission.key, o.granted])),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST — save user permission overrides
// Body: { overrides: Record<permissionKey, true | false | null> }
// null = clear the override (revert to role default)
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await requireAdmin()
    const { userId } = await params
    const { overrides } = await req.json() as { overrides: Record<string, boolean | null> }

    const allPermissions = await db.permission.findMany()
    const permMap = Object.fromEntries(allPermissions.map((p) => [p.key, p.id]))

    const ops: Promise<unknown>[] = []
    for (const [key, value] of Object.entries(overrides)) {
      const permissionId = permMap[key]
      if (!permissionId) continue

      if (value === null) {
        // Clear override — revert to role default
        ops.push(
          db.userPermission.deleteMany({ where: { userId, permissionId } })
        )
      } else {
        ops.push(
          db.userPermission.upsert({
            where:  { userId_permissionId: { userId, permissionId } },
            update: { granted: value, updatedAt: new Date() },
            create: { userId, permissionId, granted: value },
          })
        )
      }
    }
    await Promise.all(ops)

    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
    await logChange({
      eventType: 'settings_change',
      title:     `Permission overrides updated for ${user?.email ?? userId}`,
      actor:     session.email,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
