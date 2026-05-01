import { useState } from 'react'
import { getProfile, FULL_RESUME_DATA, getUploadedResume } from '../lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: safe JSON parse (strips code fences if Claude wraps them)
// ─────────────────────────────────────────────────────────────────────────────
function safeParseJson(raw) {
  let s = (raw || '').trim()
  s = s.replace(/^```json\n?/i, '').replace(/\n?```\s*$/i, '').trim()
  s = s.replace(/^```\n?/, '').replace(/\n?```\s*$/, '').trim()
  return JSON.parse(s)
}

// ─────────────────────────────────────────────────────────────────────────────
// Build printable HTML from letter text
// ─────────────────────────────────────────────────────────────────────────────
function buildLetterHtml(letterText, profile) {
  const name  = profile?.fullName  || 'Vinz Betonio'
  const email = profile?.email     || 'vinzabcde08@gmail.com'
  const phone = profile?.phone     || '+63 968 266 7221'

  function textToHtml(text) {
    const lines = text.split('\n')
    let html = ''
    let inList = false
    lines.forEach(line => {
      const trimmed = line.trim()
      const isBullet = /^[-•*]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)
      if (isBullet) {
        if (!inList) { html += '<ul>'; inList = true }
        const content = trimmed.replace(/^[-•*\d.]\s+/, '')
        html += `<li>${content}</li>`
      } else {
        if (inList) { html += '</ul>'; inList = false }
        if (trimmed === '') { html += '<br>' } else { html += `<p>${trimmed}</p>` }
      }
    })
    if (inList) html += '</ul>'
    return html
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Application Letter — ${name}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111; background: #fff; line-height: 1.55; }
.toolbar { background: #f0f4ff; border-bottom: 1px solid #c5d0e6; padding: 12px 20px; display: flex; align-items: center; gap: 16px; }
.print-btn { background: #1a56db; color: #fff; border: none; padding: 9px 22px; font-size: 13px; font-family: Calibri, Arial, sans-serif; border-radius: 5px; cursor: pointer; font-weight: bold; }
.print-btn:hover { background: #1344b0; }
.toolbar-note { font-size: 12px; color: #555; }
.page { max-width: 7.5in; margin: 0 auto; padding: 0.9in 1in; }
p { margin-bottom: 12px; }
ul { margin-left: 22px; margin-bottom: 12px; list-style-type: disc; }
li { margin-bottom: 5px; }
br { display: block; margin-bottom: 6px; }
@media print { .toolbar { display: none !important; } .page { padding: 0.7in 0.9in; } @page { size: letter; margin: 0; } }
</style>
</head>
<body>
<div class="toolbar">
  <button class="print-btn" onclick="window.print()">🖨️ Print to PDF</button>
  <span class="toolbar-note">Print dialog → Destination → <strong>Save as PDF</strong> → Save</span>
</div>
<div class="page">${textToHtml(letterText)}</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Application Checklist card
// ─────────────────────────────────────────────────────────────────────────────
function ApplicationChecklist({ parsed }) {
  const [checked, setChecked] = useState({})

  function toggle(key) {
    setChecked(p => ({ ...p, [key]: !p[key] }))
  }

  const total   = (parsed.requiredSubmissions?.length || 0) + (parsed.questionsToAnswer?.length || 0)
  const done    = Object.values(checked).filter(Boolean).length
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="card border-2 border-orange-300 bg-orange-50">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <h3 className="font-bold text-orange-900 text-base">📋 How to Apply</h3>
          <p className="text-orange-700 text-xs mt-0.5">Complete every item below before submitting</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-700">{pct}%</div>
          <div className="text-xs text-orange-600">{done}/{total} done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-orange-200 rounded-full h-2 mb-5">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Application link — most prominent */}
      {parsed.applicationLink && (
        <div className="mb-4 p-3 bg-white border-2 border-orange-400 rounded-xl">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">🔗 Submit Your Application Here</p>
          <a
            href={parsed.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm font-semibold break-all hover:text-blue-800"
          >
            {parsed.applicationLink}
          </a>
          {parsed.applicationMethod && (
            <p className="text-xs text-gray-500 mt-1">Via: {parsed.applicationMethod}</p>
          )}
        </div>
      )}

      {parsed.applicationEmail && !parsed.applicationLink && (
        <div className="mb-4 p-3 bg-white border-2 border-orange-400 rounded-xl">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">📧 Send Application To</p>
          <a
            href={`mailto:${parsed.applicationEmail}`}
            className="text-blue-600 underline text-sm font-semibold hover:text-blue-800"
          >
            {parsed.applicationEmail}
          </a>
        </div>
      )}

      {/* Deadline + Salary row */}
      {(parsed.deadline || parsed.salary) && (
        <div className="flex gap-3 mb-4 flex-wrap">
          {parsed.deadline && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs">
              <span>⏰</span>
              <span className="text-red-700 font-semibold">Deadline: {parsed.deadline}</span>
            </div>
          )}
          {parsed.salary && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs">
              <span>💰</span>
              <span className="text-green-700 font-semibold">{parsed.salary}</span>
            </div>
          )}
        </div>
      )}

      {/* Required Submissions */}
      {parsed.requiredSubmissions?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Required Submissions</p>
          <div className="space-y-2">
            {parsed.requiredSubmissions.map((sub, i) => {
              const key = `sub-${i}`
              return (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!checked[key]}
                    onChange={() => toggle(key)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                  />
                  <div className={checked[key] ? 'opacity-50 line-through' : ''}>
                    <span className="text-sm font-semibold text-gray-800">{sub.item}</span>
                    {sub.notes && (
                      <span className="text-xs text-gray-500 ml-2">— {sub.notes}</span>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Questions to Answer */}
      {parsed.questionsToAnswer?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Questions to Answer</p>
          <div className="space-y-2">
            {parsed.questionsToAnswer.map((q, i) => {
              const key = `q-${i}`
              return (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checked[key]}
                    onChange={() => toggle(key)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                  />
                  <span className={`text-sm text-gray-700 ${checked[key] ? 'opacity-50 line-through' : ''}`}>
                    {q}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {parsed.specialInstructions && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
          <span className="font-semibold">⚠️ Special Instructions: </span>
          {parsed.specialInstructions}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Employer Research card
// ─────────────────────────────────────────────────────────────────────────────
function EmployerResearchCard({ research }) {
  const confidenceColor = {
    high: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    low: 'text-red-600 bg-red-50 border-red-200',
  }[research.confidence] || 'text-gray-500 bg-gray-50 border-gray-200'

  const socialIcons = {
    linkedin:  { icon: '💼', label: 'LinkedIn' },
    facebook:  { icon: '📘', label: 'Facebook' },
    instagram: { icon: '📸', label: 'Instagram' },
    twitter:   { icon: '🐦', label: 'Twitter/X' },
    youtube:   { icon: '▶️', label: 'YouTube' },
    tiktok:    { icon: '🎵', label: 'TikTok' },
  }

  const activeSocials = Object.entries(research.socials || {}).filter(([, v]) => v)

  return (
    <div className="card space-y-4">
      {/* Company header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-gray-900 text-base">🏢 {research.companyName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{research.industry} · {research.companyType} · {research.size}</p>
          {research.location && <p className="text-xs text-gray-400">{research.location}</p>}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${confidenceColor}`}>
          {research.confidence?.toUpperCase()} confidence
        </span>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{research.description}</p>

      {/* Website */}
      {research.website && (
        <div className="flex items-center gap-2">
          <span className="text-sm">🌐</span>
          <a
            href={research.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm hover:text-blue-800"
          >
            {research.website}
          </a>
        </div>
      )}

      {/* Socials */}
      {activeSocials.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Social Media</p>
          <div className="flex flex-wrap gap-2">
            {activeSocials.map(([platform, url]) => {
              const meta = socialIcons[platform] || { icon: '🔗', label: platform }
              const href = url.startsWith('http') ? url : `https://${url}`
              return (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-700 hover:border-brand-blue hover:text-brand-blue transition-all"
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Pain Points */}
      {research.painPoints?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">🎯 Pain Points (what they need solved)</p>
          <ul className="space-y-1.5">
            {research.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Fixes */}
      {research.suggestedFixes?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">💡 What You Can Fix / Bring</p>
          <ul className="space-y-1.5">
            {research.suggestedFixes.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitors */}
      {research.competitors?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">⚔️ Competitors</p>
          <div className="flex flex-wrap gap-2">
            {research.competitors.map((c, i) => (
              <div key={i} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
                <span className="font-semibold text-gray-800">{c.name}</span>
                {c.description && <span className="text-gray-500 ml-1">— {c.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What to emphasize */}
      {research.whatToEmphasize?.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">⭐ Emphasize in your application</p>
          <ul className="space-y-1">
            {research.whatToEmphasize.map((e, i) => (
              <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="flex-shrink-0">→</span>{e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent signals */}
      {research.recentSignals && research.recentSignals !== 'No specific signals found' && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
          <span className="font-semibold">📡 Recent signals: </span>{research.recentSignals}
        </div>
      )}

      {/* Confidence caveat */}
      {research.notes && (
        <p className="text-xs text-gray-400 italic">{research.notes}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ApplicationLetter() {
  // Input
  const [jobPost, setJobPost]             = useState('')

  // Analysis results
  const [parsedJob, setParsedJob]         = useState(null)
  const [employerResearch, setEmployer]   = useState(null)

  // Letter
  const [letterText, setLetterText]       = useState('')

  // Loading / error states
  const [analyzing, setAnalyzing]         = useState(false)
  const [analyzeError, setAnalyzeError]   = useState('')
  const [generating, setGenerating]       = useState(false)
  const [genError, setGenError]           = useState('')

  // UI
  const [copied, setCopied]               = useState(false)
  const [showPreview, setShowPreview]     = useState(false)
  const [activeSection, setActiveSection] = useState('checklist') // 'checklist' | 'research'

  const uploadedResume = getUploadedResume()
  const profile        = getProfile()

  // ── Step 1: Analyze the job post ─────────────────────────────────────────
  async function handleAnalyze() {
    if (!jobPost.trim()) {
      setAnalyzeError('Paste the job post first.')
      return
    }
    setAnalyzing(true)
    setAnalyzeError('')
    setParsedJob(null)
    setEmployer(null)
    setLetterText('')

    try {
      // Run both calls in parallel
      const [parseRes, _] = await Promise.allSettled([
        fetch('/api/claude', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature: 'parseJobPost', data: { jobPost }, profile }),
        }).then(r => r.json()),
        // We'll trigger research after parse gives us company name
        // but start with a placeholder
      ])

      // Parse the job post
      let parsed = null
      if (parseRes.status === 'fulfilled') {
        try { parsed = safeParseJson(parseRes.value.result) } catch {}
      }
      if (!parsed) throw new Error('Could not parse the job post. Try again.')
      setParsedJob(parsed)

      // Now research the employer using the extracted company name
      const companyName = parsed.companyName || parsed.employerProfile?.name || ''
      if (companyName) {
        try {
          const researchRes = await fetch('/api/claude', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feature: 'researchEmployer',
              data: { companyName, jobDescription: jobPost },
              profile,
            }),
          })
          const researchJson = await researchRes.json()
          if (researchRes.ok) {
            try { setEmployer(safeParseJson(researchJson.result)) } catch {}
          }
        } catch {}
      }
    } catch (e) {
      setAnalyzeError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Step 2: Generate the letter ──────────────────────────────────────────
  async function handleGenerateLetter() {
    setGenerating(true)
    setGenError('')
    setLetterText('')

    try {
      const baseResume = uploadedResume || FULL_RESUME_DATA

      // Build a rich context string combining parsed job + research
      const enrichedJD = [
        jobPost,
        employerResearch ? `\n\nEMPLOYER RESEARCH:\n${JSON.stringify(employerResearch, null, 2)}` : '',
        parsedJob ? `\n\nPARSED APPLICATION REQUIREMENTS:\n${JSON.stringify(parsedJob, null, 2)}` : '',
      ].join('')

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'generateAppLetter',
          data: {
            jobDescription: enrichedJD,
            hiringManager: parsedJob?.hiringManagerName || 'Hiring Manager',
            companyName:   parsedJob?.companyName || employerResearch?.companyName || 'your company',
            resumeData: baseResume,
          },
          profile,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Request failed')
      setLetterText(json.result.trim())
    } catch (e) {
      setGenError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (!letterText) return
    navigator.clipboard.writeText(letterText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleOpenInTab() {
    if (!letterText) return
    const html = buildLetterHtml(letterText, profile)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  function handleReset() {
    setJobPost('')
    setParsedJob(null)
    setEmployer(null)
    setLetterText('')
    setAnalyzeError('')
    setGenError('')
    setShowPreview(false)
    setCopied(false)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="section-title">Application Letter</h2>
        <p className="section-subtitle">
          Paste any job post — Claude parses the exact application instructions, researches the employer (socials, pain points, competitors), then writes a tailored cover letter.
        </p>
      </div>

      {/* ── Resume source ────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-6 text-sm ${
        uploadedResume
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-amber-50 border border-amber-200 text-amber-800'
      }`}>
        <span className="text-lg">{uploadedResume ? '✅' : '⚠️'}</span>
        <div>
          {uploadedResume ? (
            <>
              <span className="font-semibold">Using your uploaded resume</span>
              <span className="text-green-600 ml-2 text-xs">
                ({uploadedResume.workExperience?.length || 0} companies · {
                  uploadedResume._uploadedAt
                    ? new Date(uploadedResume._uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'recently'
                })
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold">No resume uploaded yet</span>
              <span className="text-amber-700 ml-2 text-xs">Go to <strong>Profile Setup → Upload Resume</strong> for best results.</span>
            </>
          )}
        </div>
      </div>

      {/* ── Job Post Input ───────────────────────────────────────────────── */}
      {!parsedJob && !analyzing && (
        <div className="card fade-in space-y-4">
          <div>
            <label className="label">Paste the Job Post</label>
            <p className="text-xs text-gray-400 mb-2">
              Copy the full job description — include the "How to Apply", "About the Employer", any questions, and the application link. The more you paste, the better the analysis.
            </p>
            <textarea
              className="textarea-field"
              rows={14}
              value={jobPost}
              onChange={e => { setJobPost(e.target.value); setAnalyzeError('') }}
              placeholder={`Paste the full job post here...\n\nInclude everything:\n• Job description\n• Requirements\n• "To Apply" instructions\n• Application link or email\n• Questions they want answered\n• About the Employer section\n\nWorks with: OnlineJobs.ph, VirtualStaff.ph, Indeed, LinkedIn, Upwork, etc.`}
            />
          </div>

          {analyzeError && <p className="text-red-500 text-sm">{analyzeError}</p>}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">~30–50 seconds · parses requirements + researches employer in parallel</p>
            <button
              onClick={handleAnalyze}
              disabled={!jobPost.trim()}
              className="btn-primary min-w-[220px]"
            >
              🔍 Analyze Job Post
            </button>
          </div>
        </div>
      )}

      {/* ── Analyzing loader ─────────────────────────────────────────────── */}
      {analyzing && (
        <div className="card text-center py-12 fade-in">
          <div className="text-4xl mb-4">🔍</div>
          <p className="font-semibold text-gray-800 text-base">Analyzing job post...</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>✓ Extracting application requirements</p>
            <p>↻ Researching the employer...</p>
          </div>
          <div className="mt-5 flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-blue skeleton" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Results: Checklist + Research ────────────────────────────────── */}
      {parsedJob && !analyzing && (
        <div className="fade-in space-y-4">

          {/* Job title + company banner */}
          <div className="flex items-center justify-between gap-3 flex-wrap p-4 bg-navy-900 text-white rounded-xl">
            <div>
              <p className="font-bold text-lg">{parsedJob.roleTitle || 'Job Application'}</p>
              <p className="text-white/70 text-sm">{parsedJob.companyName || parsedJob.employerProfile?.name || 'Company'}</p>
              {parsedJob.jobSource && (
                <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full mt-1 inline-block">
                  {parsedJob.jobSource}
                </span>
              )}
            </div>
            <button onClick={handleReset} className="text-white/50 hover:text-white text-xs transition-colors">
              ← New Job Post
            </button>
          </div>

          {/* Tab switcher: Checklist | Research */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
            {[
              { id: 'checklist', label: '📋 How to Apply', count: (parsedJob.requiredSubmissions?.length || 0) + (parsedJob.questionsToAnswer?.length || 0) },
              { id: 'research',  label: '🏢 Employer Research', badge: employerResearch?.confidence },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{tab.count}</span>
                )}
                {tab.badge && (
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                    tab.badge === 'high' ? 'bg-green-100 text-green-700' :
                    tab.badge === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeSection === 'checklist' && <ApplicationChecklist parsed={parsedJob} />}
          {activeSection === 'research' && (
            employerResearch
              ? <EmployerResearchCard research={employerResearch} />
              : (
                <div className="card text-center py-8 text-gray-400 text-sm">
                  Could not research this employer — company name not found in the job post.
                </div>
              )
          )}

          {/* ── Generate Letter section ────────────────────────────────── */}
          {!letterText && (
            <div className="card border-brand-blue border-2 bg-blue-50">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-gray-900">✉️ Generate Your Cover Letter</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uses your resume + the job requirements + employer research to write a tailored, human-sounding letter.
                  </p>
                </div>
                <button
                  onClick={handleGenerateLetter}
                  disabled={generating}
                  className="btn-primary min-w-[220px]"
                >
                  {generating ? (
                    <><span className="spinner border-white border-t-transparent" /> Writing letter...</>
                  ) : (
                    '✉️ Generate Cover Letter'
                  )}
                </button>
              </div>
              {genError && <p className="text-red-500 text-sm mt-3">{genError}</p>}
              {generating && (
                <p className="text-xs text-blue-600 mt-3 animate-pulse">
                  Claude is reading the job requirements + employer research and writing your letter...
                </p>
              )}
            </div>
          )}

          {/* ── Letter result ─────────────────────────────────────────── */}
          {letterText && !generating && (
            <div className="space-y-4 fade-in">

              <div className="card border-green-200 bg-green-50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 text-xl">✅</span>
                    <div>
                      <p className="font-semibold text-green-800 text-sm">Cover letter ready!</p>
                      <p className="text-xs text-green-600">Tailored to {parsedJob.companyName || 'the role'} using your resume + research.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setLetterText('')}
                      className="btn-secondary text-xs"
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="btn-secondary text-xs"
                    >
                      {showPreview ? '🙈 Hide' : '👁️ Preview'}
                    </button>
                    <button onClick={handleCopy} className="btn-secondary text-xs">
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                    <button
                      onClick={handleOpenInTab}
                      className="btn-primary text-sm"
                      style={{ background: '#1a56db' }}
                    >
                      🖨️ Open &amp; Print
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">Your cover letter</p>
                  <button onClick={handleCopy} className="text-xs text-brand-blue hover:underline">
                    {copied ? '✓ Copied!' : 'Copy to clipboard'}
                  </button>
                </div>
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-[500px] overflow-y-auto">
                  {letterText}
                </pre>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                <p className="font-semibold text-blue-800 mb-1">To save as PDF:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Click <strong>"Open &amp; Print"</strong> to open in a new tab</li>
                  <li>Click the blue <strong>"Print to PDF"</strong> button inside</li>
                  <li>Print dialog → Destination → <strong>Save as PDF</strong></li>
                </ol>
              </div>

              {showPreview && letterText && (
                <div className="card p-0 overflow-hidden fade-in">
                  <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <span className="text-gray-400 text-xs ml-2">Letter Preview</span>
                    <button onClick={handleOpenInTab} className="ml-auto text-xs text-blue-300 hover:text-blue-100">
                      ↗ Open in new tab to print
                    </button>
                  </div>
                  <iframe
                    srcDoc={buildLetterHtml(letterText, profile)}
                    className="w-full"
                    style={{ height: '700px', border: 'none', background: '#fff' }}
                    title="Letter Preview"
                    sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
                  />
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  )
}
