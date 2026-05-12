// filepath: src/utils/opportunityRecord.ts

/**
 * Creates a fully typed OpportunityRecord from a detected Opportunity.
 * Attaches session provenance: sessionId, sessionTitle, promptHash, timestamp.
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
import { generateCorrelationId } from './correlationId'
import type { Opportunity, OpportunityRecord, SessionMeta } from '@/types'

export function createOpportunityRecord(
  opportunity: Opportunity,
  meta:        SessionMeta
): OpportunityRecord {
  return {
    ...opportunity,
    id:           generateCorrelationId(),
    sessionId:    meta.sessionId,
    sessionTitle: meta.sessionTitle,
    detectedAt:   new Date().toISOString(),
    promptHash:   meta.promptHash,
  }
}

export function deriveSessionTitle(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, ' ')
  return trimmed.length > 72
    ? trimmed.slice(0, 72) + '…'
    : trimmed
}
