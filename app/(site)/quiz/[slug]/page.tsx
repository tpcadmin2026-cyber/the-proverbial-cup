import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { notFound } from 'next/navigation'
import { QuizFlow } from './QuizFlow'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const quiz = await db.quiz.findUnique({ where: { slug, visible: true }, select: { heading: true, subheading: true } })
  if (!quiz) return {}
  return {
    title: quiz.heading,
    description: quiz.subheading ?? undefined,
  }
}

export default async function QuizPage({ params }: Props) {
  const { slug } = await params
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('quiz')) {
    return <FeatureDisabled siteName={siteName} title="Find Your Perfect Blend" message="Our recommendation quiz is coming soon. In the meantime, browse our subscription plans to find the right fit." />
  }

  const quiz = await db.quiz.findUnique({ where: { slug, visible: true } })
  if (!quiz) notFound()

  const [questions, plans, currency] = await Promise.all([
    db.quizQuestion.findMany({
      where: { quizId: quiz.id, active: true },
      orderBy: { order: 'asc' },
      include: { answers: { orderBy: { order: 'asc' } } },
    }),
    db.subscriptionPlan.findMany({
      where: { visible: true },
      orderBy: { displayOrder: 'asc' },
    }),
    getSetting<string>('payments.currency', 'USD'),
  ])

  return (
    <QuizFlow
      questions={questions}
      plans={plans}
      heading={quiz.heading}
      subheading={quiz.subheading ?? ''}
      resultHeading={quiz.resultHeading}
      resultSubtext={quiz.resultSubtext ?? ''}
      currency={currency}
    />
  )
}
