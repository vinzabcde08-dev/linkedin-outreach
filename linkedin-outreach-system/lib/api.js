// ─────────────────────────────────────────────────────────────────────────────
// Centralized Claude API helper
// All components use callClaude() so token usage is automatically tracked.
// ─────────────────────────────────────────────────────────────────────────────
import { recordApiUsage } from './storage'

/**
 * Call the Claude API via /api/claude and auto-record token usage.
 * @param {string} feature  — matches a case in api/claude.js (e.g. 'generateOutreach')
 * @param {object} data     — payload for that feature
 * @param {object} profile  — user profile (usually from getProfile())
 * @returns {Promise<string>} — result string
 */
export async function callClaude(feature, data, profile) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature, data, profile }),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`)
  }

  // Auto-record usage whenever the API returns it
  if (json.usage) {
    recordApiUsage(
      json.usage.input_tokens  || 0,
      json.usage.output_tokens || 0,
      feature
    )
  }

  return json.result
}
