// filepath: src/hooks/usePipelineProgress.ts

'use client'

import { useMemo } from 'react'
import { STAGES_FOR_TIER } from '@/types/pipeline'
import type {
  PipelineProgress,
  PipelineStageId,
  PipelineTier,
  ClearanceOption,
} from '@/types'

export const DEFAULT_CLEARANCE_OPTIONS: readonly ClearanceOption[] = [
  {
    type:        'APPROVE',
    label:       'APPROVE',
    description: 'Architecture accepted. Begin Phase 2 implementation.',
  },
  {
    type:        'AMEND',
    label:       'AMEND [PROCESS]',
    description: 'Rerun a specific process with new constraints.',
  },
  {
    type:        'CHALLENGE',
    label:       'CHALLENGE',
    description: 'Force a second Hostile Audit pass against the V2 blueprint.',
  },
  {
    type:        'SIMPLIFY',
    label:       'SIMPLIFY',
    description: 'Invoke an additional Simplicity Defender pass.',
  },
]

export interface UsePipelineProgressReturn {
  progress:     PipelineProgress
  activeStageId: PipelineStageId | null
}

export function usePipelineProgress(
  detectedStageIds: readonly PipelineStageId[],
  isAtClearanceGate: boolean,
  tier: PipelineTier | null
): UsePipelineProgressReturn {

  const progress = useMemo<PipelineProgress>(() => {
    const completedStages = [...detectedStageIds] as PipelineStageId[]
    const currentStage    = completedStages.length > 0
      ? completedStages[completedStages.length - 1] ?? null
      : null

    // Only expose stages that are in the active tier
    const tieredCompleted = tier
      ? completedStages.filter((id) =>
          STAGES_FOR_TIER(tier).some((s) => s.id === id)
        )
      : completedStages

    return {
      tier,
      currentStage,
      completedStages:        tieredCompleted,
      isAtClearanceGate,
      activeClearanceOptions: isAtClearanceGate ? DEFAULT_CLEARANCE_OPTIONS : [],
    }
  }, [detectedStageIds, isAtClearanceGate, tier])

  const activeStageId = useMemo<PipelineStageId | null>(
    () =>
      progress.completedStages.length > 0
        ? progress.completedStages[progress.completedStages.length - 1] ?? null
        : null,
    [progress.completedStages]
  )

  return { progress, activeStageId }
}
