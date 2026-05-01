import { useState, useEffect } from 'react'
import { getProfile, getLastBrief, getProspects, addProspect, saveOutreachSequence } from '../lib/storage'

const SECTIONS = [
  { key: 'connection', label: 'Connection Request', icon: '🤝', tip: 'Under 300 characters' },
  { key: 'firstDm',    label: 'First DM',           icon: '💬', tip: 'Send within 24h of accept' },
  { key: 'followUp1',  label: 'Follow-Up 1',        icon: '🔁', tip: 'Day 3 — no reply' },
  { key: 'followUp2',  label: 'Follow-Up 2',        icon: '🔁', tip: 'Day 7 — no reply' },
  { key: 'followUp3',  label: 'Follow-Up 3',        icon: '🔁', tip: 'Day 14 — final touch' },
]

export default function OutreachGenerator({ prospect }) {
  const [brief, setBrief] = useState('')
  const [prospectName, setProspectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [activeSection, setActiveSection] = useState('connection')

  // Save to Tracker state
  const [existingProspects, setExistingProspects] = useState([])
  const [saveProspectId, setSaveProspectId] = useState('')
  const [saveNewName, setSaveNewName] = useState('')
  const [saveDone, setSaveDone] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // Load last brief on mount
  useEffect(() => {
    if (prospect?.brief) {
      setBrief(prospect.brief)
    } else {
      const last = getLastBrief()
      if (last?.text) setBrief(last.text)
    }
    setExistingProspects(getProspects())
  }, [prospect])

  // Reset save state when a new result is generated
  useEffect(() => {
    if (result) {
      setSaveDone(false)
      setSaveProspectId('')
      setSaveNewName(prospectName || '')
      setExistingProspects(getProspects())
    }
  }, [result])

  async function handleGenerate() {
    if (!brief.trim()) {
      setError('You need a prospect brief first. Run the Prospect Analyzer or paste a brief manually.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')

    try {
      const profile = getProfile()
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'generateOutreach',
          data: { brief, prospectName: prospectName || 'the prospect' },
          profile,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data.result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function extractSection(text, sectionKey) {
    // Use [^\w\n]* to match any emoji (or none) before the section number
    const patterns = {
      connection: /##[^\w\n]*1\.\s*CONNECTION REQUEST[\s\S]*?(?=##[^\w\n]*2\.|$)/i,
      firstDm:    /##[^\w\n]*2\.\s*FIRST DM[\s\S]*?(?=##[^\w\n]*3\.|$)/i,
      followUp1:  /##[^\w\n]*3\.\s*FOLLOW-UP 1[\s\S]*?(?=##[^\w\n]*4\.|$)/i,
      followUp2:  /##[^\w\n]*4\.\s*FOLLOW-UP 2[\s\S]*?(?=##[^\w\n]*5\.|$)/i,
      followUp3:  /##[^\w\n]*5\.\s*FOLLOW-UP 3[\s\S]*?(?=##[^\w\n]*(?:USAGE|6\.)|$)/i,
    }
    const match = text.match(patterns[sectionKey])
    return match ? match[0].trim() : null
  }

  function extractCleanMessage(text, sectionKey) {
    const section = extractSection(text, sectionKey)
    if (!section) return ''
    const lines = section.split('\n').filter(line =>
      !line.startsWith('##') &&
      !line.startsWith('**Character count') &&
      !line.startsWith('**Timing') &&
      line.trim()
    )
    return lines.join('\n').trim()
  }

  function parseResultToSequence(text) {
    const steps = ['connection', 'firstDm', 'followUp1', 'followUp2', 'followUp3']
    const sequence = {}
    steps.forEach(key => {
      const message = extractCleanMessage(text, key)
      if (message) {
        sequence[key] = { text: message, status: 'pending', sentAt: null }
      }
    })
    return sequence
  }

  async function handleSaveToTracker() {
    setSaveLoading(true)
    try {
      const sequence = parseResultToSequence(result)
      let targetId = saveProspectId

      if (!targetId) {
        // Create a new prospect
        const name = saveNewName.trim() || prospectName.trim() || 'Unknown Prospect'
        const newProspect = addProspect({ name, status: 'identified' })
        targetId = newProspect.id
      }

      saveOutreachSequence(targetId, sequence)
      setSaveDone(true)
      setExistingProspects(getProspects())
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaveLoading(false)
    }
  }

  function copySection(key, text) {
    const section = extractSection(result, key)
    if (section) {
      const lines = section.split('\n')
      const messageLines = lines.filter(line =>
        !line.startsWith('##') &&
        !line.startsWith('**Character count') &&
        line.trim()
      )
      const message = messageLines.join('\n').trim()
      navigator.clipboard.writeText(message)
    } else {
      navigator.clipboard.writeText(text)
    }
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  function copyAll() {
    navigator.clipboard.writeText(result)
    setCopied('all')
    setTimeout(() => setCopied(''), 2000)
  }

  const currentSection = SECTIONS.find(s => s.key === activeSection)

  // Compute how many steps were parsed (for save panel)
  const parsedCount = result ? Object.keys(parseResultToSequence(result)).length : 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Outreach Generator</h2>
        <p className="section-subtitle">
          Generate a full 5-message LinkedIn sequence — connection request + DM + 3 follow-ups — all in your voice.
        </p>
      </div>

      {/* Brief input */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="label mb-0">Prospect Brief</label>
          {brief && (
            <span className="text-xs text-green-600 font-medium">✓ Brief loaded</span>
          )}
        </div>
        <textarea
          className="textarea-field"
          rows={6}
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="Paste the prospect brief from the Analyzer here, or run the Prospect Analyzer first and it'll load automatically..."
        />
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div>
            <label className="label mb-1">Prospect Name (optional)</label>
            <input
              className="input-field w-52"
              value={prospectName}
              onChange={e => setProspectName(e.target.value)}
              placeholder="e.g. John Smith"
            />
          </div>
          <div className="flex-1" />
          {error && <p className="text-red-500 text-sm flex-1">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={loading || !brief.trim()}
            className="btn-primary min-w-[180px] mt-5"
          >
            {loading ? (
              <><span className="spinner border-white border-t-transparent" /> Generating...</>
            ) : (
              '✉️ Generate Sequence'
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">📬 Your Outreach Sequence</h3>
            <button onClick={copyAll} className="copy-btn">
              {copied === 'all' ? '✓ Copied all' : '📋 Copy all'}
            </button>
          </div>

          {/* Section tabs */}
          <div className="flex gap-2 flex-wrap mb-5 pb-4 border-b border-gray-100">
            {SECTIONS.map(s => {
              const hasContent = !!extractSection(result, s.key)
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeSection === s.key
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.icon} {s.label}
                  <span className={`text-xs ${activeSection === s.key ? 'text-white/60' : 'text-gray-400'}`}>
                    · {s.tip}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Current section content */}
          {(() => {
            const sectionText = extractSection(result, activeSection)
            if (!sectionText) {
              return (
                <div className="result-box">
                  <div className="text-gray-400 text-sm">Loading section...</div>
                </div>
              )
            }
            return (
              <div>
                <div className="result-box text-sm whitespace-pre-wrap leading-relaxed mb-3">
                  {sectionText}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => copySection(activeSection, sectionText)}
                    className="copy-btn"
                  >
                    {copied === activeSection ? '✓ Copied!' : `📋 Copy ${currentSection?.label}`}
                  </button>
                </div>
              </div>
            )
          })()}

          {/* Usage notes */}
          {result.includes('USAGE NOTES') && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="bg-brand-gold-light border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-800 text-sm mb-2">📌 Usage Notes</h4>
                <div className="text-sm text-yellow-800 whitespace-pre-wrap leading-relaxed">
                  {(() => {
                    const match = result.match(/##\s*📌\s*USAGE NOTES[\s\S]*/i)
                    return match ? match[0].replace(/##\s*📌\s*USAGE NOTES\s*/i, '') : ''
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Full result toggle */}
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">View full sequence</summary>
            <div className="mt-3 result-box text-xs whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          </details>
        </div>
      )}

      {/* Save to Tracker panel */}
      {result && (
        <div className="card mt-4 border-2 border-blue-200 bg-blue-50/40 fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">💾 Save to Application Tracker</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Save all {parsedCount} messages as a checklist under a prospect's record.
              </p>
            </div>
            {saveDone && (
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">✓ Saved!</span>
            )}
          </div>

          {saveDone ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-green-700">Messages saved to Application Tracker. You can mark them as sent when you send each one.</p>
              <button
                onClick={() => setSaveDone(false)}
                className="btn-secondary text-xs flex-shrink-0"
              >
                Save to another
              </button>
            </div>
          ) : (
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-48">
                <label className="label">Save under prospect</label>
                <select
                  className="input-field"
                  value={saveProspectId}
                  onChange={e => setSaveProspectId(e.target.value)}
                >
                  <option value="">— Create new prospect —</option>
                  {existingProspects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.company ? ` · ${p.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!saveProspectId && (
                <div className="flex-1 min-w-48">
                  <label className="label">New prospect name</label>
                  <input
                    className="input-field"
                    value={saveNewName}
                    onChange={e => setSaveNewName(e.target.value)}
                    placeholder={prospectName || 'e.g. John Smith'}
                  />
                </div>
              )}

              <button
                onClick={handleSaveToTracker}
                disabled={saveLoading || (!saveProspectId && !saveNewName.trim() && !prospectName.trim())}
                className="btn-primary flex-shrink-0"
              >
                {saveLoading ? (
                  <><span className="spinner border-white border-t-transparent" /> Saving...</>
                ) : (
                  '💾 Save to Tracker'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="card border-dashed bg-brand-blue-light/30 border-brand-blue/20">
          <h3 className="font-semibold text-brand-blue text-sm mb-3">✉️ What you'll get</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {SECTIONS.map(s => (
              <li key={s.key}>→ <strong>{s.icon} {s.label}</strong> — {s.tip}</li>
            ))}
            <li>→ <strong>📌 Usage Notes</strong> — timing tips and personalization reminders</li>
          </ul>
          <p className="mt-3 text-xs text-gray-400">All messages are written in your voice — warm, direct, and personal. Not a template.</p>
          <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-blue-600">
            💡 After generating, save the sequence to the Application Tracker to track which messages you've sent.
          </div>
        </div>
      )}
    </div>
  )
}
