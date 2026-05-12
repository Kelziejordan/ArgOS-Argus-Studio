// filepath: src/types/index.ts

// ─────────────────────────────────────────────
// MANDATE 1 — STATE DETERMINISM
// RemoteData<T> replaces all boolean flag patterns.
// Every async state is a discriminated union.
// ─────────────────────────────────────────────
export type ErrorMetadata = {
  readonly action:        string
  readonly payload?:      unknown
  readonly state?:        unknown
  readonly timestamp:     string
  readonly correlationId: string
}

export type RemoteData<T> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: T }
  | { readonly status: 'error';   readonly message: string; readonly metadata: ErrorMetadata }

// ─────────────────────────────────────────────
// PIPELINE TYPES
// ─────────────────────────────────────────────
export type PipelineTier    = 1 | 2 | 3
export type PipelineStageId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17

export type ClearanceOptionType = 'APPROVE' | 'AMEND' | 'CHALLENGE' | 'SIMPLIFY'

export interface ClearanceOption {
  readonly type:        ClearanceOptionType
  readonly label:       string
  readonly description: string
}

export interface PipelineProgress {
  readonly tier:                   PipelineTier | null
  readonly currentStage:           PipelineStageId | null
  readonly completedStages:        readonly PipelineStageId[]
  readonly isAtClearanceGate:      boolean
  readonly activeClearanceOptions: readonly ClearanceOption[]
}

// ─────────────────────────────────────────────
// OPPORTUNITY TYPES
// ─────────────────────────────────────────────
export type OpportunityEffort     = 'low' | 'medium' | 'high'
export type OpportunityConfidence = 'speculative' | 'likely' | 'strong'
export type OpportunitySource     = 'strict' | 'recovered'

export interface Opportunity {
  readonly title:                string
  readonly domain:               string
  readonly effort:               OpportunityEffort
  readonly revenue_model:        string
  readonly description:          string
  readonly detected_at_process:  number
  readonly confidence:           OpportunityConfidence
  readonly source:               OpportunitySource
  readonly score:                number
}

export interface OpportunityRecord extends Opportunity {
  readonly id:           string
  readonly sessionId:    string
  readonly sessionTitle: string
  readonly detectedAt:   string
  readonly promptHash:   string
}

export interface OpportunityHistoryPage {
  readonly records:    readonly OpportunityRecord[]
  readonly totalCount: number
  readonly hasMore:    boolean
  readonly page:       number
}

// ─────────────────────────────────────────────
// SESSION & STREAM TYPES
// ─────────────────────────────────────────────
export interface SessionMeta {
  readonly sessionId:    string
  readonly sessionTitle: string
  readonly promptHash:   string
}

export interface PanelContent {
  readonly main:         string
  readonly alternative:  string
  readonly clearanceGate: string
  readonly nextMove:     string
}

export interface StreamSessionState {
  readonly session: {
    readonly sessionId:   string
    readonly tier:        PipelineTier | null
    readonly tokenCount:  number
  }
  readonly panelContent: PanelContent
}

// ─────────────────────────────────────────────
// TOKEN BUDGET
// ─────────────────────────────────────────────
export interface TokenBudget {
  readonly estimated:      number
  readonly limit:          number
  readonly remaining:      number
  readonly isNearLimit:    boolean
  readonly isCritical:     boolean
  readonly canSubmitTier:  Record<PipelineTier, boolean>
}

// ─────────────────────────────────────────────
// CONVERSATION (for multi-phase sessions)
// ─────────────────────────────────────────────
export interface ConversationMessage {
  readonly role:    'user' | 'assistant'
  readonly content: string
}
