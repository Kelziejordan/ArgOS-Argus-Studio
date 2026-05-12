// filepath: src/hooks/useOpportunityDetect.ts

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { extractOpportunities, type ExtractionFailure } from '@/utils/opportunityExtractor'
import { createOpportunityRecord } from '@/utils/opportunityRecord'
import type { Opportunity, OpportunityRecord, SessionMeta } from '@/types'

export interface UseOpportunityDetectReturn {
  liveOpportunities:  readonly Opportunity[]
  extractionFailures: readonly ExtractionFailure[]
  detectedCount:      number
  resetSession:       () => void
}

export function useOpportunityDetect(
  rawOpportunityBlocks: readonly string[],
  sessionMeta:          SessionMeta | null,
  onRecord:             (record: OpportunityRecord) => void
): UseOpportunityDetectReturn {
  const [liveOpportunities,  setLiveOpportunities]  = useState<readonly Opportunity[]>([])
  const [extractionFailures, setExtractionFailures] = useState<readonly ExtractionFailure[]>([])

  // Track how many blocks have already been processed so we only
  // process newly arrived blocks on each effect run.
  const processedCountRef = useRef(0)
  const onRecordRef       = useRef(onRecord)

  useEffect(() => {
    onRecordRef.current = onRecord
  }, [onRecord])

  // Process new blocks as they arrive in the stream
  useEffect(() => {
    const newBlocks = rawOpportunityBlocks.slice(processedCountRef.current)
    if (newBlocks.length === 0 || !sessionMeta) return

    const results = extractOpportunities(newBlocks)

    results.forEach((result) => {
      if (result.status === 'success') {
        setLiveOpportunities((prev) => [...prev, result.data])
        const record = createOpportunityRecord(result.data, sessionMeta)
        onRecordRef.current(record)
      } else {
        setExtractionFailures((prev) => [...prev, result])
        console.warn('[ARGUS] Opportunity extraction failure', {
          correlationId: result.correlationId,
          error:         result.error,
          raw:           result.raw.slice(0, 200),
        })
      }
    })

    processedCountRef.current = rawOpportunityBlocks.length
  }, [rawOpportunityBlocks, sessionMeta])

  const resetSession = useCallback(() => {
    setLiveOpportunities([])
    setExtractionFailures([])
    processedCountRef.current = 0
  }, [])

  return {
    liveOpportunities,
    extractionFailures,
    detectedCount: liveOpportunities.length,
    resetSession,
  }
}
