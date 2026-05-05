import { useState, useEffect } from 'react'
import { getProfile, getProspects, saveProspectDoc } from '../lib/storage'
import { callClaude } from '../lib/api'

export default function ClientBrief() {
  const [prospectId,   setProspectId]   = useState('')
  const [meetingType,  setMeetingType]  = useState('discovery')
  const [meetingNotes, setMeetingNotes] = useState('')
  const [prospects,    setProspects]    = useState([])
  const [loading,      setLoading]      = useState(false)
  const [result,       setResult]       = useState('')
  const [error,        setError]        = useState('')
  const [copied,       setCopied]       = useState('')
  const [saved,        setSaved]        = useState(false)

  useEffect(() => {
    setProspects(getProspects())
    try {
      const saved = localStorage.getItem('los_draft_clientbrief')
      if (saved) setResult(saved)
    } catch {}
  }, [])

  const selectedProspect = prospects.find(p => p.id === prospectId) || null

  async function handleGenerate() {
    if (!prospectId) {
      setError('Select a prospect first.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    setSaved(false)
    try {
      const profile = getProfile()
      const p = selectedProspect
      const data = {
        prospectName:    p?.name || 'Unknown',
        company:         p?.company || '',
        role:            p?.role || '',
        linkedinUrl:     p?.linkedinUrl || '',
        status:          p?.status || '',
        briefSummary:    p?.briefSummary || '',
        outreachSequence: p?.outreachSequence || {},
        conversationLog: p?.conversationLog || [],
        notes:           p?.notes || '',
        meetingType,
        meetingNotes,
      }
      const text = await callClaude('generateClientBrief', data, profile)
      setResult(text)
      try { localStorage.setItem('los_draft_clientbrief', text) } catch {}
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!prospectId || !result) return
    saveProspectDoc(prospectId, 'clientBrief', result)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  function extractSection(text, keyword) {
    const regex = new RegExp(`##[^\\w\\n]*${keyword}[\\s\\S]*?(?=\\n##[^\\w\\n]*[A-Z🧠📋💬🎯⚡🤝📌✅]|$)`, 'i')
    const m = text.match(regex)
    return m ? m[0].trim() : null
  }

  function sectionBody(text) {
    return text ? text.replace(/^##[^\n]*\n/, '').trim() : ''
  }

  const secSnapshot    = result ? extractSection(result, 'SNAPSHOT')          : null
  const secConvo       = result ? extractSection(result, 'CONVERSATION')       : null
  const secPain        = result ? extractSection(result, 'PAIN POINTS')        : null
  const secOpp         = result ? extractSection(result, 'OPPORTUNITY')        : null
  const secTalkingPts  = result ? extractSection(result, 'TALKING POINTS')     : null
  const secRed         = result ? extractSection(result, 'RED FLAGS')          : null
  const secNext        = result ? extractSection(result, 'NEXT STEPS')         : null

  const MEETING_TYPES = [
    { value: 'discovery',  label: '🔍 Discovery Call',      desc: 'First sales conversation' },
    { value: 'followup',   label: '🔁 Follow-Up Meeting',   desc: 'Continuing a conversation' },
    { value: 'proposal',   label: '💰 Proposal Presentation',desc: 'Presenting your offer' },
    { value: 'onboarding', label: '🚀 Onboarding Call',      desc: 'Kicking off the project' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Client Brief</h2>
        <p className="section-subtitle">
          One-click intelligence summary for any meeting or call. Pulls everything you know about a prospect — their background, your conversation history, pain points, and talking points — so you walk in sharp.
        </p>
      </div>

      {/* ── Prospect selector ── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">🎯 Who's the Meeting With?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Prospect</label>
            <select className="input-field" value={prospectId} onChange={e => setProspectId(e.target.value)}>
              <option value="">— Choose from your tracker —</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.company ? ` · ${p.company}` : ''}{p.status ? ` [${p.status}]` : ''}
                </option>
              ))}
            </select>
            {prospects.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5">No prospects yet — add some in the Prospect Hub first.</p>
            )}
          </div>
          <div>
            <label className="label">Meeting Type</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {MEETING_TYPES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMeetingType(m.value)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    meetingType === m.value
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-semibold leading-tight">{m.label}</div>
                  <div className={`mt-0.5 ${meetingType === m.value ? 'text-blue-400' : 'text-gray-400'}`}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Prospect preview if selected ── */}
      {selectedProspect && (
        <div className="card mb-4 bg-gray-50 border border-gray-200">
          <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-3">Loaded from Prospect Record</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-400">Name</div>
              <div className="font-medium text-gray-800">{selectedProspect.name || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Company</div>
              <div className="font-medium text-gray-800">{selectedProspect.company || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Role</div>
              <div className="font-medium text-gray-800">{selectedProspect.role || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Status</div>
              <div className="font-medium text-gray-800 capitalize">{(selectedProspect.status || '—').replace('_', ' ')}</div>
            </div>
          </div>
          {selectedProspect.conversationLog?.length > 0 && (
            <div className="mt-3 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
              ✅ {selectedProspect.conversationLog.length} conversation entr{selectedProspect.conversationLog.length === 1 ? 'y' : 'ies'} found — will be included in brief
            </div>
          )}
          {selectedProspect.briefSummary && (
            <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
              ✅ Prospect brief / analyzer notes found — will be included
            </div>
          )}
          {selectedProspect.docs_pricingProposal && (
            <div className="mt-2 text-xs text-purple-700 bg-purple-50 rounded-lg px-3 py-2">
              ✅ Pricing proposal on file — will be referenced in talking points
            </div>
          )}
        </div>
      )}

      {/* ── Meeting notes ── */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">📌 Additional Meeting Notes</h3>
        <p className="text-xs text-gray-400 mb-3">Anything you want the brief to cover that isn't already in the prospect record.</p>
        <textarea
          className="textarea-field"
          rows={4}
          value={meetingNotes}
          onChange={e => setMeetingNotes(e.target.value)}
          placeholder={"They mentioned a $500 budget limit on their last email.\nWant to discuss the GoHighLevel setup.\nThey're comparing us to 2 other VAs..."}
        />

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div>{error && <p className="text-red-500 text-sm">{error}</p>}</div>
          <button
            onClick={handleGenerate}
            disabled={loading || !prospectId}
            className="btn-primary min-w-[200px]"
          >
            {loading
              ? <><span className="spinner border-white border-t-transparent" /> Generating Brief...</>
              : '🧠 Generate Client Brief'
            }
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4 fade-in">

          {/* Snapshot */}
          {secSnapshot && (
            <div className="card border-2 border-brand-blue/30 bg-blue-50/40">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-brand-blue text-sm">🧠 Client Snapshot</h3>
                  <p className="text-xs text-blue-400 mt-0.5">Who they are, what they need, where they're at</p>
                </div>
                <button onClick={() => copyText(sectionBody(secSnapshot), 'snap')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'snap' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{sectionBody(secSnapshot)}</div>
            </div>
          )}

          {/* Conversation History */}
          {secConvo && (
            <div className="card border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">💬 Conversation History</h3>
                <button onClick={() => copyText(sectionBody(secConvo), 'convo')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'convo' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sectionBody(secConvo)}</div>
            </div>
          )}

          {/* Pain Points */}
          {secPain && (
            <div className="card border border-orange-200 bg-orange-50/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-orange-800 text-sm">🎯 Pain Points & Needs</h3>
                <button onClick={() => copyText(sectionBody(secPain), 'pain')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'pain' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-orange-900 whitespace-pre-wrap leading-relaxed">{sectionBody(secPain)}</div>
            </div>
          )}

          {/* Opportunity */}
          {secOpp && (
            <div className="card border border-green-200 bg-green-50/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-green-800 text-sm">📈 Opportunity & Fit</h3>
                <button onClick={() => copyText(sectionBody(secOpp), 'opp')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'opp' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed">{sectionBody(secOpp)}</div>
            </div>
          )}

          {/* Talking Points */}
          {secTalkingPts && (
            <div className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">⚡ Talking Points</h3>
                  <p className="text-xs text-gray-400 mt-0.5">What to say, how to open, key things to hit</p>
                </div>
                <button onClick={() => copyText(sectionBody(secTalkingPts), 'tp')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'tp' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{sectionBody(secTalkingPts)}</div>
            </div>
          )}

          {/* Red Flags */}
          {secRed && (
            <div className="card border border-red-200 bg-red-50/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-red-700 text-sm">🚨 Watch-Outs & Red Flags</h3>
                <button onClick={() => copyText(sectionBody(secRed), 'red')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'red' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-red-800 whitespace-pre-wrap leading-relaxed">{sectionBody(secRed)}</div>
            </div>
          )}

          {/* Next Steps */}
          {secNext && (
            <div className="card border border-purple-200 bg-purple-50/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-purple-800 text-sm">📌 Next Steps After the Call</h3>
                <button onClick={() => copyText(sectionBody(secNext), 'next')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'next' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-purple-900 whitespace-pre-wrap leading-relaxed">{sectionBody(secNext)}</div>
            </div>
          )}

          {/* Copy All + Save */}
          <div className="card bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <button onClick={() => copyText(result, 'all')} className="btn-secondary flex-1">
                {copied === 'all' ? '✓ Copied full brief' : '📋 Copy Full Brief'}
              </button>
              {prospectId && (
                <button onClick={handleSave} className={`btn-primary flex-1 ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}>
                  {saved ? '✅ Saved to Prospect!' : '💾 Save to Prospect'}
                </button>
              )}
            </div>
          </div>

          {/* Raw toggle */}
          <details className="text-xs">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600">View raw output</summary>
            <div className="mt-2 p-4 bg-gray-50 rounded-xl text-xs whitespace-pre-wrap leading-relaxed text-gray-500">{result}</div>
          </details>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="card border-dashed bg-brand-blue-light/30 border-brand-blue/20">
          <h3 className="font-semibold text-brand-blue text-sm mb-3">🧠 What you'll get</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>→ <strong>🧠 Client Snapshot</strong> — who they are, what they do, what they need right now</li>
            <li>→ <strong>💬 Conversation History</strong> — summary of all past messages, key moments, and where you left off</li>
            <li>→ <strong>🎯 Pain Points</strong> — what they're struggling with and why they need you</li>
            <li>→ <strong>📈 Opportunity & Fit</strong> — why you're the right person for this job</li>
            <li>→ <strong>⚡ Talking Points</strong> — what to say to open, move forward, and close</li>
            <li>→ <strong>🚨 Watch-Outs</strong> — red flags, sensitivities, and things to handle carefully</li>
            <li>→ <strong>📌 Next Steps</strong> — clear actions to take after the call</li>
          </ul>
          <p className="mt-3 text-xs text-gray-400">Select a prospect from your tracker to pull all their data automatically.</p>
        </div>
      )}
    </div>
  )
}
