import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Quiz' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { QuizEditor } from './QuizEditor'

export default async function QuizAdminPage() {
  const [questions, plans] = await Promise.all([
    db.quizQuestion.findMany({
      orderBy: { order: 'asc' },
      include: { answers: { orderBy: { order: 'asc' } } },
    }),
    db.subscriptionPlan.findMany({ where: { visible: true }, orderBy: { displayOrder: 'asc' } }),
  ])

  return (
    <div>
      <AdminHeader
        title="Recommendation Quiz"
        subtitle="Manage questions and answers that recommend the right subscription to each visitor."
      />
      <div className="p-6">
        <QuizEditor questions={questions} plans={plans} />
      </div>
    </div>
  )
}
