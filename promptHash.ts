// filepath: src/utils/promptHash.ts

/**
 * Produces a short hash of a prompt string for session provenance.
 * Uses SubtleCrypto SHA-256 when available. Falls back to djb2.
 *
 * Zero React imports. Pure utility. (MANDATE 5)
 */
export async function hashPrompt(prompt: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoded = new TextEncoder().encode(prompt)
      const buffer  = await crypto.subtle.digest('SHA-256', encoded)
      const hex     = Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      return hex.slice(0, 12)
    } catch {
      // Fall through to djb2
    }
  }
  return djb2(prompt).toString(16)
}

function djb2(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ (str.charCodeAt(i) ?? 0)
    hash = hash >>> 0 // keep as unsigned 32-bit
  }
  return hash
}
