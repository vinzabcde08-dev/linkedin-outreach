import { useState, useEffect, useRef } from 'react'
import {
  getProfile, saveProfile, DEFAULT_PROFILE,
  getUploadedResume, saveUploadedResume, clearUploadedResume,
} from '../lib/storage'
import { callClaude } from '../lib/api'

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
    script.onerror = () => reject(new Error('Failed to load PDF reader. Check your internet connection.'))
    document.head.appendChild(script)
  })
}

async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'pdf') {
    const pdfjsLib    = await loadPdfJs()
    const arrayBuffer = await file.arrayBuffer()
    const pdf         = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page    = await pdf.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map(item => item.str).join(' ') + '\n'
    }
    return text.trim()
  }
  if (ext === 'txt' || ext === 'text') return await file.text()
  throw new Error(`Unsupported file ".${ext}". Please upload a PDF or TXT file.`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileSetup({ onProfileSaved }) {
  const [profile, setProfile]           = useState(DEFAULT_PROFILE)
  const [saved, setSaved]               = useState(false)
  const [activeSection, setActiveSection] = useState('identity')
  const [newService, setNewService]     = useState('')
  const [newTool, setNewTool]           = useState('')

  // Resume upload state
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError]     = useState('')
  const [uploadedMeta, setUploadedMeta]   = useState(() => {
    const r = getUploadedResume()
    return r ? { uploadedAt: r._uploadedAt, entryCount: (r.workExperience?.length || 0) + (r.leadershipExperience?.length || 0) } : null
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const stored = getProfile()
    if (stored) setProfile(stored)
  }, [])

  function handleChange(field, value) {
    setProfile(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    if (onProfileSaved) onProfileSaved(profile)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleReset() {
    if (confirm('Reset profile to defaults? Your changes will be lost.')) {
      setProfile(DEFAULT_PROFILE)
      saveProfile(DEFAULT_PROFILE)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function addService() {
    if (newService.trim()) {
      handleChange('services', [...(profile.services || []), newService.trim()])
      setNewService('')
    }
  }

  function removeService(i) {
    handleChange('services', profile.services.filter((_, idx) => idx !== i))
  }

  function addTool() {
    if (newTool.trim()) {
      handleChange('tools', [...(profile.tools || []), newTool.trim()])
      setNewTool('')
    }
  }

  function removeTool(i) {
    handleChange('tools', profile.tools.filter((_, idx) => idx !== i))
  }

  // ── Resume upload ─────────────────────────────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadLoading(true)
    setUploadError('')

    try {
      const resumeText = await extractTextFromFile(file)
      if (!resumeText || resumeText.length < 100) {
        throw new Error('Could not extract enough text. Try a text-based PDF or a TXT file.')
      }

      // Send to Claude to parse into structured JSON
      let raw = (await callClaude('parseResume', { resumeText }, getProfile())).trim()
      raw = raw.replace(/^```json\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      raw = raw.replace(/^```\n?/, '').replace(/\n?```\s*$/, '').trim()
      const parsed = JSON.parse(raw)

      saveUploadedResume(parsed)
      const meta = {
        uploadedAt:  new Date().toISOString(),
        entryCount:  (parsed.workExperience?.length || 0) + (parsed.leadershipExperience?.length || 0),
        filename:    file.name,
      }
      setUploadedMeta(meta)
    } catch (e) {
      setUploadError(e instanceof SyntaxError ? 'Claude returned unexpected data — please try again.' : e.message)
    } finally {
      setUploadLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleClearResume() {
    if (confirm('Remove your uploaded resume? Tools will fall back to the built-in default.')) {
      clearUploadedResume()
      setUploadedMeta(null)
    }
  }

  const SECTIONS = [
    { id: 'identity', label: 'Identity',       icon: '🪪' },
    { id: 'voice',    label: 'Voice & Bio',    icon: '🗣️' },
    { id: 'services', label: 'Services',       icon: '⚙️' },
    { id: 'goals',    label: 'Goals & Targets',icon: '🎯' },
    { id: 'resume',   label: 'Upload Resume',  icon: '📄' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Profile Setup</h2>
        <p className="section-subtitle">
          Your profile powers every AI output. Keep it up to date so messages always sound like you.
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === s.id
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {s.icon} {s.label}
            {s.id === 'resume' && uploadedMeta && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-green-400 inline-block" />
            )}
          </button>
        ))}
      </div>

      {/* ── Identity ───────────────────────────────────────────────────── */}
      {activeSection === 'identity' && (
        <div className="card fade-in space-y-5">
          <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide text-gray-500">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input-field" value={profile.fullName || ''} onChange={e => handleChange('fullName', e.target.value)} placeholder="Vinz Abcde V. Betonio" />
            </div>
            <div>
              <label className="label">Preferred / Brand Name</label>
              <input className="input-field" value={profile.preferredName || ''} onChange={e => handleChange('preferredName', e.target.value)} placeholder="Absidi" />
            </div>
            <div>
              <label className="label">Professional Title</label>
              <input className="input-field" value={profile.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Operations Lead | EA | VA Founder" />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input-field" value={profile.company || ''} onChange={e => handleChange('company', e.target.value)} placeholder="Adsidi Multimedia Services" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input-field" value={profile.location || ''} onChange={e => handleChange('location', e.target.value)} placeholder="Tacurong City, Philippines" />
            </div>
            <div>
              <label className="label">Timezone</label>
              <input className="input-field" value={profile.timezone || ''} onChange={e => handleChange('timezone', e.target.value)} placeholder="Asia/Manila (PHT, UTC+8)" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" value={profile.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="vinzabcde08@gmail.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" value={profile.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="+63 968 266 7221" />
            </div>
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input className="input-field" value={profile.linkedinUrl || ''} onChange={e => handleChange('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/your-profile" />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">Website & Portfolio</h3>
            <p className="text-xs text-gray-400 mb-4">Claude references these URLs when prospects ask for your portfolio — in Outreach Generator, Reply Handler, and Content Studio.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Company Website URL</label>
                <input className="input-field" type="url" value={profile.websiteUrl || ''} onChange={e => handleChange('websiteUrl', e.target.value)} placeholder="https://adsidi.co" />
                <p className="text-xs text-gray-400 mt-1">Your main site — used as default reference.</p>
              </div>
              <div>
                <label className="label">Portfolio URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input className="input-field" type="url" value={profile.portfolioUrl || ''} onChange={e => handleChange('portfolioUrl', e.target.value)} placeholder="https://adsidi.co/portfolio" />
                <p className="text-xs text-gray-400 mt-1">If blank, Claude uses your website URL instead.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Voice & Bio ────────────────────────────────────────────────── */}
      {activeSection === 'voice' && (
        <div className="card fade-in space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Voice & Bio</h3>
          <div>
            <label className="label">Tone of Voice</label>
            <p className="text-xs text-gray-400 mb-2">Describe how you communicate. This shapes every AI-generated message.</p>
            <textarea className="textarea-field" rows={4} value={profile.toneOfVoice || ''} onChange={e => handleChange('toneOfVoice', e.target.value)} placeholder="e.g. Warm, confident, direct. I lead with value and keep things short. I never sound like a template..." />
          </div>
          <div>
            <label className="label">Professional Bio</label>
            <p className="text-xs text-gray-400 mb-2">Used as context for outreach and content generation. Write it in first person.</p>
            <textarea className="textarea-field" rows={8} value={profile.bio || ''} onChange={e => handleChange('bio', e.target.value)} placeholder="I'm Absidi, a Philippines-based Operations Lead and VA company founder..." />
          </div>
        </div>
      )}

      {/* ── Services & Tools ───────────────────────────────────────────── */}
      {activeSection === 'services' && (
        <div className="card fade-in space-y-6">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">Services Offered</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile.services || []).map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-light text-brand-blue text-xs font-medium rounded-full">
                  {s}
                  <button onClick={() => removeService(i)} className="hover:text-red-500 transition-colors">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" value={newService} onChange={e => setNewService(e.target.value)} placeholder="Add a service..." onKeyDown={e => e.key === 'Enter' && addService()} />
              <button onClick={addService} className="btn-secondary px-4">Add</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">Tools & Tech Stack</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {(profile.tools || []).map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  {t}
                  <button onClick={() => removeTool(i)} className="hover:text-red-500 transition-colors">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field flex-1" value={newTool} onChange={e => setNewTool(e.target.value)} placeholder="Add a tool..." onKeyDown={e => e.key === 'Enter' && addTool()} />
              <button onClick={addTool} className="btn-secondary px-4">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Goals & Targets ────────────────────────────────────────────── */}
      {activeSection === 'goals' && (
        <div className="card fade-in space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Goals & Target Clients</h3>
          <div>
            <label className="label">Target Clients</label>
            <p className="text-xs text-gray-400 mb-2">Who are you trying to reach on LinkedIn?</p>
            <textarea className="textarea-field" rows={5} value={profile.targetClients || ''} onChange={e => handleChange('targetClients', e.target.value)} placeholder="Founders, CEOs, and business owners who are overwhelmed and need a reliable right-hand person..." />
          </div>
          <div>
            <label className="label">LinkedIn Goal</label>
            <p className="text-xs text-gray-400 mb-2">What are you trying to achieve with LinkedIn outreach?</p>
            <textarea className="textarea-field" rows={4} value={profile.linkedinGoal || ''} onChange={e => handleChange('linkedinGoal', e.target.value)} placeholder="Grow client base, build personal brand as a Filipino entrepreneur and VA founder..." />
          </div>
        </div>
      )}

      {/* ── Upload Resume ───────────────────────────────────────────────── */}
      {activeSection === 'resume' && (
        <div className="fade-in space-y-4">

          {/* Status card */}
          <div className={`card ${uploadedMeta ? 'border-green-200 bg-green-50' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                {uploadedMeta ? (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600 text-lg">✅</span>
                      <p className="font-semibold text-green-800 text-sm">Resume uploaded &amp; ready</p>
                    </div>
                    <p className="text-xs text-green-700">
                      {uploadedMeta.entryCount} companies detected ·
                      Uploaded {new Date(uploadedMeta.uploadedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {uploadedMeta.filename ? ` · ${uploadedMeta.filename}` : ''}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Resume Tailor and Application Letter are now using this resume.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800 text-sm">No resume uploaded yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Resume Tailor and Application Letter are using the built-in default resume. Upload yours to use your latest version.
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {uploadedMeta && (
                  <button onClick={handleClearResume} className="btn-secondary text-xs" style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                    🗑️ Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Upload card */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 text-sm mb-1">
              {uploadedMeta ? '🔄 Update Resume' : '📁 Upload Your Resume'}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Upload your latest resume as a <strong>PDF</strong> or <strong>TXT</strong> file. Claude will read it and store the structured data — all tools will use it automatically.
            </p>

            <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-all p-8 text-center
              ${uploadLoading ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-brand-blue hover:bg-gray-50'}`}
            >
              {uploadLoading ? (
                <>
                  <span className="spinner border-blue-500 border-t-transparent w-8 h-8 mb-3" />
                  <p className="text-sm font-medium text-blue-700">Reading &amp; parsing your resume...</p>
                  <p className="text-xs text-blue-500 mt-1">Claude is extracting your experience, skills, and education (~20–30 seconds)</p>
                </>
              ) : (
                <>
                  <span className="text-4xl mb-3">📄</span>
                  <p className="text-sm font-semibold text-gray-700">Click to upload your resume</p>
                  <p className="text-xs text-gray-400 mt-1">PDF or TXT · Max recommended: 5 pages</p>
                </>
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

            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠️ {uploadError}
              </div>
            )}

            {/* What happens after upload */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-600">What happens when you upload:</p>
              <p>1. Claude reads the text from your PDF</p>
              <p>2. It extracts all jobs, companies, dates, and bullet points</p>
              <p>3. The structured data is saved locally in your browser</p>
              <p>4. Every tool (Resume Tailor, Application Letter) will automatically use your resume from this point forward</p>
            </div>
          </div>

          {/* What's stored preview */}
          {uploadedMeta && (
            <div className="card bg-gray-50 border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3">📋 What's stored from your resume:</p>
              {(() => {
                const r = getUploadedResume()
                if (!r) return null
                return (
                  <div className="space-y-2">
                    {(r.workExperience || []).map((e, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium">{e.company}</span>
                        <span className="text-gray-400 ml-1">— {(e.roles || []).map(r => r.title).join(', ')}</span>
                      </div>
                    ))}
                    {(r.leadershipExperience || []).map((e, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium">{e.company}</span>
                        <span className="text-gray-400 ml-1">— {(e.roles || []).map(r => r.title).join(', ')}</span>
                        <span className="ml-1 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">leadership</span>
                      </div>
                    ))}
                    {r.education?.map((e, i) => (
                      <div key={i} className="text-xs text-gray-600">
                        <span className="font-medium">{e.school}</span>
                        <span className="text-gray-400 ml-1">— {e.degree}</span>
                        <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">education</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <button onClick={handleReset} className="btn-danger text-xs">Reset to defaults</button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1 fade-in">✓ Saved</span>
          )}
          <button onClick={handleSave} className="btn-primary">💾 Save Profile</button>
        </div>
      </div>
    </div>
  )
}
