// filepath: src/utils/tokenEstimator.ts

/**
 * Estimates token usage from character counts.
 * Heuristic: ~3.5 chars per token (conservative for code-heavy content).
 * Includes system prompt overhead (~8,000 tokens fixed per session).
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
import type { TokenBudget, PipelineTier } from '@/types'

const CHARS_PER_TOKEN       = 3.5
const SYSTEM_PROMPT_TOKENS  = 8_000
const MODEL_CONTEXT_LIMIT   = 200_000

// Minimum tokens needed to complete each tier
const TIER_TOKEN_FLOOR: Record<PipelineTier, number> = {
  1: 16_000,  // Full 17-process pipeline
  2: 8_000,   // Streamlined pipeline
  3: 3_000,   // Component-scale
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function calculateTokenBudget(
  currentBuffer:    string,
  historyText:      string
): TokenBudget {
  const bufferTokens  = estimateTokens(currentBuffer)
  const historyTokens = estimateTokens(historyText)
  const estimated     = SYSTEM_PROMPT_TOKENS + bufferTokens + historyTokens
  const remaining     = Math.max(0, MODEL_CONTEXT_LIMIT - estimated)

  const canSubmitTier: Record<PipelineTier, boolean> = {
    1: remaining >= TIER_TOKEN_FLOOR[1],
    2: remaining >= TIER_TOKEN_FLOOR[2],
    3: remaining >= TIER_TOKEN_FLOOR[3],
  }

  return {
    estimated,
    limit:       MODEL_CONTEXT_LIMIT,
    remaining,
    isNearLimit: remaining < 20_000,
    isCritical:  remaining < 8_000,
    canSubmitTier,
  }
}

export function formatTokenBudgetSummary(budget: TokenBudget): string {
  const pct = Math.round((budget.estimated / budget.limit) * 100)
  if (budget.isCritical)  return `⚠ Context critical — ${budget.remaining.toLocaleString()} tokens remaining`
  if (budget.isNearLimit) return `Context at ${pct}% — ${budget.remaining.toLocaleString()} tokens remaining`
  return `~${budget.estimated.toLocaleString()} tokens used`
}

export function getTierBlockedReason(
  budget: TokenBudget,
  tier:   PipelineTier
): string | null {
  if (budget.canSubmitTier[tier]) return null
  return `Insufficient context for Tier ${tier}. ${budget.remaining.toLocaleString()} tokens remain — ${TIER_TOKEN_FLOOR[tier].toLocaleString()} required. Start a new session.`
}
