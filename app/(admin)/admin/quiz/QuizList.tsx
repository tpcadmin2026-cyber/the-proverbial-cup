'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QuizRow {
  id: string
  slug: string
  title: string
  visible: boolean
  _count: { questions: number }
}

export function QuizList({ quizzes: initial }: { quizzes: QuizRow[] }) {
  const router = useRouter()
  const [quizzes, setQuizzes] = useState(initial)
  const [creating, setCreating] = useState(false)

  async function createQuiz() {
    setCreating(true)
    const res = await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Quiz' }),
    })
    if (res.ok) {
      const quiz = await res.json()
      router.push(`/admin/quiz/${quiz.id}`)
    }
    setCreating(false)
  }

  async function deleteQuiz(id: string, title: string) {
    if (!confirm(`Delete "${title}" and all its questions/answers? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/quiz/${id}`, { method: 'DELETE' })
    if (res.ok) setQuizzes((prev) => prev.filter((q) => q.id !== id))
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex justify-end">
        <button
          onClick={createQuiz}
          disabled={creating}
          className="px-4 py-2 bg-[#C4AB77] text-white text-sm font-semibold rounded hover:bg-[#7a5c10] disabled:opacity-60 transition-colors"
        >
          {creating ? 'Creating…' : '+ New quiz'}
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
          <p className="font-baskerville italic text-[#4B4C44]">No quizzes yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#c8c4a8] rounded-lg divide-y divide-[#f5f2e8]">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <Link href={`/admin/quiz/${quiz.id}`} className="font-playfair text-[#35291C] hover:text-[#C4AB77] transition-colors">
                  {quiz.title}
                </Link>
                <div className="text-xs text-[#C4AB77] mt-0.5 font-mono">/quiz/{quiz.slug}</div>
              </div>
              <span className="text-xs text-[#4B4C44] shrink-0">
                {quiz._count.questions} question{quiz._count.questions !== 1 ? 's' : ''}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${quiz.visible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {quiz.visible ? 'Visible' : 'Hidden'}
              </span>
              <Link href={`/admin/quiz/${quiz.id}`} className="text-sm text-[#C4AB77] hover:underline shrink-0">Edit</Link>
              <button
                onClick={() => deleteQuiz(quiz.id, quiz.title)}
                className="text-xs text-red-400 hover:text-red-600 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
