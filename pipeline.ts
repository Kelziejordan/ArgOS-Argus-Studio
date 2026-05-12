// filepath: src/types/pipeline.ts

import type { PipelineStageId, PipelineTier } from './index'

export type PipelinePhase = 'architecture' | 'implementation'

export interface PipelineStageDefinition {
  readonly id:            PipelineStageId
  readonly processNumber: number
  readonly label:         string
  readonly shortLabel:    string
  readonly phase:         PipelinePhase
  readonly tiers:         readonly PipelineTier[]
}

// ─────────────────────────────────────────────
// ALL 18 PIPELINE STAGES (P0–P17)
// Tier membership per ARGUS V10 protocol spec.
// ─────────────────────────────────────────────
export const PIPELINE_STAGES: readonly PipelineStageDefinition[] = [
  { id: 0,  processNumber: 0,  label: 'Pipeline Classifier',    shortLabel: 'Classifier',  phase: 'architecture',    tiers: [1, 2, 3] },
  { id: 1,  processNumber: 1,  label: 'Strategist',             shortLabel: 'Strategist',  phase: 'architecture',    tiers: [1, 2, 3] },
  { id: 2,  processNumber: 2,  label: 'System Decomposer',      shortLabel: 'Decomposer',  phase: 'architecture',    tiers: [1, 2]    },
  { id: 3,  processNumber: 3,  label: 'Generator V1',           shortLabel: 'Draft',       phase: 'architecture',    tiers: [1]       },
  { id: 4,  processNumber: 4,  label: 'Threat Surface',         shortLabel: 'Threats',     phase: 'architecture',    tiers: [1]       },
  { id: 5,  processNumber: 5,  label: 'Verifier',               shortLabel: 'Verifier',    phase: 'architecture',    tiers: [1, 2, 3] },
  { id: 6,  processNumber: 6,  label: 'Generator V2',           shortLabel: 'Blueprint',   phase: 'architecture',    tiers: [1, 2]    },
  { id: 7,  processNumber: 7,  label: 'Chaos Engineer',         shortLabel: 'Chaos',       phase: 'architecture',    tiers: [1]       },
  { id: 8,  processNumber: 8,  label: 'Alternative Analysis',   shortLabel: 'Alternatives',phase: 'architecture',    tiers: [1]       },
  { id: 9,  processNumber: 9,  label: 'Simplicity Defender',    shortLabel: 'Simplicity',  phase: 'architecture',    tiers: [1, 2]    },
  { id: 10, processNumber: 10, label: 'Architecture Decision',  shortLabel: 'ADR',         phase: 'architecture',    tiers: [1]       },
  { id: 11, processNumber: 11, label: 'Scaling Forecast',       shortLabel: 'Scaling',     phase: 'architecture',    tiers: [1, 2]    },
  { id: 12, processNumber: 12, label: 'Mandate Reinforcement',  shortLabel: 'Mandates',    phase: 'architecture',    tiers: [1, 2, 3] },
  { id: 13, processNumber: 13, label: 'Architectural Blueprint',shortLabel: 'Blueprint',   phase: 'architecture',    tiers: [1, 2, 3] },
  { id: 14, processNumber: 14, label: 'Clearance Gate',         shortLabel: 'Clearance',   phase: 'architecture',    tiers: [1, 2, 3] },
  { id: 15, processNumber: 15, label: 'Layer Generation',       shortLabel: 'Generation',  phase: 'implementation',  tiers: [1, 2, 3] },
  { id: 16, processNumber: 16, label: 'Retrospective',          shortLabel: 'Retro',       phase: 'implementation',  tiers: [1, 2]    },
  { id: 17, processNumber: 17, label: 'Protocol Update',        shortLabel: 'Protocol',    phase: 'implementation',  tiers: [1]       },
] as const

// ─────────────────────────────────────────────
// LOOKUP: stage ID → stage definition
// ─────────────────────────────────────────────
export const STAGE_BY_ID: Record<PipelineStageId, PipelineStageDefinition> =
  Object.fromEntries(
    PIPELINE_STAGES.map((s) => [s.id, s])
  ) as Record<PipelineStageId, PipelineStageDefinition>

// ─────────────────────────────────────────────
// HELPER: stages included in a given tier
// ─────────────────────────────────────────────
export function STAGES_FOR_TIER(tier: PipelineTier): readonly PipelineStageDefinition[] {
  return PIPELINE_STAGES.filter((s) => s.tiers.includes(tier))
}

// ─────────────────────────────────────────────
// STREAM DETECTION PATTERNS
// Used by stageDetector.ts to identify PROCESS N
// markers as they appear in the stream buffer.
// ─────────────────────────────────────────────
export const STAGE_MARKER_REGEX = /PROCESS\s+(\d{1,2})\s*[—\-–]/gi

export const CLEARANCE_GATE_PATTERN =
  /ARGUS V10\s*[—\-–]\s*ARCHITECTURE COMPLETE/i

export const OPPORTUNITY_OPEN_TAG  = '<argus_opportunity>'
export const OPPORTUNITY_CLOSE_TAG = '</argus_opportunity>'

export const ALTERNATIVE_SECTION_PATTERN =
  /PROCESS\s+8\s*[—\-–]\s*ALTERNATIVE/i
