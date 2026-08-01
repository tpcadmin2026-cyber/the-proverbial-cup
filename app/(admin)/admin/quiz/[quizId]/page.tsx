import type { Metadata } from 'next'
import Link from 'next/link'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { QuizMetaForm } from './QuizMetaForm'
import { QuizEditor } from './QuizEditor'

export const metadata: Metadata = { title: 'Edit Quiz' }

interface Props {
  params: Promise<{ quizId: string }>
}

export default async function QuizEditPage({ params }: Props) {
  const { quizId } = await params

  const [quiz, questions, plans, headerList] = await Promise.all([
    db.quiz.findUnique({ where: { id: quizId } }),
    db.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      include: { answers: { orderBy: { order: 'asc' } } },
    }),
    db.subscriptionPlan.findMany({ where: { visible: true }, orderBy: { displayOrder: 'asc' } }),
    headers(),
  ])

  if (!quiz) notFound()

  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  const publicUrl = `${proto}://${host}/quiz/${quiz.slug}`

  return (
    <div>
      <AdminHeader title={quiz.title} subtitle="Manage this quiz's questions, answers, and shareable link." />
      <div className="p-6">
        <Link href="/admin/quiz" className="inline-block mb-4 text-xs text-[#C4AB77] hover:underline">← All quizzes</Link>
        <QuizMetaForm
          quizId={quiz.id}
          title={quiz.title}
          slug={quiz.slug}
          heading={quiz.heading}
          subheading={quiz.subheading ?? ''}
          resultHeading={quiz.resultHeading}
          resultSubtext={quiz.resultSubtext ?? ''}
          visible={quiz.visible}
          publicUrl={publicUrl}
        />
        <QuizEditor quizId={quiz.id} questions={questions} plans={plans} />
      </div>
    </div>
  )
}
