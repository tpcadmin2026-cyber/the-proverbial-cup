'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { QuizQuestion, QuizAnswer, SubscriptionPlan } from '@prisma/client'

type QuestionWithAnswers = QuizQuestion & { answers: QuizAnswer[] }

interface Props {
  questions: QuestionWithAnswers[]
  plans: SubscriptionPlan[]
  heading: string
  subheading: string
  resultHeading: string
  resultSubtext: string
  currency: string
}

const ORNAMENT = '✦'

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100)
}

export function QuizFlow({ questions, plans, heading, subheading, resultHeading, resultSubtext, currency }: Props) {
  const [current, setCurrent] = useState(0)
  const [selections, setSelections] = useState<string[]>([]) // answer ids chosen per question
  const [done, setDone] = useState(false)
  const [recommended, setRecommended] = useState<SubscriptionPlan | null>(null)

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#E8E6D8' }}>
        <div className="max-w-lg w-full text-center bg-white border border-[#c8c4a8] rounded-lg p-10">
          <p className="font-baskerville italic text-[#4B4C44] text-lg">The quiz is not yet available. Please check back shortly.</p>
          <Link href="/" className="mt-6 inline-block text-[#C4AB77] hover:underline text-sm">← Return home</Link>
        </div>
      </div>
    )
  }

  function choose(answerId: string) {
    const next = [...selections]
    next[current] = answerId
    setSelections(next)

    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      // Tally scores
      const tally: Record<string, number> = {}
      next.forEach((aid, qi) => {
        const answer = questions[qi]?.answers.find(a => a.id === aid)
        if (!answer?.matchRules) return
        try {
          const rules = JSON.parse(answer.matchRules) as { planTags?: string[] }
          rules.planTags?.forEach(tag => { tally[tag] = (tally[tag] ?? 0) + 1 })
        } catch {}
      })
      const topTag = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0]
      const match = plans.find(p => p.slug === topTag) ?? plans[0] ?? null
      setRecommended(match)
      setDone(true)
    }
  }

  function restart() {
    setCurrent(0)
    setSelections([])
    setDone(false)
    setRecommended(null)
  }

  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncR type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncG type='linear' slope='3.2' intercept='-1.1'/%3E%3CfeFuncB type='linear' slope='3.2' intercept='-1.1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='400' height='400' fill='%23E8E6D8'/%3E%3Crect width='400' height='400' fill='rgba(140,120,80,0.72)' filter='url(%23grain)' style='mix-blend-mode:overlay'/%3E%3C/svg%3E")`

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: '#E8E6D8', backgroundImage: grain, backgroundRepeat: 'repeat', backgroundSize: '400px 400px' }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <div className="text-[#35291C] leading-tight" style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(1.4rem, 3.5vw, 2rem)' }}>
              My Site
            </div>
          </Link>
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
            <span className="text-[#C4AB77]">{ORNAMENT}</span>
            <div className="h-px flex-1 max-w-24 bg-[#C4AB77]" />
          </div>
          <div className="border-t-4 border-b border-[#35291C] border-b-[#C4AB77] py-2 mb-4">
            <h1 className="font-playfair text-2xl text-[#35291C] tracking-wide">{heading}</h1>
          </div>
          <p className="font-baskerville text-lg italic text-[#4B4C44]">{subheading}</p>
        </div>

        {done ? (
          /* Result card */
          <div className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
            <div className="px-8 py-10 text-center">
              <div className="text-[#C4AB77] text-2xl mb-3">{ORNAMENT}</div>
              <h2 className="font-playfair text-2xl text-[#35291C] mb-3">{resultHeading}</h2>
              <p className="font-baskerville italic text-[#4B4C44] mb-6">{resultSubtext}</p>

              {recommended ? (
                <div className="border border-[#C4AB77] rounded-lg p-6 mb-6 bg-[#fdfbf5]">
                  <div className="font-playfair text-xl text-[#35291C] mb-2">{recommended.name}</div>
                  {recommended.description && (
                    <p className="font-baskerville text-[#4B4C44] text-sm mb-4 italic">{recommended.description}</p>
                  )}
                  {recommended.priceMonthly && (
                    <div className="text-[#C4AB77] font-playfair text-lg mb-4">
                      {formatPrice(recommended.priceMonthly, currency)}/month
                    </div>
                  )}
                  <Link
                    href={`/subscribe/${recommended.slug}`}
                    className="inline-block bg-[#35291C] text-[#E8E6D8] px-8 py-3 rounded text-sm font-semibold hover:bg-[#35291C] transition-colors"
                  >
                    Subscribe Now
                  </Link>
                </div>
              ) : (
                <div className="mb-6">
                  <Link href="/pricing" className="inline-block bg-[#35291C] text-[#E8E6D8] px-8 py-3 rounded text-sm font-semibold hover:bg-[#35291C] transition-colors">
                    View All Plans
                  </Link>
                </div>
              )}

              <button onClick={restart} className="text-[#C4AB77] hover:underline text-sm font-baskerville italic">
                ← Take the quiz again
              </button>
            </div>
          </div>
        ) : (
          /* Question card */
          <div className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden shadow-md">
            <div className="h-1 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
            <div className="px-8 py-10">
              {/* Progress */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-[#C4AB77] font-baskerville italic">
                  Question {current + 1} of {questions.length}
                </span>
                <div className="flex gap-1">
                  {questions.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-8 rounded-full transition-colors"
                      style={{ backgroundColor: i <= current ? '#C4AB77' : '#e8e4d0' }}
                    />
                  ))}
                </div>
              </div>

              <h2 className="font-playfair text-xl text-[#35291C] mb-6 leading-snug">
                {questions[current].text}
              </h2>

              <div className="space-y-3">
                {questions[current].answers.map((answer) => (
                  <button
                    key={answer.id}
                    onClick={() => choose(answer.id)}
                    className="w-full text-left px-5 py-4 border border-[#c8c4a8] rounded-lg font-baskerville text-[#35291C] hover:border-[#C4AB77] hover:bg-[#fdfbf5] transition-all text-base leading-snug"
                    style={{ boxShadow: selections[current] === answer.id ? '0 0 0 2px #C4AB77' : undefined }}
                  >
                    {answer.text}
                  </button>
                ))}
              </div>

              {current > 0 && (
                <button
                  onClick={() => setCurrent(current - 1)}
                  className="mt-6 text-sm text-[#C4AB77] hover:underline font-baskerville italic"
                >
                  ← Previous question
                </button>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/" className="text-[#C4AB77] hover:underline text-sm font-baskerville italic">← Return home</Link>
        </div>
      </div>
    </div>
  )
}
