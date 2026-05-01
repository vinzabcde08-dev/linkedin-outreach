import { useState, useEffect } from 'react'
import { getProfile, saveProfile, DEFAULT_PROFILE } from '../lib/storage'

function buildResumeHtml(profile) {
  const name = profile.fullName || 'Vinz Abcde V. Betonio'
  const location = profile.location || 'Tacurong City, Philippines'
  const email = profile.email || ''
  const phone = profile.phone || ''
  const website = profile.websiteUrl || ''
  const linkedin = profile.linkedinUrl || ''
  const services = (profile.services || []).join(' • ')
  const tools = (profile.tools || []).join(' • ')
  const resumeText = profile.resumeText || ''

  // Parse resume text sections
  function extractSection(text, heading) {
    const pattern = new RegExp(`${heading}[\\s\\S]*?(?=\\n[A-Z]{2,}|$)`, 'i')
    const match = text.match(pattern)
    return match ? match[0].replace(new RegExp(heading, 'i'), '').trim() : ''
  }

  const workExp = extractSection(resumeText, 'WORK EXPERIENCE')
  const leadershipExp = extractSection(resumeText, 'LEADERSHIP EXPERIENCE')
  const education = extractSection(resumeText, 'EDUCATION')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${name} — Resume</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1E0A05; background: #fff; font-size: 13px; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }
  .header { border-bottom: 3px solid #E05520; padding-bottom: 24px; margin-bottom: 28px; }
  .name { font-size: 28px; font-weight: 800; color: #1E0A05; letter-spacing: -0.5px; }
  .title { font-size: 13px; font-weight: 600; color: #E05520; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .contact { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }
  .contact a, .contact span { font-size: 12px; color: #555; text-decoration: none; }
  .contact a { color: #0D3E6A; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; color: #E05520; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #FDF0EC; }
  .entry { margin-bottom: 12px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .entry-role { font-weight: 700; font-size: 13px; color: #1E0A05; }
  .entry-company { font-weight: 600; color: #A8001E; }
  .entry-meta { font-size: 11px; color: #888; white-space: nowrap; }
  .entry-desc { font-size: 12px; color: #444; margin-top: 2px; }
  .tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .tag { background: #FDF0EC; color: #A8001E; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; }
  .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #bbb; }
  .brand-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #E05520; margin: 0 6px; vertical-align: middle; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 12px; color: #444; }
  @media print { body { font-size: 12px; } .page { padding: 32px 40px; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="name">${name}</div>
    <div class="title">${profile.title || 'Operations Lead | Executive Assistant | VA Company Founder'}</div>
    <div class="contact">
      ${location ? `<span>📍 ${location}</span>` : ''}
      ${phone ? `<span>📞 ${phone}</span>` : ''}
      ${email ? `<a href="mailto:${email}">✉️ ${email}</a>` : ''}
      ${website ? `<a href="${website}" target="_blank">🌐 ${website}</a>` : ''}
      ${linkedin ? `<a href="${linkedin}" target="_blank">💼 LinkedIn</a>` : ''}
    </div>
  </div>

  ${workExp ? `
  <div class="section">
    <div class="section-title">Work Experience</div>
    <pre>${workExp}</pre>
  </div>` : ''}

  ${leadershipExp ? `
  <div class="section">
    <div class="section-title">Leadership Experience</div>
    <pre>${leadershipExp}</pre>
  </div>` : ''}

  ${education ? `
  <div class="section">
    <div class="section-title">Education</div>
    <pre>${education}</pre>
  </div>` : ''}

  ${services ? `
  <div class="section">
    <div class="section-title">Services</div>
    <div style="font-size:12px;color:#444;line-height:1.8;">${services}</div>
  </div>` : ''}

  ${tools ? `
  <div class="section">
    <div class="section-title">Tools & Tech Stack</div>
    <div class="tags">${(profile.tools || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
  </div>` : ''}

  <div class="footer">
    ${website || 'adsidi.co'} <span class="brand-dot"></span> Built with Adsidi Multimedia Services
  </div>
</div>
</body>
</html>`
}

export default function ProfileSetup({ onProfileSaved }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('identity')
  const [newService, setNewService] = useState('')
  const [newTool, setNewTool] = useState('')
  const [resumeExported, setResumeExported] = useState(false)

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

  function handleExportResume() {
    const html = buildResumeHtml(profile)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeName = (profile.preferredName || 'absidi').toLowerCase().replace(/\s+/g, '-')
    a.href = url
    a.download = `${safeName}-resume.html`
    a.click()
    URL.revokeObjectURL(url)
    setResumeExported(true)
    setTimeout(() => setResumeExported(false), 3000)
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

  const SECTIONS = [
    { id: 'identity', label: 'Identity', icon: '🪪' },
    { id: 'voice',    label: 'Voice & Bio', icon: '🗣️' },
    { id: 'services', label: 'Services', icon: '⚙️' },
    { id: 'goals',    label: 'Goals & Targets', icon: '🎯' },
    { id: 'resume',   label: 'Resume Text', icon: '📄' },
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
          </button>
        ))}
      </div>

      {/* ── Identity ─────────────────────────────────────────── */}
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
            <p className="text-xs text-gray-400 mb-4">Claude will reference these URLs when prospects ask for your portfolio or website — in the Reply Handler, Outreach Generator, and Content Planner.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Company Website URL</label>
                <input
                  className="input-field"
                  type="url"
                  value={profile.websiteUrl || ''}
                  onChange={e => handleChange('websiteUrl', e.target.value)}
                  placeholder="https://adsidi.co"
                />
                <p className="text-xs text-gray-400 mt-1">Your main company site — used as the default reference.</p>
              </div>
              <div>
                <label className="label">Portfolio URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  className="input-field"
                  type="url"
                  value={profile.portfolioUrl || ''}
                  onChange={e => handleChange('portfolioUrl', e.target.value)}
                  placeholder="https://adsidi.co/portfolio"
                />
                <p className="text-xs text-gray-400 mt-1">If blank, Claude will use your website URL instead.</p>
              </div>
            </div>

            {/* Resume export */}
            <div className="mt-6 p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-orange-800">📄 Client-Facing Resume Export</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Downloads a clean HTML resume pre-filled from your profile — formatted for clients, not recruiters. Open in Chrome and print to PDF.
                  </p>
                </div>
                <button
                  onClick={handleExportResume}
                  className="btn-secondary text-xs flex-shrink-0 whitespace-nowrap"
                  style={{ borderColor: '#E05520', color: '#E05520' }}
                >
                  {resumeExported ? '✓ Downloaded!' : '⬇️ Export Resume HTML'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Voice & Bio ──────────────────────────────────────── */}
      {activeSection === 'voice' && (
        <div className="card fade-in space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Voice & Bio</h3>
          <div>
            <label className="label">Tone of Voice</label>
            <p className="text-xs text-gray-400 mb-2">Describe how you communicate. This shapes every AI-generated message.</p>
            <textarea
              className="textarea-field"
              rows={4}
              value={profile.toneOfVoice || ''}
              onChange={e => handleChange('toneOfVoice', e.target.value)}
              placeholder="e.g. Warm, confident, direct. I lead with value and keep things short. I never sound like a template..."
            />
          </div>
          <div>
            <label className="label">Professional Bio</label>
            <p className="text-xs text-gray-400 mb-2">Used as context for outreach and content generation. Write it in first person.</p>
            <textarea
              className="textarea-field"
              rows={8}
              value={profile.bio || ''}
              onChange={e => handleChange('bio', e.target.value)}
              placeholder="I'm Absidi, a Philippines-based Operations Lead and VA company founder..."
            />
          </div>
        </div>
      )}

      {/* ── Services & Tools ─────────────────────────────────── */}
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
              <input
                className="input-field flex-1"
                value={newService}
                onChange={e => setNewService(e.target.value)}
                placeholder="Add a service..."
                onKeyDown={e => e.key === 'Enter' && addService()}
              />
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
              <input
                className="input-field flex-1"
                value={newTool}
                onChange={e => setNewTool(e.target.value)}
                placeholder="Add a tool..."
                onKeyDown={e => e.key === 'Enter' && addTool()}
              />
              <button onClick={addTool} className="btn-secondary px-4">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Goals & Targets ──────────────────────────────────── */}
      {activeSection === 'goals' && (
        <div className="card fade-in space-y-5">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Goals & Target Clients</h3>
          <div>
            <label className="label">Target Clients</label>
            <p className="text-xs text-gray-400 mb-2">Who are you trying to reach on LinkedIn?</p>
            <textarea
              className="textarea-field"
              rows={5}
              value={profile.targetClients || ''}
              onChange={e => handleChange('targetClients', e.target.value)}
              placeholder="Founders, CEOs, and business owners who are overwhelmed and need a reliable right-hand person..."
            />
          </div>
          <div>
            <label className="label">LinkedIn Goal</label>
            <p className="text-xs text-gray-400 mb-2">What are you trying to achieve with LinkedIn outreach?</p>
            <textarea
              className="textarea-field"
              rows={4}
              value={profile.linkedinGoal || ''}
              onChange={e => handleChange('linkedinGoal', e.target.value)}
              placeholder="Grow client base, build personal brand as a Filipino entrepreneur and VA founder..."
            />
          </div>
        </div>
      )}

      {/* ── Resume Text ──────────────────────────────────────── */}
      {activeSection === 'resume' && (
        <div className="card fade-in space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Resume / Background Text</h3>
              <p className="text-sm text-gray-500 mt-1">
                Paste your latest resume text here. Claude uses this for outreach context. Update it whenever you land a new client or role.
              </p>
            </div>
            <button
              onClick={handleExportResume}
              className="btn-secondary text-xs flex-shrink-0 whitespace-nowrap"
              style={{ borderColor: '#E05520', color: '#E05520' }}
            >
              {resumeExported ? '✓ Downloaded!' : '⬇️ Export Client Resume'}
            </button>
          </div>
          <textarea
            className="textarea-field font-mono text-xs"
            rows={20}
            value={profile.resumeText || ''}
            onChange={e => handleChange('resumeText', e.target.value)}
            placeholder="Paste your resume text here..."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              💡 Paste the latest version whenever you land a new client. Hit Save after.
            </p>
            <p className="text-xs text-gray-400">
              {(profile.resumeText || '').length.toLocaleString()} characters
            </p>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
        <button onClick={handleReset} className="btn-danger text-xs">
          Reset to defaults
        </button>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1 fade-in">
              ✓ Saved
            </span>
          )}
          <button onClick={handleSave} className="btn-primary">
            💾 Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}
