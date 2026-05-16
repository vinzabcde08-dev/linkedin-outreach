import { useState, useEffect } from 'react'
import { getApplications, addApplication, updateApplication, deleteApplication } from '../lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const APP_STATUSES = [
  { value: 'researching',         label: 'Researching',   color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  { value: 'applied',             label: 'Applied',       color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  { value: 'interview_scheduled', label: 'Interview Set', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'interviewed',         label: 'Interviewed',   color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { value: 'offer',               label: 'Offer',         color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  { value: 'rejected',            label: 'Rejected',      color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  { value: 'withdrawn',           label: 'Withdrawn',     color: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-300' },
]

const EMPTY_FORM = {
  company: '', role: '', salary: '', status: 'researching', notes: '',
  applicationLink: '', applicationEmail: '',
}

// ─────────────────────────────────────────────────────────────────────────────
// Employer Research Card (same format as ApplicationLetter)
// ─────────────────────────────────────────────────────────────────────────────
function EmployerResearchCard({ research }) {
  if (!research) return (
    <div className="text-center py-10 text-gray-400">
      <div className="text-3xl mb-2">🔍</div>
      <p className="text-sm">No employer research saved.</p>
      <p className="text-xs mt-1">Go to <strong>Application Letter</strong> → paste a job post → research runs automatically → click Save to Hub.</p>
    </div>
  )

  const confidenceColor = {
    high:   'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    low:    'text-red-600 bg-red-50 border-red-200',
  }[research.confidence] || 'text-gray-500 bg-gray-50 border-gray-200'

  const socialIcons = {
    linkedin:  { icon: '💼', label: 'LinkedIn' },
    facebook:  { icon: '📘', label: 'Facebook' },
    instagram: { icon: '📸', label: 'Instagram' },
    twitter:   { icon: '🐦', label: 'Twitter/X' },
    youtube:   { icon: '▶️',  label: 'YouTube' },
    tiktok:    { icon: '🎵', label: 'TikTok' },
  }
  const activeSocials = Object.entries(research.socials || {}).filter(([, v]) => v)

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {research.description && (
        <p className="text-sm text-gray-700 leading-relaxed">{research.description}</p>
      )}

      {research.website && (
        <div className="flex items-center gap-2">
          <span className="text-sm">🌐</span>
          <a href={research.website} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 underline text-sm hover:text-blue-800">{research.website}</a>
        </div>
      )}

      {activeSocials.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Social Media</p>
          <div className="flex flex-wrap gap-2">
            {activeSocials.map(([platform, url]) => {
              const meta = socialIcons[platform] || { icon: '🔗', label: platform }
              const href = url.startsWith('http') ? url : `https://${url}`
              return (
                <a key={platform} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-700 hover:border-brand-blue hover:text-brand-blue transition-all">
                  <span>{meta.icon}</span><span>{meta.label}</span>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {research.painPoints?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">🎯 Pain Points (what they need solved)</p>
          <ul className="space-y-1.5">
            {research.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {research.suggestedFixes?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">💡 What You Can Fix / Bring</p>
          <ul className="space-y-1.5">
            {research.suggestedFixes.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}

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

      {research.recentSignals && research.recentSignals !== 'No specific signals found' && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800">
          <span className="font-semibold">📡 Recent signals: </span>{research.recentSignals}
        </div>
      )}

      {research.notes && (
        <p className="text-xs text-gray-400 italic">{research.notes}</p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Application Checklist (with persistent checkbox state)
// ─────────────────────────────────────────────────────────────────────────────
function AppChecklist({ app, onChecklistChange }) {
  const parsed = app.parsedJob || {}
  const checked = app.checklistState || {}

  function toggle(key) {
    const next = { ...checked, [key]: !checked[key] }
    onChecklistChange(next)
  }

  const submissions = parsed.requiredSubmissions || []
  const questions   = parsed.questionsToAnswer   || []
  const total = submissions.length + questions.length
  const done  = Object.values(checked).filter(Boolean).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  if (!parsed.requiredSubmissions && !parsed.questionsToAnswer) {
    return (
      <div className="text-center py-10 text-gray-400">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">No checklist data saved.</p>
        <p className="text-xs mt-1">Save this application from <strong>Application Letter</strong> after analyzing a job post.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-bold text-orange-900 text-base">📋 How to Apply</h3>
          <p className="text-orange-700 text-xs mt-0.5">Complete every item below before submitting</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-2xl font-bold ${pct === 100 ? 'text-green-600' : 'text-orange-700'}`}>{pct}%</div>
          <div className="text-xs text-orange-600">{done}/{total} done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-orange-100 rounded-full h-2 mb-5">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Application link */}
      {(parsed.applicationLink || app.applicationLink) && (
        <div className="mb-4 p-3 bg-white border-2 border-orange-400 rounded-xl">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">🔗 Submit Your Application Here</p>
          <a href={parsed.applicationLink || app.applicationLink} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 underline text-sm font-semibold break-all hover:text-blue-800">
            {parsed.applicationLink || app.applicationLink}
          </a>
        </div>
      )}

      {(parsed.applicationEmail || app.applicationEmail) && !(parsed.applicationLink || app.applicationLink) && (
        <div className="mb-4 p-3 bg-white border-2 border-orange-400 rounded-xl">
          <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">📧 Send Application To</p>
          <a href={`mailto:${parsed.applicationEmail || app.applicationEmail}`}
            className="text-blue-600 underline text-sm font-semibold hover:text-blue-800">
            {parsed.applicationEmail || app.applicationEmail}
          </a>
        </div>
      )}

      {/* Deadline + Salary */}
      {(parsed.deadline || app.salary || parsed.salary) && (
        <div className="flex gap-3 mb-4 flex-wrap">
          {parsed.deadline && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs">
              <span>⏰</span>
              <span className="text-red-700 font-semibold">Deadline: {parsed.deadline}</span>
            </div>
          )}
          {(app.salary || parsed.salary) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs">
              <span>💰</span>
              <span className="text-green-700 font-semibold">{app.salary || parsed.salary}</span>
            </div>
          )}
        </div>
      )}

      {/* Required Submissions */}
      {submissions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Required Submissions</p>
          <div className="space-y-2">
            {submissions.map((sub, i) => {
              const key = `sub-${i}`
              return (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                  <div className={checked[key] ? 'opacity-50 line-through' : ''}>
                    <span className="text-sm font-semibold text-gray-800">{sub.item}</span>
                    {sub.notes && <span className="text-xs text-gray-500 ml-2">— {sub.notes}</span>}
                  </div>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Questions to Answer */}
      {questions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Questions to Answer</p>
          <div className="space-y-2">
            {questions.map((q, i) => {
              const key = `q-${i}`
              return (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!checked[key]} onChange={() => toggle(key)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0" />
                  <span className={`text-sm text-gray-700 ${checked[key] ? 'opacity-50 line-through' : ''}`}>{q}</span>
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
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function ApplicationsHub() {
  const [applications, setApplications] = useState([])
  const [showForm, setShowForm]         = useState(false)
  const [editId, setEditId]             = useState(null)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedRow, setExpandedRow]   = useState(null)
  const [expandedTab, setExpandedTab]   = useState({}) // appId → 'checklist'|'research'|'letter'|'jd'
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [copiedId, setCopiedId]         = useState(null)

  useEffect(() => {
    setApplications(getApplications())
  }, [])

  function refresh() {
    setApplications(getApplications())
  }

  function getTab(id) {
    return expandedTab[id] || 'checklist'
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleAddOrEdit() {
    if (!form.company.trim() && !form.role.trim()) return
    if (editId) {
      updateApplication(editId, form)
    } else {
      addApplication(form)
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditId(null)
    refresh()
  }

  function handleEdit(app) {
    setForm({ ...EMPTY_FORM, ...app })
    setEditId(app.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id) {
    deleteApplication(id)
    setConfirmDelete(null)
    refresh()
  }

  function handleStatusChange(id, newStatus) {
    const extra = newStatus === 'applied' ? { appliedAt: new Date().toISOString() } : {}
    updateApplication(id, { status: newStatus, ...extra })
    refresh()
  }

  function handleChecklistChange(appId, newState) {
    updateApplication(appId, { checklistState: newState })
    refresh()
  }

  function handleCopyLetter(id, text) {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2500)
    })
  }

  function getChecklistPct(app) {
    const parsed = app.parsedJob || {}
    const total = (parsed.requiredSubmissions?.length || 0) + (parsed.questionsToAnswer?.length || 0)
    if (total === 0) return null
    const done = Object.values(app.checklistState || {}).filter(Boolean).length
    return Math.round((done / total) * 100)
  }

  const getStatusStyle = (v) => APP_STATUSES.find(s => s.value === v) || APP_STATUSES[0]

  const filtered = applications
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => {
      if (!search) return true
      const s = search.toLowerCase()
      return (
        (a.company || '').toLowerCase().includes(s) ||
        (a.role    || '').toLowerCase().includes(s) ||
        (a.notes   || '').toLowerCase().includes(s)
      )
    })

  const stats = APP_STATUSES.reduce((acc, s) => {
    acc[s.value] = applications.filter(a => a.status === s.value).length
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="section-title">Applications Hub</h2>
          <p className="section-subtitle">Track every job application — employer research, how-to-apply checklist, cover letter, and job description in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(!showForm) }}
            className="btn-primary text-sm"
          >
            + Add Application
          </button>
        </div>
      </div>

      {/* Tip box */}
      <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
        <span className="text-lg flex-shrink-0">💡</span>
        <div>
          <span className="font-semibold">Best way to add:</span> Go to <strong>Application Letter</strong> → paste a job post → let Claude analyze it → click <strong>"💾 Save to Applications Hub"</strong>. All research, checklist, cover letter, and JD will be saved automatically.
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {APP_STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
            className={`p-2 rounded-lg text-center transition-all border ${
              filterStatus === s.value
                ? 'border-brand-blue bg-brand-blue-light'
                : 'border-gray-100 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-xl font-bold text-gray-900">{stats[s.value] || 0}</div>
            <div className="text-xs text-gray-500 leading-tight mt-0.5">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card mb-6 fade-in border-brand-blue border-2">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            {editId ? '✏️ Edit Application' : '➕ Add Application'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Company / Employer *</label>
              <input className="input-field" value={form.company} onChange={e => handleFormChange('company', e.target.value)} placeholder="Jaden Gasking Sports Media" />
            </div>
            <div>
              <label className="label">Role / Position *</label>
              <input className="input-field" value={form.role} onChange={e => handleFormChange('role', e.target.value)} placeholder="Social Media Manager" />
            </div>
            <div>
              <label className="label">Salary / Rate</label>
              <input className="input-field" value={form.salary} onChange={e => handleFormChange('salary', e.target.value)} placeholder="22,000–30,000 PHP/month" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => handleFormChange('status', e.target.value)}>
                {APP_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Application Link</label>
              <input className="input-field" value={form.applicationLink || ''} onChange={e => handleFormChange('applicationLink', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Application Email</label>
              <input className="input-field" type="email" value={form.applicationEmail || ''} onChange={e => handleFormChange('applicationEmail', e.target.value)} placeholder="apply@company.com" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes</label>
            <textarea className="textarea-field" rows={2} value={form.notes} onChange={e => handleFormChange('notes', e.target.value)} placeholder="Anything to remember about this application..." />
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={handleAddOrEdit} disabled={!form.company.trim() && !form.role.trim()} className="btn-primary">
              {editId ? '✓ Save Changes' : '+ Add Application'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="input-field flex-1 min-w-48"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by company, role, or notes..."
        />
        <select className="input-field w-44" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {APP_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Application list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="font-semibold text-gray-700 mb-1">No applications yet</h3>
          <p className="text-sm text-gray-400">Use the Application Letter tool to analyze a job post, then save it here with one click.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">+ Add Manually</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(app => {
            const statusStyle = getStatusStyle(app.status)
            const isExpanded  = expandedRow === app.id
            const activeTabKey = getTab(app.id)
            const pct = getChecklistPct(app)

            return (
              <div key={app.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">

                {/* Row header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : app.id)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(app.company || app.role || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Company + role */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{app.company || '(No company)'}</div>
                    <div className="text-xs text-gray-500 truncate">{app.role}{app.salary ? ` · ${app.salary}` : ''}</div>
                  </div>

                  {/* Checklist progress */}
                  {pct !== null && (
                    <div
                      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 cursor-pointer ${
                        pct === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}
                      onClick={e => { e.stopPropagation(); setExpandedRow(app.id); setExpandedTab(prev => ({ ...prev, [app.id]: 'checklist' })) }}
                      title="Click to view checklist"
                    >
                      {pct === 100 ? '✓' : '📋'} {pct}% done
                    </div>
                  )}

                  {/* Research badge */}
                  {app.employerResearch && (
                    <span className="hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex-shrink-0">
                      🏢 Researched
                    </span>
                  )}

                  {/* Cover letter badge */}
                  {app.coverLetter && (
                    <span className="hidden sm:inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium flex-shrink-0">
                      ✉️ Letter ready
                    </span>
                  )}

                  {/* Status dropdown */}
                  <select
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer flex-shrink-0 ${statusStyle.color}`}
                    value={app.status}
                    onChange={e => { e.stopPropagation(); handleStatusChange(app.id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                  >
                    {APP_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>

                  {/* Date */}
                  <div className="text-xs text-gray-400 hidden sm:block w-20 text-right flex-shrink-0">
                    {new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>

                  {/* Chevron */}
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 fade-in">

                    {/* Info strip */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-b border-gray-100">
                      {app.salary && (
                        <div>
                          <div className="font-medium text-gray-400 text-xs mb-1">Salary / Rate</div>
                          <div className="text-xs text-gray-700 font-semibold text-green-700">{app.salary}</div>
                        </div>
                      )}
                      {(app.applicationLink || app.parsedJob?.applicationLink) && (
                        <div>
                          <div className="font-medium text-gray-400 text-xs mb-1">Application Link</div>
                          <a href={app.applicationLink || app.parsedJob.applicationLink} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 text-xs underline hover:text-blue-800 truncate block"
                            onClick={e => e.stopPropagation()}>
                            {app.applicationLink || app.parsedJob.applicationLink}
                          </a>
                        </div>
                      )}
                      {app.appliedAt && (
                        <div>
                          <div className="font-medium text-gray-400 text-xs mb-1">Applied On</div>
                          <div className="text-xs text-gray-700">{new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                      )}
                      {app.notes && (
                        <div className="sm:col-span-2">
                          <div className="font-medium text-gray-400 text-xs mb-1">Notes</div>
                          <div className="text-xs text-gray-700 bg-yellow-50 border border-yellow-200 p-2 rounded-lg">{app.notes}</div>
                        </div>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="px-4 pt-3">
                      <div className="flex gap-1 mb-4 flex-wrap">
                        {[
                          { key: 'checklist', label: '📋 How to Apply',      badge: pct !== null ? `${pct}%` : null },
                          { key: 'research',  label: '🏢 Employer Research',  badge: app.employerResearch ? app.employerResearch.confidence : null },
                          { key: 'letter',    label: '✉️ Cover Letter',       badge: app.coverLetter ? 'Ready' : null },
                          { key: 'jd',        label: '📄 Job Description',    badge: app.jobDescription ? '✓' : null },
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={e => { e.stopPropagation(); setExpandedTab(prev => ({ ...prev, [app.id]: tab.key })) }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              activeTabKey === tab.key
                                ? 'bg-brand-blue text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {tab.label}
                            {tab.badge && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                activeTabKey === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* ── How to Apply tab ── */}
                      {activeTabKey === 'checklist' && (
                        <div className="pb-4" onClick={e => e.stopPropagation()}>
                          <AppChecklist
                            app={app}
                            onChecklistChange={(newState) => handleChecklistChange(app.id, newState)}
                          />
                        </div>
                      )}

                      {/* ── Employer Research tab ── */}
                      {activeTabKey === 'research' && (
                        <div className="pb-4" onClick={e => e.stopPropagation()}>
                          <EmployerResearchCard research={app.employerResearch} />
                        </div>
                      )}

                      {/* ── Cover Letter tab ── */}
                      {activeTabKey === 'letter' && (
                        <div className="pb-4" onClick={e => e.stopPropagation()}>
                          {app.coverLetter ? (
                            <div>
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <span className="text-xs text-gray-400 font-medium">
                                  Generated cover letter · saved {new Date(app.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <button
                                  onClick={() => handleCopyLetter(app.id, app.coverLetter)}
                                  className="text-xs text-brand-blue hover:underline font-medium"
                                >
                                  {copiedId === app.id ? '✓ Copied!' : '📋 Copy letter'}
                                </button>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-mono">
                                {app.coverLetter}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-10 text-gray-400">
                              <div className="text-3xl mb-2">✉️</div>
                              <p className="text-sm">No cover letter saved yet.</p>
                              <p className="text-xs mt-1">Go to <strong>Application Letter</strong> → generate a letter → Save to Hub.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Job Description tab ── */}
                      {activeTabKey === 'jd' && (
                        <div className="pb-4" onClick={e => e.stopPropagation()}>
                          {app.jobDescription ? (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-gray-400 font-medium">Original job post</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(app.jobDescription)}
                                  className="text-xs text-brand-blue hover:underline"
                                >
                                  📋 Copy
                                </button>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto font-mono">
                                {app.jobDescription}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-10 text-gray-400">
                              <div className="text-3xl mb-2">📄</div>
                              <p className="text-sm">No job description saved.</p>
                              <p className="text-xs mt-1">Save from <strong>Application Letter</strong> to capture the original job post.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom actions */}
                    <div className="flex gap-2 p-4 pt-2 border-t border-gray-100 flex-wrap">
                      <button onClick={e => { e.stopPropagation(); handleEdit(app) }} className="btn-secondary text-xs">
                        ✏️ Edit
                      </button>
                      {(app.applicationLink || app.parsedJob?.applicationLink) && (
                        <a
                          href={app.applicationLink || app.parsedJob.applicationLink}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          🔗 Apply Now
                        </a>
                      )}
                      {confirmDelete === app.id ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-red-600">Delete this application?</span>
                          <button onClick={() => handleDelete(app.id)} className="btn-danger text-xs py-1 px-2">Yes, delete</button>
                          <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-xs py-1 px-2">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmDelete(app.id) }}
                          className="btn-danger text-xs ml-auto"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-center">
        Showing {filtered.length} of {applications.length} applications · Data saved in your browser
      </div>
    </div>
  )
}
