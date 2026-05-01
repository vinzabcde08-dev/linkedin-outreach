import { useState, useEffect } from 'react'
import { getProfile, saveLastBrief, addProspect } from '../lib/storage'

export default function ProspectAnalyzer({ onProspectAnalyzed }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [savedToTracker, setSavedToTracker] = useState(false)
  const [prospectName, setProspectName] = useState('')

  async function handleAnalyze() {
    if (!input.trim()) {
      setError('Paste a LinkedIn profile URL or profile text to analyze.')
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
        body: JSON.stringify({ feature: 'analyzeProspect', data: { prospectInput: input }, profile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data.result)
      saveLastBrief({ text: data.result, input, analyzedAt: new Date().toISOString() })
      if (onProspectAnalyzed) onProspectAnalyzed({ brief: data.result, input })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSendToOutreach() {
    saveLastBrief({ text: result, input, analyzedAt: new Date().toISOString() })
    if (onProspectAnalyzed) onProspectAnalyzed({ brief: result, input })
    alert('Brief saved! Switch to the Outreach Generator tab to write messages.')
  }

  function handleSaveToTracker() {
    if (!result) return
    const name = prospectName.trim() || 'Unknown Prospect'
    addProspect({
      name,
      profileInput: input,
      brief: result,
      status: 'identified',
      notes: `Analyzed ${new Date().toLocaleDateString()}`,
    })
    setSavedToTracker(true)
    setTimeout(() => setSavedToTracker(false), 3000)
  }

  // Extract name suggestion from result
  useEffect(() => {
    if (result) {
      const nameMatch = result.match(/\*\*Name:\*\*\s*(.+)/i)
      if (nameMatch) setProspectName(nameMatch[1].trim())
    }
  }, [result])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Prospect Analyzer</h2>
        <p className="section-subtitle">
          Paste a LinkedIn URL or raw profile text. Claude will research the person and their company, identify pain points, and give you a full outreach brief.
        </p>
      </div>

      {/* Input card */}
      <div className="card mb-6">
        <label className="label">LinkedIn Profile URL or Paste Profile Text</label>
        <textarea
          className="textarea-field"
          rows={8}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Option 1 — Paste the LinkedIn URL:
https://linkedin.com/in/john-smith-ceo

Option 2 — Paste profile text directly:
John Smith
CEO at Acme Corp | 10+ years in real estate | Building the future of property tech
San Francisco, CA | 3,847 followers

About: We help real estate investors automate their operations...

Experience:
CEO — Acme Corp (2019–present)
Built from $0 to $2M ARR with a team of 8...`}
        />

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            💡 More detail = better brief. Paste the full About section, experience, and any posts if you can.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={loading || !input.trim()}
            className="btn-primary min-w-[140px]"
          >
            {loading ? (
              <>
                <span className="spinner border-white border-t-transparent" />
                Analyzing...
              </>
            ) : (
              '🔍 Analyze Prospect'
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">📋 Prospect Brief</h3>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="copy-btn">
                {copied ? '✓ Copied' : '📋 Copy Brief'}
              </button>
            </div>
          </div>

          {/* Brief output */}
          <div className="result-box text-sm whitespace-pre-wrap leading-relaxed">
            {result}
          </div>

          {/* Action bar */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                className="input-field text-sm"
                value={prospectName}
                onChange={e => setProspectName(e.target.value)}
                placeholder="Prospect name for tracker..."
              />
              <button
                onClick={handleSaveToTracker}
                disabled={savedToTracker}
                className="btn-secondary whitespace-nowrap"
              >
                {savedToTracker ? '✓ Saved!' : '📊 Save to Tracker'}
              </button>
            </div>
            <button onClick={handleSendToOutreach} className="btn-primary whitespace-nowrap">
              ✉️ Generate Outreach →
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!result && !loading && (
        <div className="card border-dashed bg-brand-blue-light/30 border-brand-blue/20">
          <h3 className="font-semibold text-brand-blue text-sm mb-3">💡 How to get the best briefs</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>→ <strong>Include their About section</strong> — it reveals goals, personality, and context</li>
            <li>→ <strong>Add their recent posts</strong> — shows what they care about right now</li>
            <li>→ <strong>Include company details</strong> — size, industry, recent announcements</li>
            <li>→ <strong>Note their title and tenure</strong> — helps identify decision-making power</li>
            <li>→ The more you paste, the more specific and actionable the brief will be</li>
          </ul>
        </div>
      )}
    </div>
  )
}
