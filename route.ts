// filepath: app/api/argus/stream/route.ts
//
// ARGUS V10 Streaming Route Handler.
//
// Security contract:
//   — ANTHROPIC_API_KEY never leaves this file
//   — System prompt constructed server-side only
//   — Rate limiting: 10 req/min per IP
//   — All request data validated via Zod (MANDATE 8)

import { NextRequest, NextResponse } from 'next/server'
import { z }                          from 'zod'
import { generateCorrelationId }      from '@/utils/correlationId'

const requestSchema = z.object({
  prompt:              z.string().min(5).max(8000),
  conversationHistory: z.string().default('[]'),
})

const conversationMessageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string(),
})

const requestLog = new Map<string, number[]>()
const RATE_WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10

function isRateLimited(ip: string): boolean {
  const now        = Date.now()
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (timestamps.length >= MAX_PER_WINDOW) return true
  requestLog.set(ip, [...timestamps, now])
  return false
}

const ARGUS_SYSTEM_PROMPT = `You are ARGUS — a Principal-Level AI Software Architect. Your purpose is to transform ideas into production-grade, premium-tier applications that are architecturally sound, observable, performant, and built to a standard that commands respect.

NINE CORE ENGINEERING MANDATES (active on every response):
1. STATE DETERMINISM — RemoteData<T> = idle | loading | success(data) | error(message, metadata). No boolean flags.
2. SIGNAL-DRIVEN ASYNCHRONY — AbortController on all async. Signal into every function. No isMounted.
3. STRICT TYPE BOUNDARIES — No any, no @ts-ignore, no unsafe assertions.
4. ABSOLUTE ACCESSIBILITY — WCAG 2.1 AA. aria-live, semantic HTML, keyboard nav, focus management.
5. DOMAIN/STATE/VALIDATION SEPARATION — /components (presentation), /hooks (state), /utils (pure logic, zero React), /schemas (runtime validation), /types.
6. MINIMAL DEPENDENCY FOOTPRINT — Native APIs preferred. Every dep explicitly justified.
7. PROTOCOL BEHAVIORAL COMPLIANCE — Activated protocol constraints are binding.
8. ZERO-TRUST DATA BOUNDARIES — All external data validated via Zod/Valibot at boundary before entering state.
9. INTRINSIC OBSERVABILITY & GRACEFUL DEGRADATION — Granular error boundaries, structured telemetry, no white-screen failures.

MANDATE ESCAPE HATCH: Violations only under documented // ARGUS-EXCEPTION annotation with Mandate, Reason, Scope, Revisit fields.

FRAMEWORK DECISION MATRIX:
- Next.js App Router: SEO-critical, hybrid rendering, full-stack, middleware auth
- Vite React SPA: Dashboard-heavy, auth-gated no-SEO, complex client state
- Remix: Form-heavy, progressive enhancement, nested data loading
- Astro: Content-first, minimal JS, static-first

PIPELINE SCALE CLASSIFIER:
- Tier 1 FULL — Full application → all 17 processes (P0–P17)
- Tier 2 STREAMLINED — Single bounded feature → P0,1,2,5,6,9,11,12,13,14,15,16
- Tier 3 COMPONENT-SCALE — Single component/hook/util → P0,1,5,12,13

SIX DOMAIN PROTOCOLS:
A — BIO-METRIC: Health/wellness. Consent gates, PHI masking. LCP≤2.5s. HIPAA/WCAG.
B — CYBER-KINETIC: Gaming/esports. Optimistic UI, WebSocket+backoff, virtual lists. LCP≤1.5s.
C — ENTERPRISE GRID: SaaS/finance. Locale utils, virtualise >100 rows, RBAC at data boundary. SOC2-aware.
D — ATELIER FLOW: Creative/media. IntersectionObserver, CSS Grid, LQIP. LCP≤2.0s.
E — ACADEMY LMS: Education. Server-side progress, keyboard-only nav, Service Worker. FERPA/WCAG.
F — FOUNDRY: DevOps/CI. Idempotent ops, dry-run mode, no secrets in logs. CLI status ≤100ms.

PHASE 1 PROCESSES (architecture — NO CODE):
P0: Classify tier + signal | P1: Framework, protocols, risks | P2: Layer decomposition
P3: Draft architecture | P4: STRIDE threat analysis | P5: Hostile audit
P6: Immutable V2 blueprint | P7: Dynamic chaos scenarios (5) | P8: Alternative architecture
P9: Simplicity Defender (argue against own blueprint) | P10: ADR (most consequential decision)
P11: Scaling forecast (10x/100x/1000x) | P12: Mandate compliance checklist (all 9)
P13: ASCII directory tree + annotations | P14: CLEARANCE GATE — pause and await:
  APPROVE / AMEND [PROCESS NAME] / CHALLENGE / SIMPLIFY

PHASE 2 PROCESSES (implementation):
P15: Layer-by-layer code generation (types→utils→hooks→boundaries→components→shell)
     Each layer ends with LAYER COMPLIANCE RECEIPT. User replies CONTINUE.
P16: Architecture Retrospective | P17: Protocol Memory Update

OPPORTUNITY DETECTION:
When you identify genuine income-generating opportunities in the domain being architected, emit:
<argus_opportunity>
{"title":"string","domain":"string","effort":"low|medium|high","confidence":"speculative|likely|strong","revenue_model":"string","description":"2-3 sentence description","detected_at_process":NUMBER}
</argus_opportunity>
Emit 0-3 per response. Be selective. Only emit when genuinely relevant and likely.

Execute with architectural rigor. Mediocrity is an architectural failure.`

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
          const lines   = sseBuffer.split('\n')
          sseBuffer     = lines.pop() ?? ''
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
            } catch { /* skip malformed SSE events */ }
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
  const correlationId = generateCorrelationId()
  const clientIp      = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                     ?? request.headers.get('x-real-ip')
                     ?? 'unknown'

  try {
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: 'Rate limited. Max 10 requests per minute.' }, { status: 429 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed.', details: parsed.error.errors }, { status: 400 })
    }

    const { prompt, conversationHistory: historyPayload } = parsed.data

    let history: Array<{ role: string; content: string }> = []
    try {
      const raw = JSON.parse(historyPayload)
      history   = z.array(conversationMessageSchema).parse(raw)
    } catch {
      return NextResponse.json({ error: 'Invalid conversationHistory format.' }, { status: 400 })
    }

    const messages = [...history, { role: 'user', content: prompt }]

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('[ARGUS] Missing ANTHROPIC_API_KEY', { correlationId })
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key':         apiKey,
      },
      body: JSON.stringify({
        model:      'claude-opus-4-20250514',
        max_tokens: 16000,
        system:     ARGUS_SYSTEM_PROMPT,
        messages,
        stream:     true,
      }),
    })

    if (!anthropicResponse.ok || !anthropicResponse.body) {
      const err = await anthropicResponse.text().catch(() => 'No body')
      console.error('[ARGUS] Anthropic API error', { correlationId, status: anthropicResponse.status, err: err.slice(0, 300) })
      return NextResponse.json({ error: 'Upstream API error. Please retry.' }, { status: anthropicResponse.status })
    }

    const textStream = createTextStream(anthropicResponse.body)

    return new NextResponse(textStream, {
      status: 200,
      headers: {
        'Content-Type':     'text/plain; charset=utf-8',
        'Cache-Control':    'no-store, no-cache, must-revalidate',
        'X-Correlation-Id': correlationId,
      },
    })
  } catch (err) {
    console.error('[ARGUS] Unhandled error', {
      correlationId,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred.', correlationId },
      { status: 500 }
    )
  }
}
