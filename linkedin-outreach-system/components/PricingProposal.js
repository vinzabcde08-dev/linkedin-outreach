import { useState, useEffect } from 'react'
import { getProfile, getProspects, saveProspectDoc } from '../lib/storage'
import { callClaude } from '../lib/api'

const RATE_TYPES = [
  { value: 'monthly_retainer', label: '📅 Monthly Retainer',    desc: 'Fixed monthly fee' },
  { value: 'hourly',           label: '⏱ Hourly Rate',          desc: 'Per-hour billing' },
  { value: 'project_based',   label: '📦 Project-Based',        desc: 'One-time project fee' },
  { value: 'performance',     label: '📈 Performance-Based',    desc: 'Results-tied pricing' },
]

const SERVICE_OPTIONS = [
  'Executive & Administrative Assistance (EA/VA)',
  'Operations Management & Team Coordination',
  'Digital Marketing Strategy & Execution',
  'Facebook & Instagram Ads (Meta Ads)',
  'Social Media Management & Content Scheduling',
  'Content Creation (Reels, Graphics, Video Editing)',
  'CRM Management (HubSpot, Zoho, GoHighLevel)',
  'Lead Generation & Prospecting',
  'Email & Calendar Management',
  'Project & Task Management',
  'Customer Support (Chat, Email, Phone)',
  'VA Team Staffing & Management',
  'Broadcast Journalism Training',
  'Custom (specify in notes)',
]

export default function PricingProposal() {
  const [prospectId,       setProspectId]       = useState('')
  const [prospectName,     setProspectName]      = useState('')
  const [company,          setCompany]           = useState('')
  const [selectedServices, setSelectedServices]  = useState([])
  const [rateType,         setRateType]          = useState('monthly_retainer')
  const [budget,           setBudget]            = useState('')
  const [hoursPerWeek,     setHoursPerWeek]      = useState('')
  const [startDate,        setStartDate]         = useState('')
  const [jobContext,       setJobContext]         = useState('')
  const [customNotes,      setCustomNotes]       = useState('')
  const [prospects,        setProspects]         = useState([])
  const [loading,          setLoading]           = useState(false)
  const [result,           setResult]            = useState('')
  const [error,            setError]             = useState('')
  const [copied,           setCopied]            = useState('')
  const [saved,            setSaved]             = useState(false)

  useEffect(() => { setProspects(getProspects()) }, [])

  function handleProspectSelect(id) {
    setProspectId(id)
    const p = prospects.find(p => p.id === id)
    if (p) {
      setProspectName(p.name || '')
      setCompany(p.company || '')
      if (p.briefSummary) setJobContext(p.briefSummary)
    }
  }

  function toggleService(svc) {
    setSelectedServices(prev =>
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    )
  }

  async function handleGenerate() {
    if (selectedServices.length === 0) {
      setError('Select at least one service to include in the proposal.')
      return
    }
    if (!prospectName.trim() && !company.trim()) {
      setError('Add a client name or company before generating.')
      return
    }
    setLoading(true)
    setError('')
    setResult('')
    setSaved(false)
    try {
      const profile = getProfile()
      const data = {
        prospectName: prospectName || 'the client',
        company: company || 'their company',
        selectedServices,
        rateType,
        budget,
        hoursPerWeek,
        startDate,
        jobContext,
        customNotes,
      }
      const text = await callClaude('generatePricingProposal', data, profile)
      setResult(text)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSave() {
    if (!prospectId || !result) return
    saveProspectDoc(prospectId, 'pricingProposal', result)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  function extractSection(text, keyword) {
    const regex = new RegExp(`##[^\\w\\n]*${keyword}[\\s\\S]*?(?=\\n##[^\\w\\n]*[A-Z💰📋🤝📌⚡✅]|$)`, 'i')
    const m = text.match(regex)
    return m ? m[0].trim() : null
  }

  function sectionBody(text) {
    return text ? text.replace(/^##[^\n]*\n/, '').trim() : ''
  }

  const secPitch    = result ? extractSection(result, 'PITCH NOTE')        : null
  const secServices = result ? extractSection(result, 'SERVICES')          : null
  const secPricing  = result ? extractSection(result, 'PRICING')           : null
  const secTerms    = result ? extractSection(result, 'TERMS')             : null
  const secCTA      = result ? extractSection(result, 'NEXT STEPS')        : null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Pricing Proposal Generator</h2>
        <p className="section-subtitle">
          Generate a tailored service proposal with a pricing table, pitch note, and clear next steps — ready to send or drop into a PDF.
        </p>
      </div>

      {/* ── Who is this for ── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">🎯 Client Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Link to Prospect</label>
            <select className="input-field" value={prospectId} onChange={e => handleProspectSelect(e.target.value)}>
              <option value="">— Select from tracker —</option>
              {prospects.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.company ? ` · ${p.company}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Client / Contact Name</label>
            <input className="input-field" value={prospectName} onChange={e => setProspectName(e.target.value)} placeholder="e.g. Sarah Johnson" />
          </div>
          <div>
            <label className="label">Company</label>
            <input className="input-field" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Capable Home Buyers" />
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-1">📋 Services to Include</h3>
        <p className="text-xs text-gray-400 mb-3">Select all services you'll propose for this client.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICE_OPTIONS.map(svc => (
            <label key={svc} className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
              selectedServices.includes(svc)
                ? 'border-brand-blue bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="checkbox"
                checked={selectedServices.includes(svc)}
                onChange={() => toggleService(svc)}
                className="mt-0.5 accent-brand-blue flex-shrink-0"
              />
              <span className={selectedServices.includes(svc) ? 'text-brand-blue font-medium' : 'text-gray-700'}>
                {svc}
              </span>
            </label>
          ))}
        </div>
        {selectedServices.length > 0 && (
          <div className="mt-3 text-xs text-brand-blue">
            {selectedServices.length} service{selectedServices.length > 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      {/* ── Pricing Structure ── */}
      <div className="card mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">💰 Pricing Structure</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {RATE_TYPES.map(r => (
            <button
              key={r.value}
              onClick={() => setRateType(r.value)}
              className={`text-left p-3 rounded-lg border text-xs transition-all ${
                rateType === r.value
                  ? 'border-brand-blue bg-blue-50 text-brand-blue'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="font-semibold leading-tight">{r.label}</div>
              <div className={`mt-0.5 text-xs ${rateType === r.value ? 'text-blue-400' : 'text-gray-400'}`}>{r.desc}</div>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Client's Budget (optional)</label>
            <input className="input-field" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. $500–$800/mo" />
          </div>
          <div>
            <label className="label">Est. Hours / Week (optional)</label>
            <input className="input-field" value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} placeholder="e.g. 10–15 hrs/week" />
          </div>
          <div>
            <label className="label">Proposed Start Date (optional)</label>
            <input className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="e.g. June 1, 2026" />
          </div>
        </div>
      </div>

      {/* ── Context & Notes ── */}
      <div className="card mb-6">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">📌 Context & Custom Notes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Job Post / Brief / Context</label>
            <p className="text-xs text-gray-400 mb-2">Paste the job description, email thread, or any context about this client's needs.</p>
            <textarea className="textarea-field" rows={6} value={jobContext} onChange={e => setJobContext(e.target.value)}
              placeholder="Paste the job post, brief, or any conversation context here..." />
          </div>
          <div>
            <label className="label">Custom Instructions</label>
            <p className="text-xs text-gray-400 mb-2">Anything specific to include, tone adjustments, or deal notes.</p>
            <textarea className="textarea-field" rows={6} value={customNotes} onChange={e => setCustomNotes(e.target.value)}
              placeholder={"Emphasize GoHighLevel CRM experience.\nThey mentioned $700/mo budget.\nHighlight Adsidi team capacity..."} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
          <div>{error && <p className="text-red-500 text-sm">{error}</p>}</div>
          <button
            onClick={handleGenerate}
            disabled={loading || selectedServices.length === 0}
            className="btn-primary min-w-[220px]"
          >
            {loading
              ? <><span className="spinner border-white border-t-transparent" /> Generating Proposal...</>
              : '💰 Generate Pricing Proposal'
            }
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4 fade-in">

          {/* Pitch Note */}
          {secPitch && (
            <div className="card border-2 border-brand-blue/30 bg-blue-50/40">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-brand-blue text-sm">🤝 Pitch Note</h3>
                  <p className="text-xs text-blue-400 mt-0.5">Opening message to send with the proposal</p>
                </div>
                <button onClick={() => copyText(sectionBody(secPitch), 'pitch')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'pitch' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-blue-900 whitespace-pre-wrap leading-relaxed">{sectionBody(secPitch)}</div>
            </div>
          )}

          {/* Services & Pricing */}
          {secPricing && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">💰 Pricing Table</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Full breakdown of services and pricing</p>
                </div>
                <button onClick={() => copyText(sectionBody(secPricing), 'pricing')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'pricing' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm whitespace-pre-wrap leading-relaxed text-gray-800 font-mono text-xs">
                {sectionBody(secPricing)}
              </div>
            </div>
          )}

          {/* Terms */}
          {secTerms && (
            <div className="card border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-sm">📋 Terms & Conditions</h3>
                <button onClick={() => copyText(sectionBody(secTerms), 'terms')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'terms' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{sectionBody(secTerms)}</div>
            </div>
          )}

          {/* CTA / Next Steps */}
          {secCTA && (
            <div className="card border border-green-200 bg-green-50/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-green-800 text-sm">⚡ Next Steps</h3>
                <button onClick={() => copyText(sectionBody(secCTA), 'cta')} className="copy-btn flex-shrink-0 ml-3">
                  {copied === 'cta' ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
              <div className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed">{sectionBody(secCTA)}</div>
            </div>
          )}

          {/* Copy All + Save */}
          <div className="card bg-gray-50 border border-gray-200">
            <div className="flex items-center gap-3">
              <button onClick={() => copyText(result, 'all')} className="btn-secondary flex-1">
                {copied === 'all' ? '✓ Copied full proposal' : '📋 Copy Full Proposal'}
              </button>
              {prospectId && (
                <button onClick={handleSave} className={`btn-primary flex-1 ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}>
                  {saved ? '✅ Saved to Prospect!' : '💾 Save to Prospect'}
                </button>
              )}
            </div>
            {!prospectId && (
              <p className="text-xs text-gray-400 mt-2 text-center">Select a prospect above to save this proposal to their record.</p>
            )}
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
          <h3 className="font-semibold text-brand-blue text-sm mb-3">💰 What you'll get</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>→ <strong>🤝 Pitch Note</strong> — personalized opening message to send alongside the proposal</li>
            <li>→ <strong>💰 Pricing Table</strong> — clean breakdown of selected services with rates and deliverables</li>
            <li>→ <strong>📋 Terms & Conditions</strong> — payment terms, revision policy, scope boundaries</li>
            <li>→ <strong>⚡ Next Steps</strong> — clear CTA and onboarding path for the client</li>
          </ul>
          <p className="mt-3 text-xs text-gray-400">Select services, set the pricing structure, paste any context from the job post, then hit generate.</p>
        </div>
      )}
    </div>
  )
}
