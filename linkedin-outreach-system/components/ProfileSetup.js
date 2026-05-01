import { useState, useEffect } from 'react'
import { getProfile, saveProfile, DEFAULT_PROFILE } from '../lib/storage'

export default function ProfileSetup({ onProfileSaved }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState('identity')
  const [newService, setNewService] = useState('')
  const [newTool, setNewTool] = useState('')

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
          <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500">Resume / Background Text</h3>
          <p className="text-sm text-gray-500">
            Paste your latest resume text here. Claude uses this as additional context when generating outreach that references your specific experience. Update it whenever you land a new client.
          </p>
          <textarea
            className="textarea-field font-mono text-xs"
            rows={20}
            value={profile.resumeText || ''}
            onChange={e => handleChange('resumeText', e.target.value)}
            placeholder="Paste your resume text here..."
          />
          <p className="text-xs text-gray-400 flex items-center gap-1">
            💡 Since your resume updates with new clients, just paste the latest version here and hit Save.
          </p>
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
