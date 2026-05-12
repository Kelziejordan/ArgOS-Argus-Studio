// filepath: src/schemas/streamChunkSchema.ts

import { z } from 'zod'

export const streamChunkSchema = z.object({
  type:    z.enum(['data', 'error', 'end']),
  payload: z.string(),
})

export type StreamChunk = z.infer<typeof streamChunkSchema>
