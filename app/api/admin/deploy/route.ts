import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { triggerDeploy } from '@/lib/vercel'
import { triggerBackup } from '@/lib/backup'
import { logChange } from '@/lib/changelog'
import { getSetting } from '@/lib/settings'

// POST /api/admin/deploy — trigger a production deploy
export async function POST() {
  try {
    const session = await requireAdmin()
    const actor = session.user?.email ?? 'admin'

    // Optional pre-deploy backup
    const backupOnDeploy = await getSetting<boolean>('backups.onDeploy', true)
    if (backupOnDeploy) {
      await triggerBackup('deploy', actor).catch((err) => {
        console.warn('[deploy] Pre-deploy backup failed (continuing):', err.message)
      })
    }

    const { deployId, url } = await triggerDeploy()

    await logChange({
      eventType: 'deploy',
      title:     `Deploy triggered — ${deployId}`,
      actor,
      metadata:  { deployId, url },
    })

    return NextResponse.json({ ok: true, deployId, url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Deploy failed'
    if (msg === 'Unauthorised') return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
