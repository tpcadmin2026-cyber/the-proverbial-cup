import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { QuizFlow } from './QuizFlow'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return {
    title: `Find Your Perfect Blend`,
    description: `Take our recommendation quiz to discover which ${siteName} subscription is right for you.`,
  }
}

export default async function QuizPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('quiz')) {
    return <FeatureDisabled siteName={siteName} title="Find Your Perfect Blend" message="Our recommendation quiz is coming soon. In the meantime, browse our subscription plans to find the right fit." />
  }
  const [questions, plans, heading, subheading, resultHeading, resultSubtext, currency] = await Promise.all([
    db.quizQuestion.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
      include: { answers: { orderBy: { order: 'asc' } } },
    }),
    db.subscriptionPlan.findMany({
      where: { visible: true },
      orderBy: { displayOrder: 'asc' },
    }),
    getSetting<string>('quiz.heading',       'Find Your Perfect Subscription'),
    getSetting<string>('quiz.subheading',    'Answer a few brief questions and we shall recommend the finest subscription for your tastes.'),
    getSetting<string>('quiz.resultHeading', 'Our Recommendation for You'),
    getSetting<string>('quiz.resultSubtext', 'Based upon your answers, we believe the following subscription would suit you admirably.'),
    getSetting<string>('payments.currency', 'USD'),
  ])

  return (
    <QuizFlow
      questions={questions}
      plans={plans}
      heading={heading}
      subheading={subheading}
      resultHeading={resultHeading}
      resultSubtext={resultSubtext}
      currency={currency}
    />
  )
}
