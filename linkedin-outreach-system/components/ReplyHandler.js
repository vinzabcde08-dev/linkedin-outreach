import { useState, useEffect } from 'react'
import { getProfile, getProspects } from '../lib/storage'
import { callClaude } from '../lib/api'

export default function ReplyHandler() {
  const [replyText, setReplyText]       = useState('')
  const [context, setContext]           = useState('')
  const [loading, setLoading]           = useState(false)
  const [result, setResult]             = useState('')
  const [error, setError]               = useState('')
  const [copied, setCopied]             = useState('')

  // Prospect selector
  const [prospects, setProspects]       = useState([])
  const [selectedId, setSelectedId]     = useState('')
  const [selectedProspect, setSelectedProspect] = useState(null)

  useEffect(() => {
    const all = getProspects()
    // Only show active prospects (not closed)
    const active = all.filter(p => !['closed_won', 'closed_lost'].includes(p.status))
    setProspects(active)
  }, [])

  function handleSelectProspect(id) {
    setSelectedId(id)
    if (!id) {
      setSelectedProspect(null)
      return
    }
    const p = prospects.find(pr => pr.id === id)
    setSelectedProspect(p || null)

    // Auto-fill "What You Sent" with their last sent DM or follow-up
    if (p?.outreachSequence) {
      const seq = p.outreachSequence
      const steps = ['followUp3', 'followUp2', 'followUp1', 'firstDm', 'connection']
      const lastSent = steps.find(s => seq[s]?.status === 'sent' && seq[s]?.text)
      if (lastSent) {
        setContext(seq[lastSent].text)
      } else {
        // Grab any step with text even if not yet marked sent
        const anyText = steps.find(s => seq[s]?.text)
        if (anyText) setContext(seq[anyText].text)
      }
    }
  }

  async function handleAnalyze() {
    if (!replyText.trim()) {
      setError('Paste their reply message in the "Their Reply" field first.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')

    try {
      const profile = getProfile()
      const text = await callClaude(
        'handleReply',
        { replyText, context, prospect: selectedProspect || null },
        profile
      )
      setResult(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
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

  function getSection(pattern) {
    const match = result.match(pattern)
    if (!match) return null
    return match[0].trim()
  }

  const analysisSections = result ? [
    { label: '📥 What They Said', pattern: /##\s*📥\s*WHAT THEY SAID[\s\S]*?(?=##|$)/i },
    { label: '📊 Reply Analysis',  pattern: /##\s*📊\s*REPLY ANALYSIS[\s\S]*?(?=##|$)/i },
  ] : []

  const statusColors = {
    identified:     'bg-gray-100 text-gray-600',
    researched:     'bg-blue-100 text-blue-700',
    outreach_sent:  'bg-orange-100 text-orange-700',
    connected:      'bg-green-100 text-green-700',
    replied:        'bg-purple-100 text-purple-700',
    meeting_booked: 'bg-yellow-100 text-yellow-700',
    proposal_sent:  'bg-indigo-100 text-indigo-700',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Reply Handler</h2>
        <p className="section-subtitle">
          Paste their reply. Get a full analysis and the best response to move toward a discovery call.
        </p>
      </div>

      {/* ── Step 1: Select prospect ── */}
      <div className="card mb-5 border-orange-100 bg-orange-50/40">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
          <label className="font-semibold text-gray-800 text-sm">Who replied to you?</label>
          <span className="text-xs text-gray-400 ml-1">(optional — but gives Claude better context)</span>
        </div>

        {prospects.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No active prospects yet. Add them in Prospect Hub first, or skip and type context manually below.</p>
        ) : (
          <select
            value={selectedId}
            onChange={e => handleSelectProspect(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            <option value="">— Select a prospect (or skip) —</option>
            {prospects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name || p.firstName || 'Unnamed'}{p.company ? ` — ${p.company}` : ''}{p.title ? ` · ${p.title}` : ''}
              </option>
            ))}
          </select>
        )}

        {/* Prospect summary card */}
        {selectedProspect && (
          <div className="mt-3 p-3 bg-white rounded-xl border border-orange-200 flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(selectedProspect.name || selectedProspect.firstName || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{selectedProspect.name || selectedProspect.firstName}</span>
                {selectedProspect.status && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${statusColors[selectedProspect.status] || 'bg-gray-100 text-gray-500'}`}>
                    {selectedProspect.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              {selectedProspect.title && <div className="text-xs text-gray-500 mt-0.5">{selectedProspect.title}</div>}
              {selectedProspect.company && <div className="text-xs text-orange-600 font-medium">{selectedProspect.company}</div>}
              {context && (
                <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                  ✅ Auto-filled "What You Sent" with their last outreach message
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Step 2: Messages ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
        <span className="font-semibold text-gray-800 text-sm">Paste the conversation</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Context (what you sent) */}
        <div className="card">
          <label className="label">What You Sent <span className="text-gray-400 font-normal text-xs">(optional — auto-filled if prospect selected)</span></label>
          <p className="text-xs text-gray-400 mb-2">Your original outreach message for better context.</p>
          <textarea
            className="textarea-field"
            rows={7}
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Hi [Name], I noticed you're leading ops at [Company]... (paste what you sent them)"
          />
        </div>

        {/* Their reply — REQUIRED */}
        <div className="card border-2 border-orange-200">
          <label className="label flex items-center gap-1.5">
            Their Reply
            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Required</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">Copy and paste exactly what they said.</p>
          <textarea
            className={`textarea-field ${!replyText.trim() ? 'border-orange-300 focus:ring-orange-400' : 'border-gray-200'}`}
            rows={7}
            value={replyText}
            onChange={e => { setReplyText(e.target.value); if (error) setError('') }}
            placeholder={"Hi! Thanks for reaching out. I'm actually interested in what you do but we already have someone handling our social media. Maybe in a few months..."}
          />
          {!replyText.trim() && (
            <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
              <span>⬆️</span> Paste their reply here to unlock the Analyze button
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="text-xs text-gray-400">
          {selectedProspect
            ? `🎯 Analyzing reply from ${selectedProspect.name || selectedProspect.firstName} at ${selectedProspect.company || 'their company'}`
            : 'No prospect selected — Claude will use generic context'}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !replyText.trim()}
          className={`btn-primary min-w-[180px] ${!replyText.trim() && !loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <><span className="spinner border-white border-t-transparent" /> Analyzing…</>
          ) : (
            '💬 Analyze Reply'
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 fade-in">
          {/* Analysis grid */}
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
          <div className="card border-2 border-orange-200 bg-orange-50/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-orange-700 text-sm">💬 Recommended Response</h3>
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
          <div className="card bg-yellow-50 border-yellow-200">
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
        <div className="card border-dashed border-orange-200 bg-orange-50/20">
          <h3 className="font-semibold text-orange-600 text-sm mb-3">💡 What you'll get</h3>
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
