import { AdminHeader } from '@/components/admin/AdminHeader'
import { db } from '@/lib/db'
import { format } from 'date-fns'

export default async function ChatLogsPage() {
  const sessions = await db.chatSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      _count: { select: { messages: true } },
    },
  })

  const escalated = sessions.filter(s => s.messages.some(m => m.escalated))

  return (
    <>
      <AdminHeader
        title="Chat logs"
        subtitle="AI assistant conversations. Sessions marked with ✉ have been escalated to the support desk."
      />
      <div className="p-6 max-w-4xl space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total sessions', value: sessions.length },
            { label: 'Escalated to support', value: escalated.length },
            { label: 'Messages total', value: sessions.reduce((a, s) => a + s._count.messages, 0) },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-[#c8c4a8] rounded-lg px-4 py-3">
              <div className="font-playfair text-2xl text-[#35291C]">{stat.value}</div>
              <div className="text-xs text-[#C4AB77]">{stat.label}</div>
            </div>
          ))}
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white border border-[#c8c4a8] rounded-lg p-10 text-center">
            <p className="font-baskerville italic text-[#4B4C44]">
              No chat sessions yet. Enable the AI Assistant in Features → AI chat assistant to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const wasEscalated = s.messages.some(m => m.escalated)
              return (
                <details key={s.id} className="bg-white border border-[#c8c4a8] rounded-lg overflow-hidden group">
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#fdfbf5] transition-colors list-none">
                    <div className="flex-1">
                      <div className="font-playfair text-sm text-[#35291C]">
                        {s.userEmail ?? 'Anonymous visitor'}
                        {wasEscalated && <span className="ml-2 text-xs text-[#C4AB77]">✉ escalated</span>}
                      </div>
                      <div className="text-xs text-[#C4AB77] mt-0.5">
                        {s.pageContext && <span>{s.pageContext} · </span>}
                        {format(s.createdAt, 'dd MMM yyyy, HH:mm')}
                      </div>
                    </div>
                    <span className="text-xs text-[#C4AB77] font-baskerville italic">{s._count.messages} messages</span>
                    <span className="text-[#c8c4a8] group-open:rotate-90 transition-transform text-sm">›</span>
                  </summary>

                  <div className="border-t border-[#e8e4d0] px-5 py-4 space-y-3 bg-[#fdfbf5]">
                    {s.messages.map(m => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] text-sm rounded-lg px-3 py-2 font-baskerville leading-snug ${
                          m.role === 'user'
                            ? 'bg-[#35291C] text-[#E8E6D8]'
                            : 'bg-white border border-[#e8e4d0] text-[#35291C]'
                        }`}>
                          {m.content}
                        </div>
                      </div>
                    ))}
                    {s.messages.length === 0 && (
                      <p className="text-xs text-[#C4AB77] italic">No messages in this session.</p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
