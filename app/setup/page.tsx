import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SetupWizard } from './SetupWizard'

export default async function SetupPage() {
  const steps = await db.setupStep.findMany({ orderBy: { order: 'asc' } })

  // If no steps exist, DB hasn't been seeded yet
  if (steps.length === 0) {
    return (
      <div className="min-h-screen bg-[#E8E6D8] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Database not set up</h1>
          <p className="text-sm text-gray-500 mb-4">
            Run <code className="bg-gray-100 px-1 py-0.5 rounded">pnpm db:push && pnpm db:seed</code> to initialise the database, then refresh this page.
          </p>
        </div>
      </div>
    )
  }

  const allDone = steps.every((s) => s.completed || s.skipped)
  if (allDone) redirect('/admin')

  // Find the first incomplete step
  const currentStep = steps.find((s) => !s.completed && !s.skipped) ?? steps[0]

  return <SetupWizard steps={steps} currentStepKey={currentStep.stepKey} />
}
