// filepath: src/schemas/opportunitySchema.ts

import { z } from 'zod'

export const opportunitySchema = z.object({
  title:               z.string().min(1),
  domain:              z.string().min(1),
  effort:              z.enum(['low', 'medium', 'high']),
  revenue_model:       z.string().min(1),
  description:         z.string().min(1),
  detected_at_process: z.number().int().min(0).max(17),
  confidence:          z.enum(['speculative', 'likely', 'strong']),
  source:              z.enum(['strict', 'recovered']).default('strict'),
  score:               z.number().default(0),
})

export const opportunityRecordSchema = opportunitySchema.extend({
  id:           z.string().uuid(),
  sessionId:    z.string(),
  sessionTitle: z.string(),
  detectedAt:   z.string().datetime(),
  promptHash:   z.string(),
})

export type ValidatedOpportunity = z.infer<typeof opportunitySchema>
