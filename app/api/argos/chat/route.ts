import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  message: z.string().min(1).max(12000),
  conversationHistory: z.string().default('[]'),
  projectContext: z.string().max(4000).optional(),
})

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const requestLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < 60_000)
  if (timestamps.length >= 15) return true
  requestLog.set(ip, [...timestamps, now])
  return false
}

const ARGOS_SYSTEM_PROMPT = `You are ArgOS Evolution — a governed personal operating system and senior project partner.

Your role: You are the BRAIN. You talk to the user, manage project state, plan features, and decide what needs to be built. ARGUS v10 is the HANDS. You do NOT write implementation code yourself. You architect, plan, decide, and delegate.

CORE PRINCIPLES:
- Turn intent into complete, working systems
- Prioritize correctness, completion, clarity, resilience, and continuity
- Use the shortest response that fully solves the task
- Keep output mobile-friendly
- Challenge weak ideas
- Ask clarifying questions only when correctness is blocked

CONTEXT ANCHOR: Begin every response with a short paragraph containing current project state, what changed, current objective, and next best action.

HANDOFF PROTOCOL: When the user approves a feature for implementation, end your response with:
<argos_handoff>
{"feature":"name","spec":"detailed spec for ARGUS","tier":1,"context":"architectural context"}
</argos_handoff>

Tier guide: 1 = full application, 2 = single feature, 3 = single component.

OPERATING STATES: SHIP (usable now) | FREEZE (stable) | EXPAND (next upgrade)

OUTPUT: Short sections. Bullets preferred. Mobile-readable. No filler.`

function createTextStream(anthropicStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = anthropicStream.getReader()
      let sseBuffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          sseBuffer += decoder.decode(value, { stream: true })
          const lines = sseBuffer.split('\n')
          sseBuffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const event = JSON.parse(data)
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta' &&
                typeof event.delta.text === 'string'
              ) {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            } catch { /* skip */ }
          }
        }
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (isRateLimited(clientIp)) {
    return NextResponse.json({ error: 'Rate limited.' }, { status: 429 })
  }

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed.' }, { status: 400 })
  }

  const { message, conversationHistory: historyPayload, projectContext } = parsed.data

  let history: Array<{ role: string; content: string }> = []
  try {
    history = z.array(messageSchema).parse(JSON.parse(historyPayload))
  } catch {
    return NextResponse.json({ error: 'Invalid history format.' }, { status: 400 })
  }

  const systemPrompt = projectContext
    ? `${ARGOS_SYSTEM_PROMPT}\n\nCURRENT PROJECT CONTEXT:\n${projectContext}`
    : ARGOS_SYSTEM_PROMPT

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }],
      stream: true,
    }),
  })

  if (!anthropicResponse.ok || !anthropicResponse.body) {
    return NextResponse.json({ error: 'Upstream API error.' }, { status: anthropicResponse.status })
  }

  return new NextResponse(createTextStream(anthropicResponse.body), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
