'use client'

import { useState } from 'react'

interface Props {
  articleId: string
  helpful: number
  notHelpful: number
}

export function HelpfulButtons({ articleId, helpful, notHelpful }: Props) {
  const [voted, setVoted] = useState<'yes' | 'no' | null>(null)

  async function vote(type: 'yes' | 'no') {
    if (voted) return
    setVoted(type)
    await fetch(`/api/help/${articleId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ helpful: type === 'yes' }),
    })
  }

  if (voted) {
    return (
      <div className="text-center text-sm font-baskerville italic text-[#C4AB77]">
        Thank you for your response. ✦
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-sm text-[#4B4C44] mb-3">Was this article helpful?</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => vote('yes')}
          className="flex items-center gap-1.5 border border-[#c8c4a8] rounded px-4 py-2 text-sm text-[#4B4C44] hover:border-[#C4AB77] hover:text-[#C4AB77] transition-colors"
        >
          <span>✓</span> Yes ({helpful})
        </button>
        <button
          onClick={() => vote('no')}
          className="flex items-center gap-1.5 border border-[#c8c4a8] rounded px-4 py-2 text-sm text-[#4B4C44] hover:border-[#7A564C] hover:text-[#7A564C] transition-colors"
        >
          <span>✗</span> No ({notHelpful})
        </button>
      </div>
    </div>
  )
}
