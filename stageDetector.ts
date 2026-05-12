// filepath: src/utils/stageDetector.ts

/**
 * Detects ARGUS pipeline stage markers in stream content.
 * Matches patterns like: "PROCESS 4 — THREAT SURFACE ANALYSIS"
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
import { STAGE_MARKER_REGEX }  from '@/types/pipeline'
import type { PipelineStageId } from '@/types'

export function detectStagesInBuffer(buffer: string): PipelineStageId[] {
  const found = new Set<PipelineStageId>()
  const regex = new RegExp(STAGE_MARKER_REGEX.source, 'gi')
  let match: RegExpExecArray | null

  while ((match = regex.exec(buffer)) !== null) {
    const num = parseInt(match[1] ?? '', 10)
    if (!isNaN(num) && num >= 0 && num <= 17) {
      found.add(num as PipelineStageId)
    }
  }

  return Array.from(found).sort((a, b) => a - b)
}

export function detectCurrentStage(buffer: string): PipelineStageId | null {
  const stages = detectStagesInBuffer(buffer)
  return stages.length > 0 ? (stages[stages.length - 1] ?? null) : null
}
