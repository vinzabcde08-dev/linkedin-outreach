import { useState } from 'react'
import { getProfile } from '../lib/storage'
import { callClaude } from '../lib/api'

export default function ReplyHandler() {
  const [replyText, setReplyText] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  async function handleAnalyze() {
    if (!replyText.trim()) {
      setError('Paste their reply message first.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')

    try {
      const profile = getProfile()
      const text = await callClaude('handleReply', { replyText, context }, profile)
      setResult(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copySection(label, pattern) {
    const match = result.match(pattern)
    if (match) {
      navigator.clipboard.writeText(match[0].replace(/##.*\n/, '').trim())
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    }
  }

  function copyRecommended() {
    const match = result.match(/##\s*💬\s*RECOMMENDED RESPONSE[\s\S]*?(?=##|$)/i)
    if (match) {
      navigator.clipboard.writeText(match[0].replace(/##.*\n/, '').trim())
      setCopied('recommended')
      setTimeout(() => setCopied(''), 2000)
    }
  }

  function copyAlternative() {
    const match = result.match(/##\s*🔄\s*ALTERNATIVE RESPONSE[\s\S]*?(?=##|$)/i)
    if (match) {
      navigator.clipboard.writeText(match[0].replace(/##.*\n/, '').trim())
      setCopied('alternative')
      setTimeout(() => setCopied(''), 2000)
    }
  }

  // Parse sections for cleaner display
  function getSection(pattern) {
    const match = result.match(pattern)
    if (!match) return null
    return match[0].trim()
  }

  const analysisSections = result ? [
    { label: '📥 What They Said', pattern: /##\s*📥\s*WHAT THEY SAID[\s\S]*?(?=##|$)/i },
    { label: '📊 Reply Analysis',  pattern: /##\s*📊\s*REPLY ANALYSIS[\s\S]*?(?=##|$)/i },
  ] : []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Reply Handler</h2>
        <p className="section-subtitle">
          Paste their reply. Get a full analysis of what they said and the best response to move toward a discovery call.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Context (what you sent) */}
        <div className="card">
          <label className="label">What You Sent (optional but helps)</label>
          <p className="text-xs text-gray-400 mb-2">Paste your original outreach message for better context.</p>
          <textarea
            className="textarea-field"
            rows={6}
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Hi [Name], I noticed you're leading ops at [Company]... (paste what you sent them)"
          />
        </div>

        {/* Their reply */}
        <div className="card">
          <label className="label">Their Reply *</label>
          <p className="text-xs text-gray-400 mb-2">Copy and paste exactly what they said.</p>
          <textarea
            className="textarea-field"
            rows={6}
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Hi! Thanks for reaching out. I'm actually interested in what you do but we already have someone handling our social media. Maybe in a few months..."
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="flex justify-end mb-6">
        <button
          onClick={handleAnalyze}
          disabled={loading || !replyText.trim()}
          className="btn-primary min-w-[160px]"
        >
          {loading ? (
            <><span className="spinner border-white border-t-transparent" /> Analyzing...</>
          ) : (
            '💬 Analyze Reply'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 fade-in">
          {/* Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analysisSections.map(({ label, pattern }) => {
              const section = getSection(pattern)
              if (!section) return null
              return (
                <div key={label} className="card">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">{label}</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {section.replace(/##.*\n/, '')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Recommended response */}
          <div className="card border-2 border-brand-blue/20 bg-brand-blue-light/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-brand-blue text-sm">💬 Recommended Response</h3>
              <button onClick={copyRecommended} className="copy-btn">
                {copied === 'recommended' ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="result-box bg-white text-sm leading-relaxed">
              {(() => {
                const match = result.match(/##\s*💬\s*RECOMMENDED RESPONSE[\s\S]*?(?=##|$)/i)
                return match ? match[0].replace(/##.*\n/, '').trim() : 'Not found'
              })()}
            </div>
          </div>

          {/* Alternative response */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm">🔄 Alternative Response (softer version)</h3>
              <button onClick={copyAlternative} className="copy-btn">
                {copied === 'alternative' ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="result-box text-sm leading-relaxed">
              {(() => {
                const match = result.match(/##\s*🔄\s*ALTERNATIVE RESPONSE[\s\S]*?(?=##|$)/i)
                return match ? match[0].replace(/##.*\n/, '').trim() : 'Not found'
              })()}
            </div>
          </div>

          {/* Next step */}
          <div className="card bg-brand-gold-light border-yellow-200">
            <h3 className="font-semibold text-yellow-800 text-sm mb-2">⚡ Next Step</h3>
            <div className="text-sm text-yellow-800 leading-relaxed">
              {(() => {
                const match = result.match(/##\s*⚡\s*NEXT STEP[\s\S]*/i)
                return match ? match[0].replace(/##.*\n/, '').trim() : ''
              })()}
            </div>
          </div>

          {/* Full result */}
          <details>
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View full analysis</summary>
            <div className="mt-3 card">
              <div className="result-box text-xs whitespace-pre-wrap leading-relaxed">{result}</div>
            </div>
          </details>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="card border-dashed bg-brand-blue-light/30 border-brand-blue/20">
          <h3 className="font-semibold text-brand-blue text-sm mb-3">💡 What you'll get</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>→ <strong>📥 Summary</strong> — plain-English breakdown of what they actually said</li>
            <li>→ <strong>📊 Analysis</strong> — sentiment, intent signals, objections, opportunity level</li>
            <li>→ <strong>💬 Recommended Response</strong> — ready to send, moves toward a discovery call</li>
            <li>→ <strong>🔄 Alternative Response</strong> — softer version if they seem hesitant</li>
            <li>→ <strong>⚡ Next Step</strong> — what to do after you send it</li>
          </ul>
        </div>
      )}
    </div>
  )
}
