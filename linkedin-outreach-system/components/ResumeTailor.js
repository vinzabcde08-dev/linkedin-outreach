import { useState } from 'react'
import { getProfile, FULL_RESUME_DATA } from '../lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// Generates HTML that exactly matches the PDF resume format
// ─────────────────────────────────────────────────────────────────────────────
function generateResumeHtml(data, profile) {
  const name = (profile?.fullName || 'VINZ ABCDE V. BETONIO').toUpperCase()
  const phone = profile?.phone || '+63 968 266 7221'
  const email = profile?.email || 'vinzabcde08@gmail.com'
  const location = 'Tacurong City, Philippines'
  const linkedinUrl = profile?.linkedinUrl || '#'

  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function renderBullets(bullets) {
    if (!bullets || bullets.length === 0) return ''
    return `<ul>${bullets.map(b => `<li>${esc(b)}</li>`).join('\n')}</ul>`
  }

  function renderRoles(roles) {
    return (roles || []).map(role => `
      <div class="role-row">
        <span class="role-title">${esc(role.title)}</span>
        <span class="dates">${esc(role.dates)}</span>
      </div>
      ${renderBullets(role.bullets)}
    `).join('')
  }

  function renderEntries(entries) {
    return (entries || []).map(entry => `
      <div class="entry">
        <div class="company-row">
          <span class="company">${esc(entry.company)}</span>
          <span class="location">${esc(entry.location)}</span>
        </div>
        ${renderRoles(entry.roles)}
      </div>
    `).join('')
  }

  const skillBullets = (data.skills?.skillsList || []).map(s => `<li>${esc(s)}</li>`).join('\n')
  const interestBullets = (data.skills?.interests || []).map(i => `<li>${esc(i)}</li>`).join('\n')
  const techTools = esc(data.skills?.technicalTools || '')

  const eduHtml = (data.education || []).map(edu => `
    <div class="entry">
      <div class="company-row">
        <span class="company">${esc(edu.school)}</span>
        <span class="location">${esc(edu.location)}</span>
      </div>
      <div class="role-row">
        <span class="role-title">${esc(edu.degree)}</span>
        <span class="dates">${esc(edu.dates)}</span>
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — Resume</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: Calibri, Arial, sans-serif;
  font-size: 10.5pt;
  color: #000;
  background: #fff;
  line-height: 1.35;
}
.toolbar {
  background: #f0f4ff;
  border-bottom: 1px solid #c5d0e6;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.print-btn {
  background: #1a56db;
  color: #fff;
  border: none;
  padding: 9px 20px;
  font-size: 13px;
  font-family: Calibri, Arial, sans-serif;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}
.print-btn:hover { background: #1344b0; }
.toolbar-note {
  font-size: 12px;
  color: #555;
  font-family: Calibri, Arial, sans-serif;
}
.page {
  max-width: 8.5in;
  margin: 0 auto;
  padding: 0.75in 1in;
}
.name {
  text-align: center;
  font-size: 20pt;
  font-weight: bold;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.contact {
  text-align: center;
  font-size: 10pt;
  margin-bottom: 14px;
}
.contact a { color: #000; }
.section-header {
  font-weight: bold;
  font-size: 10.5pt;
  text-transform: uppercase;
  border-bottom: 1.5px solid #000;
  margin-top: 14px;
  margin-bottom: 7px;
  padding-bottom: 1px;
  letter-spacing: 0.3px;
}
.entry { margin-bottom: 9px; }
.company-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.company { font-weight: bold; font-size: 10.5pt; }
.location { font-size: 10pt; }
.role-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.role-title { font-style: italic; font-weight: bold; font-size: 10.5pt; }
.dates { font-style: italic; font-size: 10pt; }
ul {
  margin-left: 20px;
  margin-top: 3px;
  list-style-type: disc;
}
li { margin-bottom: 2px; font-size: 10.5pt; line-height: 1.35; }
.skills-label { font-weight: bold; font-size: 10.5pt; margin-top: 6px; margin-bottom: 3px; }
.tech-tools { font-size: 10.5pt; }
@media print {
  .toolbar { display: none !important; }
  body { font-size: 10pt; }
  .page { padding: 0.6in 0.9in; }
  @page { size: letter; margin: 0; }
}
</style>
</head>
<body>

<div class="toolbar">
  <button class="print-btn" onclick="window.print()">🖨️ Print to PDF</button>
  <span class="toolbar-note">In the print dialog → change Destination to <strong>"Save as PDF"</strong> → click Save</span>
</div>

<div class="page">

  <div class="name">${name}</div>
  <div class="contact">
    ${location} | <a href="${linkedinUrl}">LinkedIn</a> | ${phone} | <a href="mailto:${email}">${email}</a>
  </div>

  <div class="section-header">Work Experience</div>
  ${renderEntries(data.workExperience)}

  <div class="section-header">Leadership Experience</div>
  ${renderEntries(data.leadershipExperience)}

  <div class="section-header">Education</div>
  ${eduHtml}

  <div class="section-header">Skills &amp; Interests</div>
  <div class="skills-label">Skills</div>
  <ul>${skillBullets}</ul>
  <div class="skills-label">Technical Tools:</div>
  <div class="tech-tools">${techTools}</div>
  <div class="skills-label">Interests</div>
  <ul>${interestBullets}</ul>

</div>
</body>
</html>`
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion prompts to help the user know what to paste
// ─────────────────────────────────────────────────────────────────────────────
const CONTEXT_SUGGESTIONS = [
  'Executive Assistant for a US-based startup CEO who needs calendar, inbox, and ops support',
  'Facebook Ads Specialist for a real estate company running lead generation campaigns',
  'Operations Manager for a growing e-commerce brand needing process and team coordination',
  'VA / Digital Marketing role for a personal brand or solopreneur',
  'Content Creator & Social Media Manager for a media or lifestyle brand',
  'CRM and Admin Support for a B2B sales or consulting firm',
]

export default function ResumeTailor() {
  const [jobContext, setJobContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [tailoredData, setTailoredData] = useState(null)
  const [tailoringNotes, setTailoringNotes] = useState('')
  const [error, setError] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  async function handleTailor() {
    if (!jobContext.trim()) {
      setError('Paste a job description, LinkedIn profile, or describe what the client needs.')
      return
    }
    setLoading(true)
    setError('')
    setTailoredData(null)
    setDownloaded(false)
    setPreviewHtml('')

    try {
      const profile = getProfile()
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'tailorResume',
          data: { jobContext, resumeData: FULL_RESUME_DATA },
          profile,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      // Parse JSON from Claude's response
      let raw = data.result.trim()
      raw = raw.replace(/^```json\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      const parsed = JSON.parse(raw)

      setTailoredData(parsed)
      setTailoringNotes(parsed.tailoringNotes || '')

      const profile2 = getProfile()
      const html = generateResumeHtml(parsed, profile2)
      setPreviewHtml(html)
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError('Claude returned an unexpected format. Please try again.')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeName = jobContext.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    a.href = url
    a.download = `absidi-resume-${safeName}.html`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  function handleReset() {
    setJobContext('')
    setTailoredData(null)
    setTailoringNotes('')
    setPreviewHtml('')
    setShowPreview(false)
    setDownloaded(false)
    setError('')
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h2 className="section-title">Resume Tailor</h2>
        <p className="section-subtitle">
          Paste a job description, LinkedIn profile, or describe what the client needs — Claude rewrites your bullet points to match, keeping your exact resume format.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: '📋', step: '1', label: 'Paste context', desc: 'Job description, LinkedIn, or describe the role' },
          { icon: '🤖', step: '2', label: 'Claude tailors it', desc: 'Rewrites bullets to match, keeps all jobs & dates' },
          { icon: '📄', step: '3', label: 'Download & print PDF', desc: 'Open in Chrome → Print → Save as PDF' },
        ].map(item => (
          <div key={item.step} className="card text-center py-4 px-3">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Step {item.step}</div>
            <div className="text-sm font-semibold text-gray-800">{item.label}</div>
            <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Input */}
      {!tailoredData && (
        <div className="card fade-in space-y-4">
          <div>
            <label className="label">Job Description / Client Context</label>
            <p className="text-xs text-gray-400 mb-3">
              Paste a full job description, a LinkedIn profile URL + description, or just describe what the client needs. The more detail, the better the tailoring.
            </p>
            <textarea
              className="textarea-field"
              rows={10}
              value={jobContext}
              onChange={e => { setJobContext(e.target.value); setError('') }}
              placeholder={`Paste the job description here...\n\nOr describe what they need, e.g.:\n"Looking for a VA who can manage calendar and inbox for a busy CEO, plus run Facebook Ads for their real estate business. They want someone reliable, experienced with CRMs, and can also create social media content."`}
            />
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setJobContext(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-brand-blue hover:text-brand-blue transition-all"
                >
                  {s.slice(0, 50)}...
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">~30–45 seconds to generate</p>
            <button
              onClick={handleTailor}
              disabled={loading || !jobContext.trim()}
              className="btn-primary min-w-[200px]"
            >
              {loading ? (
                <><span className="spinner border-white border-t-transparent" /> Tailoring resume...</>
              ) : (
                '🎯 Tailor My Resume'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card text-center py-10 fade-in">
          <div className="text-3xl mb-3">📄</div>
          <p className="font-semibold text-gray-800">Tailoring your resume...</p>
          <p className="text-sm text-gray-400 mt-2">Claude is reading the job context and rewriting your bullet points to match.</p>
          <div className="mt-4 flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-blue skeleton" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {tailoredData && !loading && (
        <div className="fade-in space-y-4">

          {/* Tailoring notes */}
          {tailoringNotes && (
            <div className="card border-green-200 bg-green-50">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="font-semibold text-green-800 text-sm mb-1">Resume tailored successfully</p>
                  <p className="text-sm text-green-700 leading-relaxed">{tailoringNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Your tailored resume is ready</p>
                <p className="text-xs text-gray-400 mt-1">
                  Download the HTML file → open in Chrome → click "Print to PDF" → Save as PDF
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={handleReset} className="btn-secondary text-xs">
                  🔄 Tailor for another role
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn-secondary text-xs"
                >
                  {showPreview ? '🙈 Hide preview' : '👁️ Preview'}
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-primary text-sm"
                >
                  {downloaded ? '✓ Downloaded!' : '⬇️ Download HTML'}
                </button>
              </div>
            </div>

            {/* Step by step PDF instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">To get a PDF:</p>
              <ol className="space-y-1 list-decimal pl-4 text-xs text-blue-700">
                <li>Click <strong>Download HTML</strong> above</li>
                <li>Open the downloaded file in <strong>Chrome</strong></li>
                <li>Click the blue <strong>"Print to PDF"</strong> button on the page</li>
                <li>In the print dialog → Destination → <strong>Save as PDF</strong> → Save</li>
              </ol>
            </div>
          </div>

          {/* Preview iframe */}
          {showPreview && previewHtml && (
            <div className="card p-0 overflow-hidden fade-in">
              <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-gray-400 text-xs ml-2">Resume Preview — {jobContext.slice(0, 60)}...</span>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full"
                style={{ height: '700px', border: 'none', background: '#fff' }}
                title="Tailored Resume Preview"
                sandbox="allow-scripts"
              />
            </div>
          )}
        </div>
      )}

    </div>
  )
}
