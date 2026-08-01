import Link from 'next/link'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'
import { ensureDefaultQuiz } from '@/lib/quizMigration'
import { FeatureDisabled } from '@/components/site/FeatureDisabled'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const siteName = await getSetting<string>('site.name', 'My Site')
  return {
    title: `Find Your Perfect Blend`,
    description: `Take our recommendation quiz to discover which ${siteName} subscription is right for you.`,
  }
}

export default async function QuizIndexPage() {
  const siteName = await getSetting<string>('site.name', 'The Proverbial Cup')
  if (!await isEnabled('quiz')) {
    return <FeatureDisabled siteName={siteName} title="Find Your Perfect Blend" message="Our recommendation quiz is coming soon. In the meantime, browse our subscription plans to find the right fit." />
  }

  await ensureDefaultQuiz()
  const quizzes = await db.quiz.findMany({ where: { visible: true }, orderBy: { createdAt: 'asc' } })

  if (quizzes.length === 1) redirect(`/quiz/${quizzes[0].slug}`)

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8' }}
    >
      <div className="max-w-lg mx-auto text-center">
        <div className="font-playfair text-2xl text-[#35291C] mb-6">{siteName}</div>
        {quizzes.length === 0 ? (
          <p className="font-baskerville italic text-[#4B4C44]">No quizzes are available right now — please check back soon.</p>
        ) : (
          <div className="space-y-3 text-left">
            {quizzes.map((quiz) => (
              <Link
                key={quiz.id}
                href={`/quiz/${quiz.slug}`}
                className="block bg-white border border-[#c8c4a8] rounded-lg p-5 hover:border-[#C4AB77] transition-colors"
              >
                <div className="font-playfair text-lg text-[#35291C]">{quiz.heading}</div>
                {quiz.subheading && <p className="text-sm text-[#4B4C44] mt-1">{quiz.subheading}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
