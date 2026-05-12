// filepath: src/utils/opportunityExtractor.ts

/**
 * Parses raw JSON strings extracted from <argus_opportunity> tags.
 * Runs Zod validation before returning any typed Opportunity.
 * Returns discriminated results — never throws.
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 * MANDATE 8: All external data validated at boundary before use.
 */
import { opportunitySchema } from '@/schemas/opportunitySchema'
import { generateCorrelationId } from './correlationId'
import type { Opportunity } from '@/types'

export type ExtractionSuccess = {
  readonly status: 'success'
  readonly data:   Opportunity
  readonly source: 'strict' | 'recovered'
}

export type ExtractionFailure = {
  readonly status:       'failure'
  readonly raw:          string
  readonly error:        string
  readonly correlationId: string
  readonly timestamp:    string
}

export type ExtractionResult = ExtractionSuccess | ExtractionFailure

// ─────────────────────────────────────────────
// SCORE HELPER
// ─────────────────────────────────────────────
const CONFIDENCE_WEIGHT: Record<string, number> = {
  speculative: 1, likely: 2, strong: 3,
}
const EFFORT_WEIGHT: Record<string, number> = {
  low: 3, medium: 2, high: 1,
}

function scoreOpportunity(
  confidence: string,
  effort: string
): number {
  return ((CONFIDENCE_WEIGHT[confidence] ?? 1) * 2) +
         (EFFORT_WEIGHT[effort] ?? 1)
}

// ─────────────────────────────────────────────
// STRICT EXTRACTION
// ─────────────────────────────────────────────
function tryStrict(raw: string): ExtractionResult {
  try {
    const parsed = JSON.parse(raw)
    const scored = {
      ...parsed,
      source: 'strict',
      score:  scoreOpportunity(parsed.confidence, parsed.effort),
    }
    const result = opportunitySchema.safeParse(scored)
    if (result.success) {
      return { status: 'success', data: result.data as Opportunity, source: 'strict' }
    }
    return {
      status:        'failure',
      raw,
      error:         result.error.errors.map((e) => e.message).join('; '),
      correlationId: generateCorrelationId(),
      timestamp:     new Date().toISOString(),
    }
  } catch (e) {
    return {
      status:        'failure',
      raw,
      error:         e instanceof Error ? e.message : 'JSON parse error',
      correlationId: generateCorrelationId(),
      timestamp:     new Date().toISOString(),
    }
  }
}

// ─────────────────────────────────────────────
// RECOVERY EXTRACTION (fuzzy)
// ─────────────────────────────────────────────
function tryRecovery(raw: string): ExtractionResult {
  try {
    const cleaned = raw
      .replace(/(\w+)\s*:/g, '"$1":')  // unquoted keys
      .replace(/'/g, '"')               // single → double quotes
      .replace(/,\s*}/g, '}')           // trailing commas
    const parsed = JSON.parse(cleaned)
    const scored = {
      ...parsed,
      confidence: parsed.confidence ?? 'speculative',
      source:     'recovered',
      score:      scoreOpportunity(
        parsed.confidence ?? 'speculative',
        parsed.effort ?? 'medium'
      ),
    }
    const result = opportunitySchema.safeParse(scored)
    if (result.success) {
      return { status: 'success', data: result.data as Opportunity, source: 'recovered' }
    }
    return {
      status:        'failure',
      raw,
      error:         'Recovery parse failed: ' + result.error.errors[0]?.message,
      correlationId: generateCorrelationId(),
      timestamp:     new Date().toISOString(),
    }
  } catch (e) {
    return {
      status:        'failure',
      raw,
      error:         'Recovery JSON error: ' + (e instanceof Error ? e.message : 'unknown'),
      correlationId: generateCorrelationId(),
      timestamp:     new Date().toISOString(),
    }
  }
}

// ─────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────
export function extractOpportunity(raw: string): ExtractionResult {
  const strict = tryStrict(raw)
  if (strict.status === 'success') return strict
  return tryRecovery(raw)
}

export function extractOpportunities(raws: readonly string[]): ExtractionResult[] {
  return raws.map(extractOpportunity)
}
