import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  prompt: z.string().min(5).max(8000),
  conversationHistory: z.string().default('[]'),
})

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const requestLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < 60_000)
  if (timestamps.length >= 10) return true
  requestLog.set(ip, [...timestamps, now])
  return false
}

function getAnthropicKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`ANTHROPIC_API_KEY_${i}`]
    if (key) keys.push(key)
  }
  const fallback = process.env.ANTHROPIC_API_KEY
  if (fallback && !keys.includes(fallback)) keys.push(fallback)
  return keys
}

const ARGUS_SYSTEM_PROMPT = `You are ARGUS — a Principal-Level AI Software Architect. Your purpose is to transform ideas into production-grade, premium-tier applications that are architecturally sound, observable, performant, and built to a standard that commands respect.

NINE CORE ENGINEERING MANDATES:
1. STATE DETERMINISM — RemoteData<T> = idle | loading | success(data) | error(message, metadata). No boolean flags.
2. SIGNAL-DRIVEN ASYNCHRONY — AbortController on all async. Signal into every function. No isMounted.
3. STRICT TYPE BOUNDARIES — No any, no @ts-ignore, no unsafe assertions.
4. ABSOLUTE ACCESSIBILITY — WCAG 2.1 AA. aria-live, semantic HTML, keyboard nav, focus management.
5. DOMAIN/STATE/VALIDATION SEPARATION — /components /hooks /utils /schemas /types.
6. MINIMAL DEPENDENCY FOOTPRINT — Native APIs preferred. Every dep explicitly justified.
7. PROTOCOL BEHAVIORAL COMPLIANCE — Activated protocol constraints are binding.
8. ZERO-TRUST DATA BOUNDARIES — All external data validated via Zod at boundary before entering state.
9. INTRINSIC OBSERVABILITY — Granular error boundaries, structured telemetry, no white-screen failures.

PIPELINE SCALE CLASSIFIER:
- Tier 1 FULL — Full application → all 17 processes (P0–P17)
- Tier 2 STREAMLINED — Single bounded feature → P0,1,2,5,6,9,11,12,13,14,15,16
- Tier 3 COMPONENT-SCALE — Single component/hook/util → P0,1,5,12,13

PHASE 1 (architecture — NO CODE):
P0: Classify tier | P1: Framework, protocols, risks | P2: Layer decomposition
P3: Draft architecture | P4: STRIDE threat analysis | P5: Hostile audit
P6: Immutable V2 blueprint | P7: Chaos scenarios | P8: Alternative architecture
P9: Simplicity Defender | P10: ADR | P11: Scaling forecast
P12: Mandate compliance checklist | P13: ASCII directory tree
P14: CLEARANCE GATE — pause and await: APPROVE / AMEND / CHALLENGE / SIMPLIFY

PHASE 2 (implementation):
P15: Layer-by-layer code generation
P16: Architecture Retrospective | P17: Protocol Memory Update

OPPORTUNITY DETECTION:
<argus_opportunity>
{"title":"string","domain":"string","effort":"low|medium|high","confidence":"speculative|likely|strong","revenue_model":"string","description":"2-3 sentences"}
</argus_opportunity>

Execute with architectural rigor. Mediocrity is an architectural failure.`

function createAnthropicStream(
  anthropicStream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
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

async function tryAnthropic(
  messages: Array<{ role: string; content: string }>
): Promise<NextResponse | null> {
  const keys = getAnthropicKeys()
  for (const apiKey of keys) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250514',
          max_tokens: 16000,
          system: ARGUS_SYSTEM_PROMPT,
          messages,
          stream: true,
        }),
      })
      if (res.status === 429 || res.status === 402) continue
      if (!res.ok || !res.body) continue
      return new NextResponse(createAnthropicStream(res.body), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Provider': 'anthropic',
        },
      })
    } catch { continue }
  }
  return null
}

async function tryGemini(
  messages: Array<{ role: string; content: string }>
): Promise<NextResponse | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ARGUS_SYSTEM_PROMPT }] },
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: 16000, temperature: 0.7 },
        }),
      }
    )

    if (!res.ok || !res.body) return null

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = res.body!.getReader()
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              try {
                const event = JSON.parse(data)
                const text = event?.candidates?.[0]?.content?.parts?.[0]?.text
                if (typeof text === 'string') {
                  controller.enqueue(encoder.encode(text))
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

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Provider': 'gemini',
      },
    })
  } catch { return null }
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

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

  const { prompt, conversationHistory: historyPayload } = parsed.data

  let history: Array<{ role: string; content: string }> = []
  try {
    history = z.array(messageSchema).parse(JSON.parse(historyPayload))
  } catch {
    return NextResponse.json({ error: 'Invalid history format.' }, { status: 400 })
  }

  const messages = [...history, { role: 'user', content: prompt }]

  const anthropicResult = await tryAnthropic(messages)
  if (anthropicResult) return anthropicResult

  const geminiResult = await tryGemini(messages)
  if (geminiResult) return geminiResult

  return NextResponse.json(
    { error: 'All providers exhausted. Please add API credits.' },
    { status: 503 }
  )
}
