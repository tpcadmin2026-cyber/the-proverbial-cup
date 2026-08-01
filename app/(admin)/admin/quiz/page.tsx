import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Quizzes' }
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { ensureDefaultQuiz } from '@/lib/quizMigration'
import { QuizList } from './QuizList'

export default async function QuizAdminPage() {
  await ensureDefaultQuiz()

  const quizzes = await db.quiz.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { questions: true } } },
  })

  return (
    <div>
      <AdminHeader
        title="Quizzes"
        subtitle="Build as many recommendation quizzes as you like — each gets its own shareable link."
      />
      <div className="p-6">
        <QuizList quizzes={quizzes} />
      </div>
    </div>
  )
}
