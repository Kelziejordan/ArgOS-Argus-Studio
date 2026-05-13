import type { PipelineStage } from './index'

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 0,  code: 'P0',  label: 'Tier Classification',     description: 'Classify scale and signal',                  phase: 1 },
  { id: 1,  code: 'P1',  label: 'Framework Selection',     description: 'Framework, protocols, risks',                phase: 1 },
  { id: 2,  code: 'P2',  label: 'Layer Decomposition',     description: 'Domain layer breakdown',                     phase: 1 },
  { id: 3,  code: 'P3',  label: 'Draft Architecture',      description: 'Initial architecture draft',                 phase: 1 },
  { id: 4,  code: 'P4',  label: 'Threat Analysis',         description: 'STRIDE threat modelling',                    phase: 1 },
  { id: 5,  code: 'P5',  label: 'Hostile Audit',           description: 'Attack the architecture',                    phase: 1 },
  { id: 6,  code: 'P6',  label: 'Immutable Blueprint',     description: 'V2 locked blueprint',                        phase: 1 },
  { id: 7,  code: 'P7',  label: 'Chaos Scenarios',         description: '5 dynamic failure scenarios',                phase: 1 },
  { id: 8,  code: 'P8',  label: 'Alternative Route',       description: 'Counter-architecture proposal',              phase: 1 },
  { id: 9,  code: 'P9',  label: 'Simplicity Defender',     description: 'Argue against own blueprint',                phase: 1 },
  { id: 10, code: 'P10', label: 'ADR',                     description: 'Architecture decision record',               phase: 1 },
  { id: 11, code: 'P11', label: 'Scaling Forecast',        description: '10x / 100x / 1000x projections',            phase: 1 },
  { id: 12, code: 'P12', label: 'Mandate Compliance',      description: 'All 9 mandates verified',                    phase: 1 },
  { id: 13, code: 'P13', label: 'Directory Tree',          description: 'ASCII structure + annotations',              phase: 1 },
  { id: 14, code: 'P14', label: 'CLEARANCE GATE',          description: 'Await APPROVE / AMEND / CHALLENGE',         phase: 1 },
  { id: 15, code: 'P15', label: 'Code Generation',         description: 'Layer-by-layer implementation',             phase: 2 },
  { id: 16, code: 'P16', label: 'Retrospective',           description: 'Architecture review',                        phase: 2 },
  { id: 17, code: 'P17', label: 'Protocol Memory Update',  description: 'Lessons promoted to memory',                phase: 2 },
]

export const TIER_PROCESSES: Record<1 | 2 | 3, number[]> = {
  1: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17],
  2: [0,1,2,5,6,9,11,12,13,14,15,16],
  3: [0,1,5,12,13],
      }
