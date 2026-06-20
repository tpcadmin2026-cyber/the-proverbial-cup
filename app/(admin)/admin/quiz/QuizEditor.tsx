'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { QuizQuestion, QuizAnswer, SubscriptionPlan } from '@prisma/client'

type QuestionWithAnswers = QuizQuestion & { answers: QuizAnswer[] }

interface Props {
  questions: QuestionWithAnswers[]
  plans: SubscriptionPlan[]
}

export function QuizEditor({ questions: initial, plans }: Props) {
  const router = useRouter()
  const [questions, setQuestions] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(initial[0]?.id ?? null)

  async function addQuestion() {
    setSaving(true)
    const res = await fetch('/api/admin/quiz/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'New question' }),
    })
    const q = await res.json()
    setQuestions([...questions, { ...q, answers: [] }])
    setExpandedId(q.id)
    setSaving(false)
  }

  async function updateQuestion(id: string, text: string) {
    await fetch(`/api/admin/quiz/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q))
  }

  async function toggleQuestion(id: string, active: boolean) {
    await fetch(`/api/admin/quiz/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setQuestions(questions.map(q => q.id === id ? { ...q, active } : q))
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question and all its answers?')) return
    await fetch(`/api/admin/quiz/questions/${id}`, { method: 'DELETE' })
    setQuestions(questions.filter(q => q.id !== id))
  }

  async function addAnswer(questionId: string) {
    const res = await fetch(`/api/admin/quiz/questions/${questionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'New answer', matchRules: null }),
    })
    const answer = await res.json()
    setQuestions(questions.map(q => q.id === questionId ? { ...q, answers: [...q.answers, answer] } : q))
  }

  async function updateAnswer(answerId: string, questionId: string, text: string, planTags: string[]) {
    await fetch(`/api/admin/quiz/answers/${answerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, matchRules: { planTags } }),
    })
    setQuestions(questions.map(q => q.id === questionId
      ? { ...q, answers: q.answers.map(a => a.id === answerId ? { ...a, text, matchRules: JSON.stringify({ planTags }) } : a) }
      : q
    ))
  }

  async function deleteAnswer(answerId: string, questionId: string) {
    await fetch(`/api/admin/quiz/answers/${answerId}`, { method: 'DELETE' })
    setQuestions(questions.map(q => q.id === questionId
      ? { ...q, answers: q.answers.filter(a => a.id !== answerId) }
      : q
    ))
  }

  function getPlanTags(matchRules: string | null): string[] {
    if (!matchRules) return []
    try { return (JSON.parse(matchRules) as { planTags?: string[] }).planTags ?? [] } catch { return [] }
  }

  return (
    <div className="max-w-3xl space-y-4">
      {questions.length === 0 && (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
          <p className="font-baskerville italic text-[#4B4C44] mb-4">No questions yet. Add your first question to get started.</p>
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={q.id} className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#35291C] via-[#C4AB77] to-[#35291C]" />
          {/* Question header */}
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="text-xs text-[#C4AB77] font-baskerville italic min-w-[2rem]">Q{qi + 1}</span>
            <input
              defaultValue={q.text}
              onBlur={e => updateQuestion(q.id, e.target.value)}
              className="flex-1 font-playfair text-sm text-[#35291C] bg-transparent border-b border-[#e8e4d0] focus:border-[#C4AB77] outline-none pb-0.5"
            />
            <button
              onClick={() => toggleQuestion(q.id, !q.active)}
              className={`text-xs px-2 py-1 rounded ${q.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {q.active ? 'Active' : 'Off'}
            </button>
            <button
              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
              className="text-xs text-[#C4AB77] hover:underline"
            >
              {expandedId === q.id ? 'Collapse' : 'Edit answers'}
            </button>
            <button onClick={() => deleteQuestion(q.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          </div>

          {/* Answers */}
          {expandedId === q.id && (
            <div className="px-5 pb-5 border-t border-[#e8e4d0]">
              <div className="space-y-3 mt-4">
                {q.answers.map((a, ai) => {
                  const tags = getPlanTags(a.matchRules)
                  return (
                    <div key={a.id} className="flex items-start gap-3 bg-[#fdfbf5] border border-[#e8e4d0] rounded p-3">
                      <span className="text-xs text-[#C4AB77] font-baskerville italic pt-1 min-w-[1.5rem]">{ai + 1}.</span>
                      <div className="flex-1 space-y-2">
                        <input
                          defaultValue={a.text}
                          onBlur={e => updateAnswer(a.id, q.id, e.target.value, tags)}
                          className="w-full text-sm text-[#35291C] bg-transparent border-b border-[#e8e4d0] focus:border-[#C4AB77] outline-none pb-0.5"
                          placeholder="Answer text…"
                        />
                        <div>
                          <label className="text-xs text-[#C4AB77] font-baskerville italic block mb-1">Points toward plans:</label>
                          <div className="flex flex-wrap gap-2">
                            {plans.map(p => (
                              <label key={p.id} className="flex items-center gap-1 text-xs text-[#4B4C44] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={tags.includes(p.slug)}
                                  onChange={e => {
                                    const next = e.target.checked ? [...tags, p.slug] : tags.filter(t => t !== p.slug)
                                    updateAnswer(a.id, q.id, a.text, next)
                                  }}
                                  className="accent-[#C4AB77]"
                                />
                                {p.name}
                              </label>
                            ))}
                            {plans.length === 0 && <span className="text-xs text-[#C4AB77] italic">No plans yet — add plans first.</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteAnswer(a.id, q.id)} className="text-xs text-red-400 hover:text-red-600 pt-1">✕</button>
                    </div>
                  )
                })}
              </div>
              <button
                onClick={() => addAnswer(q.id)}
                className="mt-3 text-xs text-[#C4AB77] hover:underline font-baskerville italic"
              >
                + Add answer
              </button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addQuestion}
        disabled={saving}
        className="w-full py-3 border-2 border-dashed border-[#c8c4a8] rounded-lg text-sm text-[#C4AB77] hover:border-[#C4AB77] hover:bg-white transition-all font-baskerville italic"
      >
        + Add question
      </button>
    </div>
  )
}
