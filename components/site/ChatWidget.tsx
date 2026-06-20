'use client'

import { useState, useRef, useEffect } from 'react'

interface Message { id: string; role: 'user' | 'assistant'; content: string }

interface Props {
  personaName: string
  welcomeMessage: string
  position: 'bottom-right' | 'bottom-left'
}

export function ChatWidget({ personaName, welcomeMessage, position }: Props) {
  const [open, setOpen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', content: welcomeMessage },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEscalate, setShowEscalate] = useState(false)
  const [escalateEmail, setEscalateEmail] = useState('')
  const [escalateName, setEscalateName] = useState('')
  const [escalated, setEscalated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text }),
      })
      const data = await res.json()
      if (data.sessionId) setSessionId(data.sessionId)
      if (data.message) setMessages(prev => [...prev, data.message])
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Our correspondent is temporarily indisposed. Please try again shortly.' }])
    }
    setLoading(false)
  }

  async function escalate() {
    if (!escalateEmail) return
    const res = await fetch('/api/chat/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, email: escalateEmail, name: escalateName }),
    })
    if (res.ok) setEscalated(true)
  }

  const positionClass = position === 'bottom-left' ? 'left-5 bottom-5' : 'right-5 bottom-5'
  const panelClass = position === 'bottom-left' ? 'left-0' : 'right-0'

  return (
    <div className={`fixed ${positionClass} z-50 flex flex-col items-end gap-3`}>
      {open && (
        <div className={`absolute bottom-16 ${panelClass} w-80 sm:w-96 bg-white border border-[#c8c4a8] rounded-lg shadow-2xl overflow-hidden flex flex-col`} style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="bg-[#35291C] px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-playfair text-[#E8E6D8] text-sm">{personaName}</div>
              <div className="text-[#C4AB77] text-xs font-baskerville italic">Your Gazette Correspondent</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEscalate(!showEscalate)}
                title="Talk to a human"
                className="text-[#C4AB77] hover:text-[#E8E6D8] text-xs transition-colors"
              >
                ✉ Human support
              </button>
              <button onClick={() => setOpen(false)} className="text-[#C4AB77] hover:text-white text-lg leading-none">×</button>
            </div>
          </div>

          {showEscalate && !escalated && (
            <div className="border-b border-[#e8e4d0] px-4 py-3 bg-[#fdfbf5]">
              <p className="text-xs font-baskerville italic text-[#4B4C44] mb-2">Leave your details and we shall have a team member correspond with you directly.</p>
              <input
                value={escalateName}
                onChange={e => setEscalateName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full text-xs border border-[#c8c4a8] rounded px-2 py-1 mb-1 outline-none focus:border-[#C4AB77]"
              />
              <input
                value={escalateEmail}
                onChange={e => setEscalateEmail(e.target.value)}
                placeholder="Your email address"
                type="email"
                className="w-full text-xs border border-[#c8c4a8] rounded px-2 py-1 mb-2 outline-none focus:border-[#C4AB77]"
              />
              <button
                onClick={escalate}
                className="w-full bg-[#35291C] text-[#E8E6D8] text-xs py-1.5 rounded hover:bg-[#35291C] transition-colors"
              >
                Submit to support desk
              </button>
            </div>
          )}

          {escalated && (
            <div className="border-b border-[#e8e4d0] px-4 py-3 bg-green-50 text-xs text-green-800 font-baskerville italic">
              Your enquiry has been passed to our editorial desk. A correspondent shall be in touch directly.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] text-sm rounded-lg px-3 py-2 font-baskerville leading-snug ${
                    m.role === 'user'
                      ? 'bg-[#35291C] text-[#E8E6D8]'
                      : 'bg-[#fdfbf5] border border-[#e8e4d0] text-[#35291C]'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#fdfbf5] border border-[#e8e4d0] rounded-lg px-3 py-2 text-[#C4AB77] text-sm font-baskerville italic">
                  Composing a reply…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-[#e8e4d0] px-3 py-2 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              placeholder="Write your message…"
              className="flex-1 text-sm text-[#35291C] outline-none font-baskerville bg-transparent"
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="text-[#C4AB77] hover:text-[#35291C] transition-colors disabled:opacity-40 text-lg"
            >
              ↵
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#35291C] text-[#E8E6D8] shadow-lg hover:bg-[#35291C] transition-colors flex items-center justify-center border-2 border-[#C4AB77]"
        title={`Chat with ${personaName}`}
      >
        {open ? (
          <span className="text-xl">×</span>
        ) : (
          <span className="font-playfair text-xs font-bold leading-tight text-center">C</span>
        )}
      </button>
    </div>
  )
}
