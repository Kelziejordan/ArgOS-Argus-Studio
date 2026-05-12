// filepath: src/utils/streamParser.ts

/**
 * Routes accumulated stream buffer content to the correct display panels.
 * Extracts raw opportunity tag blocks for the detection pipeline.
 * Detects ARGUS pipeline stage markers and clearance gate trigger.
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
import {
  OPPORTUNITY_OPEN_TAG,
  OPPORTUNITY_CLOSE_TAG,
  CLEARANCE_GATE_PATTERN,
  ALTERNATIVE_SECTION_PATTERN,
} from '@/types/pipeline'
import { detectStagesInBuffer } from './stageDetector'
import type { PanelContent, PipelineStageId } from '@/types'

export interface ParsedBuffer {
  readonly panelContent:         PanelContent
  readonly rawOpportunityBlocks: readonly string[]
  readonly detectedStageIds:     readonly PipelineStageId[]
  readonly isAtClearanceGate:    boolean
}

// ─────────────────────────────────────────────
// OPPORTUNITY BLOCK EXTRACTION
// Extracts raw XML blocks without parsing JSON.
// JSON parsing is deferred to opportunityExtractor.
// ─────────────────────────────────────────────
function extractOpportunityBlocks(buffer: string): string[] {
  const blocks: string[] = []
  const tagRegex = new RegExp(
    `${OPPORTUNITY_OPEN_TAG.replace('<', '<').replace('>', '>')}([\\s\\S]*?)${OPPORTUNITY_CLOSE_TAG.replace('<', '<').replace('>', '>')}`,
    'gi'
  )
  let match: RegExpExecArray | null
  while ((match = tagRegex.exec(buffer)) !== null) {
    if (match[1]) blocks.push(match[1].trim())
  }
  return blocks
}

// ─────────────────────────────────────────────
// STRIP OPPORTUNITY BLOCKS FROM DISPLAY CONTENT
// Raw opportunity JSON should not render in the
// main stream panel — only the extracted cards.
// ─────────────────────────────────────────────
function stripOpportunityBlocks(buffer: string): string {
  const tagRegex = new RegExp(
    `${OPPORTUNITY_OPEN_TAG}[\\s\\S]*?${OPPORTUNITY_CLOSE_TAG}`,
    'gi'
  )
  return buffer.replace(tagRegex, '').trim()
}

// ─────────────────────────────────────────────
// ALTERNATIVE ARCHITECTURE SECTION SLICER
// Extracts Process 8 content into its own panel.
// Heuristic: content from P8 marker to next
// PROCESS N marker.
// ─────────────────────────────────────────────
function extractAlternativeSection(buffer: string): string {
  const p8Match = ALTERNATIVE_SECTION_PATTERN.exec(buffer)
  if (!p8Match || p8Match.index === undefined) return ''

  const afterP8      = buffer.slice(p8Match.index)
  const nextProcess  = /\nPROCESS\s+\d{1,2}\s*[—\-–]/i.exec(afterP8.slice(50))
  const endIdx       = nextProcess
    ? 50 + (nextProcess.index ?? afterP8.length)
    : afterP8.length

  return afterP8.slice(0, endIdx).trim()
}

// ─────────────────────────────────────────────
// MAIN PARSE FUNCTION
// Called on every buffer update from useArgusStream.
// ─────────────────────────────────────────────
export function parseStreamBuffer(buffer: string): ParsedBuffer {
  const rawOpportunityBlocks = extractOpportunityBlocks(buffer)
  const cleanBuffer          = stripOpportunityBlocks(buffer)
  const detectedStageIds     = detectStagesInBuffer(buffer)
  const isAtClearanceGate    = CLEARANCE_GATE_PATTERN.test(buffer)
  const alternativeContent   = extractAlternativeSection(cleanBuffer)

  const panelContent: PanelContent = {
    main:         cleanBuffer,
    alternative:  alternativeContent,
    clearanceGate: isAtClearanceGate ? cleanBuffer : '',
    nextMove:     '',
  }

  return {
    panelContent,
    rawOpportunityBlocks,
    detectedStageIds,
    isAtClearanceGate,
  }
}
