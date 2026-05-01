import { useState, useRef } from 'react'
import {
  getProfile,
  FULL_RESUME_DATA,
  getUploadedResume,
  saveUploadedResume,
  clearUploadedResume,
} from '../lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// PDF.js text extraction (loaded dynamically from CDN)
// ─────────────────────────────────────────────────────────────────────────────
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      resolve(window.pdfjsLib)
    }
    script.onerror = () => reject(new Error('Failed to load PDF reader library.'))
    document.head.appendChild(script)
  })
}

async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'pdf') {
    const pdfjsLib = await loadPdfJs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    let text = ''
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      // Reconstruct lines by grouping items with similar Y positions
      const items = content.items
      text += items.map(item => item.str).join(' ') + '\n'
    }
    return text.trim()
  }

  if (ext === 'txt' || ext === 'text') {
    return await file.text()
  }

  throw new Error(`Unsupported file type ".${ext}". Please upload a PDF or TXT file.`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume HTML generator — exact PDF-matching format
// ─────────────────────────────────────────────────────────────────────────────
function generateResumeHtml(data, profile) {
  const name        = (profile?.fullName || 'VINZ ABCDE V. BETONIO').toUpperCase()
  const phone       = profile?.phone    || '+63 968 266 7221'
  const email       = profile?.email    || 'vinzabcde08@gmail.com'
  const location    = 'Tacurong City, Philippines'

  // Ensure LinkedIn URL has https:// prefix
  const rawLinkedin = profile?.linkedinUrl || ''
  const linkedinUrl = rawLinkedin
    ? (rawLinkedin.startsWith('http') ? rawLinkedin : `https://${rawLinkedin}`)
    : ''

  function esc(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function renderBullets(bullets) {
    if (!bullets || !bullets.length) return ''
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

  const skillBullets    = (data.skills?.skillsList || []).map(s => `<li>${esc(s)}</li>`).join('\n')
  const interestBullets = (data.skills?.interests  || []).map(i => `<li>${esc(i)}</li>`).join('\n')
  const techTools       = esc(data.skills?.technicalTools || '')

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

  // Contact line — only include LinkedIn if URL is set
  const linkedinPart = linkedinUrl
    ? `| <a href="${linkedinUrl}" target="_blank" rel="noopener">LinkedIn</a> `
    : ''

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
  padding: 9px 22px;
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
    ${location} ${linkedinPart}| ${phone} | <a href="mailto:${email}">${email}</a>
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
// Quick examples for the job context input
// ─────────────────────────────────────────────────────────────────────────────
const CONTEXT_SUGGESTIONS = [
  'Executive Assistant for a US-based startup CEO who needs calendar, inbox, and ops support',
  'Facebook Ads Specialist for a real estate company running lead generation campaigns',
  'Operations Manager for a growing e-commerce brand needing process and team coordination',
  'VA / Digital Marketing role for a personal brand or solopreneur',
  'Content Creator & Social Media Manager for a media or lifestyle brand',
  'CRM and Admin Support for a B2B sales or consulting firm',
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ResumeTailor() {
  // Resume upload state
  const [uploadLoading, setUploadLoading]   = useState(false)
  const [uploadError, setUploadError]       = useState('')
  const [uploadedMeta, setUploadedMeta]     = useState(() => {
    const r = getUploadedResume()
    return r ? { uploadedAt: r._uploadedAt } : null
  })
  const fileInputRef = useRef(null)

  // Tailor state
  const [jobContext, setJobContext]         = useState('')
  const [loading, setLoading]               = useState(false)
  const [tailoredData, setTailoredData]     = useState(null)
  const [tailoringNotes, setTailoringNotes] = useState('')
  const [error, setError]                   = useState('')
  const [previewHtml, setPreviewHtml]       = useState('')
  const [showPreview, setShowPreview]       = useState(false)
  const [downloaded, setDownloaded]         = useState(false)

  // ── Resume upload ─────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    setUploadError('')

    try {
      // Step 1: Extract text from PDF or TXT
      const resumeText = await extractTextFromFile(file)
      if (!resumeText || resumeText.length < 100) {
        throw new Error('Could not extract enough text from this file. Try a text-based PDF or paste as TXT.')
      }

      // Step 2: Ask Claude to parse it into structured JSON
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'parseResume',
          data: { resumeText },
          profile: getProfile(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse resume.')

      // Step 3: Parse JSON from Claude's response
      let raw = data.result.trim()
      raw = raw.replace(/^```json\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      // Sometimes Claude wraps in just ``` without json
      raw = raw.replace(/^```\n?/, '').replace(/\n?```\s*$/, '').trim()
      const parsed = JSON.parse(raw)

      // Step 4: Save to localStorage
      saveUploadedResume(parsed)
      setUploadedMeta({ uploadedAt: new Date().toISOString() })
    } catch (e) {
      if (e instanceof SyntaxError) {
        setUploadError('Claude returned unexpected data — please try again.')
      } else {
        setUploadError(e.message)
      }
    } finally {
      setUploadLoading(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleClearUploadedResume() {
    clearUploadedResume()
    setUploadedMeta(null)
  }

  // ── Tailor resume ─────────────────────────────────────────────────────────
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
      // Use uploaded resume if available, else fall back to built-in FULL_RESUME_DATA
      const baseResume = getUploadedResume() || FULL_RESUME_DATA

      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'tailorResume',
          data: { jobContext, resumeData: baseResume },
          profile,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      let raw = data.result.trim()
      raw = raw.replace(/^```json\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      raw = raw.replace(/^```\n?/, '').replace(/\n?```\s*$/, '').trim()
      const parsed = JSON.parse(raw)

      setTailoredData(parsed)
      setTailoringNotes(parsed.tailoringNotes || '')

      const html = generateResumeHtml(parsed, getProfile())
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
    const blob     = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    const safeName = jobContext.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    a.href         = url
    a.download     = `absidi-resume-${safeName}.html`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  // Opens in a new tab so the print button works without iframe restrictions
  function handleOpenInTab() {
    if (!previewHtml) return
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    window.open(url, '_blank')
    // Revoke after a moment to allow the tab to load
    setTimeout(() => URL.revokeObjectURL(url), 10000)
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

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="section-title">Resume Tailor</h2>
        <p className="section-subtitle">
          Paste a job description, LinkedIn profile, or describe what the client needs — Claude rewrites your bullet points to match, keeping your exact resume format.
        </p>
      </div>

      {/* ── Base Resume Upload ───────────────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Base Resume</p>
            {uploadedMeta ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-green-600 text-xs font-medium">✅ Using your uploaded resume</span>
                <span className="text-gray-400 text-xs">
                  (parsed {new Date(uploadedMeta.uploadedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })})
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Using built-in resume data · Upload yours to override</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {uploadedMeta && (
              <button
                onClick={handleClearUploadedResume}
                className="btn-secondary text-xs text-red-500 border-red-200 hover:border-red-400"
              >
                🗑️ Remove
              </button>
            )}
            <label className="btn-secondary text-xs cursor-pointer">
              {uploadLoading ? (
                <><span className="spinner border-gray-500 border-t-transparent w-3 h-3" /> Parsing...</>
              ) : (
                <>📁 {uploadedMeta ? 'Re-upload Resume' : 'Upload Resume'}</>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.text"
                onChange={handleFileChange}
                disabled={uploadLoading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {uploadLoading && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <span className="spinner border-blue-500 border-t-transparent w-3 h-3" />
              Extracting text from your resume → sending to Claude to parse... (~15–30 seconds)
            </div>
          </div>
        )}

        {uploadError && (
          <p className="mt-3 text-red-500 text-xs">{uploadError}</p>
        )}

        {!uploadLoading && !uploadError && (
          <p className="text-xs text-gray-400 mt-2">
            Accepts <strong>PDF</strong> or <strong>TXT</strong> · Claude will read your resume and structure it for tailoring
          </p>
        )}
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: '📋', step: '1', label: 'Paste context', desc: 'Job description, LinkedIn, or describe the role' },
          { icon: '🤖', step: '2', label: 'Claude tailors it', desc: 'Rewrites bullets to match, keeps all jobs & dates' },
          { icon: '📄', step: '3', label: 'Print to PDF', desc: 'Open in new tab → click Print → Save as PDF' },
        ].map(item => (
          <div key={item.step} className="card text-center py-4 px-3">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Step {item.step}</div>
            <div className="text-sm font-semibold text-gray-800">{item.label}</div>
            <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Job Context Input ────────────────────────────────────────────── */}
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
              placeholder={`Paste the job description here...\n\nOr describe what they need, e.g.:\n"Looking for a VA who can manage calendar and inbox for a busy CEO, plus run Facebook Ads for their real estate business."`}
            />
          </div>

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

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="card text-center py-10 fade-in">
          <div className="text-3xl mb-3">📄</div>
          <p className="font-semibold text-gray-800">Tailoring your resume...</p>
          <p className="text-sm text-gray-400 mt-2">
            Claude is reading the job context and rewriting your bullet points to match.
          </p>
          <div className="mt-4 flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-blue skeleton" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Result ───────────────────────────────────────────────────────── */}
      {tailoredData && !loading && (
        <div className="fade-in space-y-4">

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

          <div className="card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Your tailored resume is ready</p>
                <p className="text-xs text-gray-400 mt-1">
                  Click "Open &amp; Print" to open in a new tab, then use the blue Print button inside.
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
                  onClick={handleOpenInTab}
                  className="btn-primary text-sm"
                  style={{ background: '#1a56db' }}
                >
                  🖨️ Open &amp; Print
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-secondary text-xs"
                >
                  {downloaded ? '✓ Downloaded!' : '⬇️ Download HTML'}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-semibold mb-1">To save as PDF:</p>
              <ol className="space-y-1 list-decimal pl-4 text-xs text-blue-700">
                <li>Click <strong>"Open &amp; Print"</strong> above — it opens your resume in a new browser tab</li>
                <li>Click the blue <strong>"Print to PDF"</strong> button inside that tab</li>
                <li>In the print dialog → Destination → <strong>Save as PDF</strong> → Save</li>
              </ol>
            </div>
          </div>

          {/* Preview iframe — allow-modals enables window.print(); allow-popups enables links */}
          {showPreview && previewHtml && (
            <div className="card p-0 overflow-hidden fade-in">
              <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-gray-400 text-xs ml-2">
                  Resume Preview — {jobContext.slice(0, 60)}{jobContext.length > 60 ? '...' : ''}
                </span>
                <button
                  onClick={handleOpenInTab}
                  className="ml-auto text-xs text-blue-300 hover:text-blue-100 transition-colors"
                >
                  ↗ Open in new tab to print
                </button>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full"
                style={{ height: '700px', border: 'none', background: '#fff' }}
                title="Tailored Resume Preview"
                sandbox="allow-scripts allow-modals allow-popups allow-same-origin"
              />
            </div>
          )}

        </div>
      )}

    </div>
  )
}
