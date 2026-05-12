// filepath: src/schemas/pipelineStateSchema.ts

import { z } from 'zod'

export const pipelineStateSchema = z.object({
  sessionId:  z.string(),
  stage:      z.number().int().min(0).max(17),
  tokenCount: z.number().nonnegative(),
  tier:       z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable(),
})

export type PipelineState = z.infer<typeof pipelineStateSchema>
