import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { saveSettings } from '@/lib/settings'
import { importTemplate, type TemplateData } from '@/lib/templates'

// GET /api/setup — return setup step completion status
export async function GET() {
  const steps = await db.setupStep.findMany({ orderBy: { order: 'asc' } })
  const allDone = steps.every((s) => s.completed || s.skipped)
  return NextResponse.json({ steps, allDone })
}

// POST /api/setup — mark a step complete or skipped, save its settings
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    stepKey: string
    completed?: boolean
    skipped?: boolean
    settings?: Record<string, unknown>
    template?: TemplateData
  }

  const { stepKey, completed, skipped, settings, template } = body

  // If a template was uploaded at the template step, import it now
  if (stepKey === 'template' && completed && template?.templateVersion) {
    try {
      await importTemplate(template)
    } catch (err) {
      return NextResponse.json({ error: `Template import failed: ${err instanceof Error ? err.message : 'Unknown error'}` }, { status: 500 })
    }
  }

  const step = await db.setupStep.findUnique({ where: { stepKey } })
  if (!step) return NextResponse.json({ error: 'Unknown step' }, { status: 404 })

  await db.setupStep.update({
    where: { stepKey },
    data: {
      completed: completed ?? false,
      skipped:   skipped  ?? false,
      completedAt: (completed || skipped) ? new Date() : null,
    },
  })

  if (settings && Object.keys(settings).length > 0) {
    await saveSettings(settings, 'setup-wizard')
  }

  // Check if all steps are done; if so, mark setup complete
  const allSteps = await db.setupStep.findMany()
  const allDone  = allSteps.every((s) => s.completed || s.skipped)

  return NextResponse.json({ ok: true, allDone })
}
