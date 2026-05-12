// filepath: src/hooks/useOpportunityHistory.ts

'use client'

/**
 * MANDATE 1: historyState uses RemoteData<OpportunityHistoryPage>.
 * MANDATE 8: All LocalStorage reads validated via Zod historyStorageSchema.
 * MANDATE 9: Write errors are non-blocking (writeError state, not thrown).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  readHistory,
  writeHistory,
} from '@/utils/historySerializer'
import type {
  RemoteData,
  OpportunityRecord,
  OpportunityHistoryPage,
  ErrorMetadata,
} from '@/types'
import { generateCorrelationId } from '@/utils/correlationId'

export interface UseOpportunityHistoryReturn {
  historyState: RemoteData<OpportunityHistoryPage>
  writeError:   string | null
  appendRecord: (record: OpportunityRecord) => void
  deleteRecord: (id: string) => void
  clearAll:     () => void
  loadMore:     () => void
  refresh:      () => void
}

export function useOpportunityHistory(
  pageSize: number = 20
): UseOpportunityHistoryReturn {
  const [historyState, setHistoryState] = useState<RemoteData<OpportunityHistoryPage>>({
    status: 'idle',
  })
  const [writeError, setWriteError] = useState<string | null>(null)
  const [page,       setPage]       = useState(1)

  // All records in memory — slice for paging
  const allRecordsRef = useRef<OpportunityRecord[]>([])

  // ── Load from LocalStorage ───────────────────
  const loadPage = useCallback((targetPage: number) => {
    setHistoryState({ status: 'loading' })

    try {
      const readResult = readHistory()

      if (readResult.status === 'error') {
        const metadata: ErrorMetadata = {
          action:        'history_load',
          timestamp:     new Date().toISOString(),
          correlationId: generateCorrelationId(),
        }
        setHistoryState({
          status:   'error',
          message:  readResult.message,
          metadata,
        })
        return
      }

      const records = readResult.status === 'empty'
        ? []
        : [...readResult.data.records].reverse() // newest first

      allRecordsRef.current = records

      const sliced = records.slice(0, targetPage * pageSize)
      setHistoryState({
        status: 'success',
        data: {
          records:    sliced,
          totalCount: records.length,
          hasMore:    sliced.length < records.length,
          page:       targetPage,
        },
      })
    } catch (e) {
      const metadata: ErrorMetadata = {
        action:        'history_load',
        timestamp:     new Date().toISOString(),
        correlationId: generateCorrelationId(),
      }
      setHistoryState({
        status:   'error',
        message:  e instanceof Error ? e.message : 'Failed to load history',
        metadata,
      })
    }
  }, [pageSize])

  useEffect(() => {
    loadPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Append ─────────────────────────────────────
  const appendRecord = useCallback((record: OpportunityRecord) => {
    const updated = [record, ...allRecordsRef.current]
    allRecordsRef.current = updated

    const result = writeHistory(updated)
    if (result.status !== 'success') {
      setWriteError(result.message)
      setTimeout(() => setWriteError(null), 6000)
    }

    setHistoryState((prev) => {
      if (prev.status !== 'success') return prev
      const sliced = updated.slice(0, prev.data.page * pageSize)
      return {
        status: 'success',
        data: {
          records:    sliced,
          totalCount: updated.length,
          hasMore:    sliced.length < updated.length,
          page:       prev.data.page,
        },
      }
    })
  }, [pageSize])

  // ── Delete ─────────────────────────────────────
  const deleteRecord = useCallback((id: string) => {
    const updated = allRecordsRef.current.filter((r) => r.id !== id)
    allRecordsRef.current = updated
    writeHistory(updated)

    setHistoryState((prev) => {
      if (prev.status !== 'success') return prev
      const sliced = updated.slice(0, prev.data.page * pageSize)
      return {
        status: 'success',
        data: {
          records:    sliced,
          totalCount: updated.length,
          hasMore:    sliced.length < updated.length,
          page:       prev.data.page,
        },
      }
    })
  }, [pageSize])

  // ── Clear all ──────────────────────────────────
  const clearAll = useCallback(() => {
    allRecordsRef.current = []
    writeHistory([])
    setPage(1)
    setHistoryState({
      status: 'success',
      data: { records: [], totalCount: 0, hasMore: false, page: 1 },
    })
  }, [])

  // ── Load more ──────────────────────────────────
  const loadMore = useCallback(() => {
    const nextPage = page + 1
    setPage(nextPage)
    const sliced = allRecordsRef.current.slice(0, nextPage * pageSize)
    setHistoryState((prev) => {
      if (prev.status !== 'success') return prev
      return {
        status: 'success',
        data: {
          records:    sliced,
          totalCount: allRecordsRef.current.length,
          hasMore:    sliced.length < allRecordsRef.current.length,
          page:       nextPage,
        },
      }
    })
  }, [page, pageSize])

  // ── Refresh ────────────────────────────────────
  const refresh = useCallback(() => {
    setPage(1)
    loadPage(1)
  }, [loadPage])

  return {
    historyState,
    writeError,
    appendRecord,
    deleteRecord,
    clearAll,
    loadMore,
    refresh,
  }
}
