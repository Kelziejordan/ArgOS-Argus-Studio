// filepath: src/utils/historySerializer.ts

/**
 * Safe LocalStorage read/write for opportunity history.
 * All reads are schema-validated via Zod (MANDATE 8).
 * All errors return discriminated results — never throws.
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
import {
  historyStorageSchema,
  HISTORY_STORAGE_KEY,
  HISTORY_VERSION,
  type HistoryStorage,
} from '@/schemas/historySchema'
import type { OpportunityRecord } from '@/types'

export type ReadResult =
  | { status: 'success'; data: HistoryStorage }
  | { status: 'empty' }
  | { status: 'error';   message: string }

export type WriteResult =
  | { status: 'success' }
  | { status: 'quota';   message: string }
  | { status: 'error';   message: string }

export function readHistory(): ReadResult {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    if (!raw) return { status: 'empty' }

    const parsed   = JSON.parse(raw)
    const validated = historyStorageSchema.safeParse(parsed)

    if (!validated.success) {
      return {
        status:  'error',
        message: 'History schema validation failed. Data may be from an older version.',
      }
    }
    return { status: 'success', data: validated.data }
  } catch (e) {
    return {
      status:  'error',
      message: e instanceof Error ? e.message : 'Failed to read history',
    }
  }
}

export function writeHistory(records: OpportunityRecord[]): WriteResult {
  try {
    const storage: HistoryStorage = {
      version:     HISTORY_VERSION,
      records,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(storage))
    return { status: 'success' }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return {
        status:  'quota',
        message: 'Storage full. Delete some records to continue saving opportunities.',
      }
    }
    return {
      status:  'error',
      message: e instanceof Error ? e.message : 'Failed to write history',
    }
  }
}

export function createEmptyStorage(): HistoryStorage {
  return {
    version:     HISTORY_VERSION,
    records:     [],
    lastUpdated: new Date().toISOString(),
  }
}
