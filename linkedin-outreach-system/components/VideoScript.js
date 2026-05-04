import { useState, useEffect } from 'react'
import { getProfile, getProspects, saveProspectDoc } from '../lib/storage'
import { callClaude } from '../lib/api'

const VIDEO_TYPES = [
  { value: 'loom_intro',  label: '🎬 Loom Introduction',      desc: 'Introduce yourself & why you\'re the fit' },
  { value: 'qa_video',    label: '❓ Q&A / Answer Questions',  desc: 'Answer specific questions from the post' },
  { value: 'portfolio',   label: '📁 Portfolio Walkthrough',   desc: 'Walk through your work & results' },
  { value: 'custom',      label: '✏️ Custom',                  desc: 'Define your own video format' },
]

const VIDEO_LENGTHS = [
  { value: '90s',   label: 'Under 90 seconds',  words: '~150 words' },
  { value: '2min',  label: '1–2 minutes',        words: '~200–300 words' },
  { value: '3min',  label: '2–3 minutes',        words: '~300–450 words' },
  { value: '5min',  label: '3–5 minutes',        words: '~450–750 words' },
]

export default function VideoScript() {
  const [prospectId,          setProspectId]          = useState('')
  const [prospectName,        setProspectName]        = useState('')
  const [company,             setCompany]             = useState('')
  const [videoType,           setVideoType]           = useState('loom_intro')
  const [videoLength,         setVideoLength]         = useState('2min')
  const [jobDescription,      setJobDescription]      = useState('')
  const [questions,           setQuestions]           = useState('')
  const [customInstructions,  setCustomInstructions]  = useState('')
  const [prospects,           setProspects]           = useState([])
  const [loading,             setLoading]             = useState(false)
  const [result,              setResult]              = useState('')
  const [error,               setError]               = useState('')
  const [copied,              setCopied]              = useState('')

  useEffect(() => { setProspects(getProspects()) }, [])

  function handleProspectSelect(id) {
    setProspectId(id)
    const p = prospects.find(p => p.id === id)
    if (p) {
      setProspectName(p.name || '')
      setCompany(p.company || '')
    }
  }

  async function handleGenerate() {
    if (!jobDescription.trim() && !questions.trim()) {
      setError('Paste a job description or add specific questions to continue.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    try {
      const profile = getProfile()
      const text = await callClaude(
        'generateVideoScript',
        { prospectName: prospectName || 'the hiring manager', company: company || 'their company', videoType, videoLength, jobDescription, questions, customInstructions },
        profile
      )
      setResult(text)
      // Auto-save to prospect if one is selected
      if (prospectId) saveProspectDoc(prospectId, 'videoScript', text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  function extractSection(text, keyword) {
    const regex = new RegExp(`##[^\\w\\n]*${keyword}[\\s\\S]*?(?=\\n##[^\\w\\n]*[A-Z🎬✅⚡🚨]|$)`, 'i')
    const m = text.match(regex)
    return m ? m[0].trim() : null
  }

  function sectionBody(text) {
    return text ? text.replace(/^##[^\n]*\n/, '').trim() : ''
  }

  const secNotes     = result ? extractSection(result, 'INSTRUCTION NOTES') : null
  const secChecklist = result ? extractSection(result, 'PRE-RECORDING') : null
  const secScript    = result ? extractSection(result, 'FULL SCRIPT') : null
  const secQuick     = result ? extractSection(result, 'QUICK REFERENCE') : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Video Script Generator</h2>
        <p className="section-subtitle">
          Generate a complete, record-ready video script in your voice — for Loom intros, Q&amp;A responses, portfolio walkthroughs, and more. Includes extracted instruction notes from the job post.
        </p>
      </div>

      {/* ── Who is this for ── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">🎯 Who is this for?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Link to tracker prospect</label>
            <select className="input-field" value={prospectId} onChange={e => handleProspectSelect(e.target.value)}>
              <option value="">— Select from tracker —</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.company ? ` · ${p.company}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Hiring Manager / Contact Name</label>
            <input className="input-field" value={prospectName} onChange={e => setProspectName(e.target.value)} placeholder="e.g. Sarah Johnson" />
          </div>
          <div>
            <label className="label">Company Name</label>
            <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Capable Home Buyers" />
          </div>
        </div>
      </div>

      {/* ── Video type & length ── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">🎬 Video Format</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="label mb-2">Video Type</label>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setVideoType(t.value)}
                  className={`text-left p-3 rounded-lg border text-xs transition-all ${
                    videoType === t.value
                      ? 'border-brand-blue bg-blue-50 text-brand-blue'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="font-semibold leading-tight">{t.label}</div>
                  <div className={`mt-0.5 text-xs leading-tight ${videoType === t.value ? 'text-blue-400' : 'text-gray-400'}`}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label mb-2">Target Length</label>
            <div className="space-y-2">
              {VIDEO_LENGTHS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setVideoLength(l.value)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs transition-all ${
                    videoLength === l.value
                      ? 'border-brand-blue bg-blue-50 text-brand-blue font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span>{l.label}</span>
                  <span className={videoLength === l.value ? 'text-blue-400' : 'text-gray-400'}>{l.words}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Job description ── */}
      <div className="card mb-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-gray-900 text-sm">📋 Job Description / Brief</h3>
          <span className="text-xs text-brand-blue bg-blue-50 px-2 py-0.5 rounded-full">Auto-extracts instructions</span>
        </div>
        <p className="text-xs text-gray-400 mb-3">Paste the full job post, email, or brief. Specific questions, video requirements, and submission instructions will be extracted automatically.</p>
        <textarea
          className="textarea-field"
          rows={8}
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the full job description or brief here — include everything. The more context, the better the script."
        />
      </div>

      {/* ── Questions & custom notes ── */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">❓ Questions & Custom Context</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Specific Questions to Answer</label>
            <p className="text-xs text-gray-400 mb-2">One per line. Auto-detected from job post too.</p>
            <textarea
              className="textarea-field"
              rows={5}
              value={questions}
              onChange={e => setQuestions(e.target.value)}
              placeholder={"Why do you want this role?\nWhat tools do you use daily?\nDescribe a challenge you solved..."}
            />
          </div>
          <div>
            <label className="label">Custom Instructions / Things to Include</label>
            <p className="text-xs text-gray-400 mb-2">Extra context, things to mention, tone adjustments.</p>
            <textarea
              className="textarea-field"
              rows={5}
              value={customInstructions}
              onChange={e => setCustomInstructions(e.target.value)}
              placeholder={"Mention my GoHighLevel experience.\nKeep it conversational, not corporate.\nReference adsidi.co..."}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || (!jobDescription.trim() && !questions.trim())}
            className="btn-primary min-w-[200px]"
          >
            {loading
              ? <><span className="spinner border-white border-t-transparent" /> Generating Script...</>
              : '🎬 Generate Video Script'
            }
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4 fade-in">

          {/* Instruction Notes */}
          {secNotes && (
            <div className="card border-2 border-orange-300 bg-orange-50/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-orange-800 text-sm">🚨 Instruction Notes — Read Before You Hit Record</h3>
                  <p className="text-xs text-orange-600 mt-0.5">Extracted from the job post + specific requirements</p>
                </div>
                <button onClick={() => copyText(sectionBody(secNotes), 'notes')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'notes' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-orange-900 whitespace-pre-wrap leading-relaxed">
                {sectionBody(secNotes)}
              </div>
            </div>
          )}

          {/* Pre-recording checklist */}
          {secChecklist && (
            <div className="card border border-green-200 bg-green-50/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-green-800 text-sm">✅ Pre-Recording Checklist</h3>
                <button onClick={() => copyText(sectionBody(secChecklist), 'checklist')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'checklist' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed">
                {sectionBody(secChecklist)}
              </div>
            </div>
          )}

          {/* Full Script */}
          {secScript && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">🎬 Full Video Script</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Word-for-word in your voice. [pause] = natural beat. (smile) = warmth cue.</p>
                </div>
                <button onClick={() => copyText(sectionBody(secScript), 'script')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'script' ? '✓ Copied full script' : '📋 Copy full script'}
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 text-sm whitespace-pre-wrap leading-loose text-gray-800 font-mono">
                {sectionBody(secScript)}
              </div>
            </div>
          )}

          {/* Quick Reference */}
          {secQuick && (
            <div className="card border border-gray-200 bg-gray-50/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">⚡ Quick Reference Talking Points</h3>
                  <p className="text-xs text-gray-400 mt-0.5">If you prefer to speak naturally — hit these key points.</p>
                </div>
                <button onClick={() => copyText(sectionBody(secQuick), 'ref')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'ref' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {sectionBody(secQuick)}
              </div>
            </div>
          )}

          {/* Raw toggle */}
          <details className="text-xs">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600">View raw output</summary>
            <div className="mt-2 p-4 bg-gray-50 rounded-xl text-xs whitespace-pre-wrap leading-relaxed text-gray-500">
              {result}
            </div>
          </details>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div className="card border-dashed bg-brand-blue-light/30 border-brand-blue/20">
          <h3 className="font-semibold text-brand-blue text-sm mb-3">🎬 What you'll get</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>→ <strong>🚨 Instruction Notes</strong> — video length limits, must-mention items, submission format, platform requirements — all pulled from the job post</li>
            <li>→ <strong>✅ Pre-Recording Checklist</strong> — what to prepare, check, and have ready before you hit record</li>
            <li>→ <strong>🎬 Full Script</strong> — word-for-word in your voice with time markers, natural pause cues, and section breakdowns</li>
            <li>→ <strong>⚡ Quick Reference</strong> — key talking points if you prefer to speak naturally instead of reading</li>
          </ul>
          <p className="mt-3 text-xs text-gray-400">Works for Loom intros, Q&amp;A videos, portfolio walkthroughs, or any custom format. Paste the job description to start.</p>
        </div>
      )}
    </div>
  )
}
