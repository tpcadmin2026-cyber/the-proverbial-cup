import { db } from './db'
import { getSetting } from './settings'

// Self-healing backfill for the multi-quiz migration — any QuizQuestion created
// before quizzes existed as their own entity has quizId: null. The first time the
// admin quiz list loads after this ships, fold those orphaned questions into a
// single "Default Quiz" (seeded from the old global quiz.* settings, so existing
// copy isn't lost) rather than requiring a hand-run production migration.
export async function ensureDefaultQuiz(): Promise<void> {
  const orphaned = await db.quizQuestion.count({ where: { quizId: null } })
  if (orphaned === 0) return

  const [heading, subheading, resultHeading, resultSubtext] = await Promise.all([
    getSetting<string>('quiz.heading', 'Find Your Perfect Subscription'),
    getSetting<string>('quiz.subheading', 'Answer a few brief questions and we shall recommend the finest subscription for your tastes.'),
    getSetting<string>('quiz.resultHeading', 'Our Recommendation for You'),
    getSetting<string>('quiz.resultSubtext', 'Based upon your answers, we believe the following subscription would suit you admirably.'),
  ])

  const defaultQuiz = await db.quiz.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      slug: 'default',
      title: 'Find Your Perfect Blend',
      heading, subheading, resultHeading, resultSubtext,
      visible: true,
    },
  })

  await db.quizQuestion.updateMany({
    where: { quizId: null },
    data: { quizId: defaultQuiz.id },
  })
}
