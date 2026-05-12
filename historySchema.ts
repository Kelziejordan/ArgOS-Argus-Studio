// filepath: src/schemas/historySchema.ts

import { z } from 'zod'
import { opportunityRecordSchema } from './opportunitySchema'

export const HISTORY_STORAGE_KEY = 'argus:v10:opportunity-history'
export const HISTORY_VERSION      = 1

export const historyStorageSchema = z.object({
  version:     z.literal(HISTORY_VERSION),
  records:     z.array(opportunityRecordSchema),
  lastUpdated: z.string().datetime(),
})

export type HistoryStorage = z.infer<typeof historyStorageSchema>
