import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSetting } from '@/lib/settings'
import { isEnabled } from '@/lib/features'

export async function POST(req: NextRequest) {
  if (!await isEnabled('ai_chat')) return NextResponse.json({ error: 'AI chat is not enabled.' }, { status: 403 })
  try {
    const { sessionId, message, pageContext } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const [
      baseSystemPrompt,
      historyLength,
      personaName,
      welcomeMessage,
      offlineMessage,
      injectKB,
      model,
      dbApiKey,
    ] = await Promise.all([
      getSetting<string>('ai.systemPrompt', 'You are Cornelius, a knowledgeable Victorian gentleman who assists patrons of The Victorian Illustrated Gazette.'),
      getSetting<number>('ai.historyLength', 10),
      getSetting<string>('ai.personaName', 'Cornelius'),
      getSetting<string>('ai.welcomeMessage', 'Good day! I am Cornelius. How may I be of service?'),
      getSetting<string>('ai.offlineMessage', 'Our correspondent is temporarily indisposed. Please try again shortly.'),
      getSetting<boolean>('ai.injectKnowledgeBase', true),
      getSetting<string>('ai.model', 'claude-haiku-4-5-20251001'),
      getSetting<string>('ai.apiKey', ''),
    ])

    // Build system prompt — optionally append KB articles as FAQ context
    let systemPrompt = baseSystemPrompt
    if (injectKB) {
      const articles = await db.kbArticle.findMany({
        where: { published: true },
        select: { title: true, body: true },
        orderBy: { title: 'asc' },
        take: 30,
      })
      if (articles.length > 0) {
        const faqBlock = articles
          .map(a => `### ${a.title}\n${a.body.slice(0, 600)}`)
          .join('\n\n')
        systemPrompt += `\n\n---\n\nThe following are your published help articles. Use them to answer visitor questions accurately:\n\n${faqBlock}`
      }
    }

    // Get or create session
    let session = sessionId
      ? await db.chatSession.findUnique({
          where: { id: sessionId },
          include: { messages: { orderBy: { createdAt: 'asc' }, take: historyLength } },
        })
      : null

    if (!session) {
      session = await db.chatSession.create({
        data: { pageContext: pageContext ?? null },
        include: { messages: true },
      })
    }

    // Save user message
    await db.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: message },
    })

    // Build message history for Claude
    const history = session.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    history.push({ role: 'user', content: message })

    // Call Claude — graceful fallback if no API key
    let reply = offlineMessage
    const apiKey = process.env.ANTHROPIC_API_KEY || dbApiKey

    if (apiKey) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk')
        const client = new Anthropic({ apiKey })
        const response = await client.messages.create({
          model,
          max_tokens: 600,
          system: systemPrompt,
          messages: history,
        })
        reply = response.content[0].type === 'text' ? response.content[0].text : offlineMessage
      } catch (err) {
        console.error('[Cornelius] Claude API error:', err)
        reply = offlineMessage
      }
    }

    // Save assistant reply
    const assistantMsg = await db.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: reply },
    })

    return NextResponse.json({
      sessionId: session.id,
      message: { id: assistantMsg.id, role: 'assistant', content: reply },
    })
  } catch (err) {
    console.error('[Cornelius] handler error:', err)
    return NextResponse.json({ error: 'Failed to process message.' }, { status: 500 })
  }
}
