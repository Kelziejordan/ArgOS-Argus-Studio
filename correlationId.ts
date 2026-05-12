// filepath: src/utils/correlationId.ts

/**
 * Generates a unique correlation ID for request tracing.
 * Uses crypto.randomUUID() when available (all modern browsers + Node 19+).
 * Falls back to a timestamp + random string for older environments.
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
export function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  const timestamp = Date.now().toString(36)
  const random    = Math.random().toString(36).slice(2, 10)
  return `${timestamp}-${random}`
}
