// filepath: src/hooks/useArgusStream.ts

'use client'

/**
 * Master streaming hook.
 *
 * MANDATE 1: sessionState uses RemoteData<StreamSessionState>.
 * MANDATE 2: AbortController on fetch + inside chunk read loop.
 *            reader.cancel() called on abort or unmount.
 * MANDATE 9: All errors emit structured ErrorMetadata with correlationId.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { parseStreamBuffer }    from '@/utils/streamParser'
import { hashPrompt }           from '@/utils/promptHash'
import { deriveSessionTitle }   from '@/utils/opportunityRecord'
import { generateCorrelationId } from '@/utils/correlationId'
import type {
  RemoteData,
  StreamSessionState,
  PipelineTier,
  PipelineStageId,
  SessionMeta,
  ErrorMetadata,
} from '@/types'

export interface UseArgusStreamReturn {
  sessionState:         RemoteData<StreamSessionState>
  buffer:               string
  detectedStageIds:     readonly PipelineStageId[]
  rawOpportunityBlocks: readonly string[]
  isAtClearanceGate:    boolean
  sessionMeta:          SessionMeta | null
  startStream:          (prompt: string, historyPayload: string) => Promise<void>
  abort:                () => void
  clearSession:         () => void
}

// ─────────────────────────────────────────────
// TIER DETECTION
// Infers the active pipeline tier from stream content.
// ─────────────────────────────────────────────
function detectTierInBuffer(buffer: string): PipelineTier | null {
  if (/TIER\s+1\s*[—\-–]\s*FULL/i.test(buffer))        return 1
  if (/TIER\s+2\s*[—\-–]\s*STREAMLINED/i.test(buffer)) return 2
  if (/TIER\s+3\s*[—\-–]\s*COMPONENT/i.test(buffer))   return 3
  return null
}

export function useArgusStream(): UseArgusStreamReturn {
  const [sessionState, setSessionState] = useState<RemoteData<StreamSessionState>>({
    status: 'idle',
  })
  const [buffer,               setBuffer]               = useState('')
  const [detectedStageIds,     setDetectedStageIds]     = useState<readonly PipelineStageId[]>([])
  const [rawOpportunityBlocks, setRawOpportunityBlocks] = useState<readonly string[]>([])
  const [isAtClearanceGate,    setIsAtClearanceGate]    = useState(false)
  const [sessionMeta,          setSessionMeta]          = useState<SessionMeta | null>(null)

  const abortRef     = useRef<AbortController | null>(null)
  const sessionIdRef = useRef<string>('')

  // ── Cleanup on unmount ───────────────────────
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // ── Start streaming ──────────────────────────
  const startStream = useCallback(
    async (prompt: string, historyPayload: string): Promise<void> => {
      // Abort any in-flight stream
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const sessionId    = generateCorrelationId()
      const promptHash   = await hashPrompt(prompt)
      const sessionTitle = deriveSessionTitle(prompt)
      sessionIdRef.current = sessionId

      setSessionMeta({ sessionId, sessionTitle, promptHash })
      setBuffer('')
      setDetectedStageIds([])
      setRawOpportunityBlocks([])
      setIsAtClearanceGate(false)
      setSessionState({ status: 'loading' })

      try {
        const response = await fetch('/api/argus/stream', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ prompt, conversationHistory: historyPayload }),
          signal:  controller.signal,
        })

        if (!response.ok) {
          const text = await response.text().catch(() => 'Unknown API error')
          throw new Error(`API ${response.status}: ${text.slice(0, 200)}`)
        }

        if (!response.body) throw new Error('No response body received from stream endpoint')

        const reader  = response.body.getReader()
        const decoder = new TextDecoder()
        let   accumulated = ''

        // ── Chunk read loop ────────────────────
        while (true) {
          // MANDATE 2: Check abort signal inside loop
          if (controller.signal.aborted) {
            await reader.cancel()
            setSessionState({ status: 'idle' })
            return
          }

          const { done, value } = await reader.read()
          if (done) break

          accumulated += decoder.decode(value, { stream: true })

          const parsed = parseStreamBuffer(accumulated)
          const tier   = detectTierInBuffer(accumulated)

          setBuffer(accumulated)
          setDetectedStageIds(parsed.detectedStageIds)
          setRawOpportunityBlocks(parsed.rawOpportunityBlocks)
          setIsAtClearanceGate(parsed.isAtClearanceGate)
          setSessionState({
            status: 'success',
            data: {
              session: {
                sessionId,
                tier,
                tokenCount: Math.ceil(accumulated.length / 3.5),
              },
              panelContent: parsed.panelContent,
            },
          })
        }

        // Final parse on stream end
        const finalParsed = parseStreamBuffer(accumulated)
        const finalTier   = detectTierInBuffer(accumulated)
        setSessionState({
          status: 'success',
          data: {
            session: {
              sessionId,
              tier:       finalTier,
              tokenCount: Math.ceil(accumulated.length / 3.5),
            },
            panelContent: finalParsed.panelContent,
          },
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          setSessionState({ status: 'idle' })
          return
        }

        const metadata: ErrorMetadata = {
          action:        'stream_start',
          payload:       { promptLength: prompt.length },
          timestamp:     new Date().toISOString(),
          correlationId: generateCorrelationId(),
        }
        setSessionState({
          status:   'error',
          message:  err instanceof Error ? err.message : 'Unknown streaming error',
          metadata,
        })
      }
    },
    []
  )

  // ── Abort ─────────────────────────────────
  const abort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // ── Clear session ──────────────────────────
  const clearSession = useCallback(() => {
    abortRef.current?.abort()
    setSessionState({ status: 'idle' })
    setBuffer('')
    setDetectedStageIds([])
    setRawOpportunityBlocks([])
    setIsAtClearanceGate(false)
    setSessionMeta(null)
  }, [])

  return {
    sessionState,
    buffer,
    detectedStageIds,
    rawOpportunityBlocks,
    isAtClearanceGate,
    sessionMeta,
    startStream,
    abort,
    clearSession,
  }
}
