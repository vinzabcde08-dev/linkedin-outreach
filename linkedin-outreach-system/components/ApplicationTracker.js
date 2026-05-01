import { useState, useEffect } from 'react'
import {
  getProspects, addProspect, updateProspect, deleteProspect,
  markStepSent, markStepUnsent, addConversationEntry, deleteConversationEntry,
  exportAllData, importData,
} from '../lib/storage'

const STATUSES = [
  { value: 'identified',    label: 'Identified',    color: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
  { value: 'connected',     label: 'Connected',     color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500' },
  { value: 'dm_sent',       label: 'DM Sent',       color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'replied',       label: 'Replied',       color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  { value: 'call_booked',   label: 'Call Booked',   color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'proposal_sent', label: 'Proposal Sent', color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'closed_won',    label: 'Closed Won',    color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  { value: 'closed_lost',   label: 'Closed Lost',   color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
  { value: 'nurture',       label: 'Nurturing',     color: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
]

const SEQUENCE_STEPS = [
  { key: 'connection', label: 'Connection Request', icon: '🤝', tip: 'Send first' },
  { key: 'firstDm',    label: 'First DM',           icon: '💬', tip: 'Within 24h of accept' },
  { key: 'followUp1',  label: 'Follow-Up 1',        icon: '🔁', tip: 'Day 3 — no reply' },
  { key: 'followUp2',  label: 'Follow-Up 2',        icon: '🔁', tip: 'Day 7 — no reply' },
  { key: 'followUp3',  label: 'Follow-Up 3',        icon: '🔁', tip: 'Day 14 — final' },
]

const EMPTY_FORM = {
  name: '', company: '', title: '', linkedinUrl: '',
  status: 'identified', lastMessage: '', nextAction: '', notes: '', email: '',
}

export default function ApplicationTracker() {
  const [prospects, setProspects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [expandedRow, setExpandedRow] = useState(null)
  const [expandedTab, setExpandedTab] = useState({}) // prospectId → 'sequence' | 'log'
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedStep, setExpandedStep] = useState({}) // prospectId_stepKey → bool

  // Conversation log inputs
  const [logInput, setLogInput] = useState({}) // prospectId_type → text
  const [showLogInput, setShowLogInput] = useState({}) // prospectId → 'received' | 'note' | null

  useEffect(() => {
    setProspects(getProspects())
  }, [])

  function refresh() {
    setProspects(getProspects())
  }

  function handleFormChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleAddOrEdit() {
    if (!form.name.trim()) return
    if (editId) {
      updateProspect(editId, form)
    } else {
      addProspect(form)
    }
    setForm(EMPTY_FORM)
    setShowForm(false)
    setEditId(null)
    refresh()
  }

  function handleEdit(prospect) {
    setForm({ ...EMPTY_FORM, ...prospect })
    setEditId(prospect.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleDelete(id) {
    deleteProspect(id)
    setConfirmDelete(null)
    refresh()
  }

  function handleStatusChange(id, newStatus) {
    updateProspect(id, { status: newStatus })
    refresh()
  }

  function handleToggleStep(prospectId, stepKey, currentStatus) {
    if (currentStatus === 'sent') {
      markStepUnsent(prospectId, stepKey)
    } else {
      markStepSent(prospectId, stepKey)
      // Also auto-add a conversation log entry if there's message text
      const prospect = getProspects().find(p => p.id === prospectId)
      const seq = prospect?.outreachSequence || {}
      const stepLabel = SEQUENCE_STEPS.find(s => s.key === stepKey)?.label || stepKey
      if (seq[stepKey]?.text) {
        addConversationEntry(prospectId, 'sent', `[${stepLabel}]\n${seq[stepKey].text}`)
      }
    }
    refresh()
  }

  function handleAddLogEntry(prospectId, type) {
    const key = `${prospectId}_${type}`
    const text = (logInput[key] || '').trim()
    if (!text) return
    addConversationEntry(prospectId, type, text)
    setLogInput(prev => ({ ...prev, [key]: '' }))
    setShowLogInput(prev => ({ ...prev, [prospectId]: null }))
    refresh()
  }

  function handleDeleteLogEntry(prospectId, entryId) {
    deleteConversationEntry(prospectId, entryId)
    refresh()
  }

  function getTabForProspect(id) {
    return expandedTab[id] || 'sequence'
  }

  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `absidi-outreach-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        importData(data)
        refresh()
        alert('Data imported successfully!')
      } catch {
        alert('Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  function exportCSV() {
    const headers = ['Name', 'Company', 'Title', 'LinkedIn', 'Email', 'Status', 'Last Message', 'Next Action', 'Notes', 'Created', 'Updated']
    const rows = prospects.map(p => [
      p.name, p.company, p.title, p.linkedinUrl, p.email,
      STATUSES.find(s => s.value === p.status)?.label || p.status,
      p.lastMessage, p.nextAction, p.notes,
      new Date(p.createdAt).toLocaleDateString(),
      new Date(p.updatedAt).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `absidi-prospects-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  function getSequenceProgress(seq) {
    if (!seq) return { sent: 0, total: 0, hasSaved: false }
    const saved = SEQUENCE_STEPS.filter(s => seq[s.key]?.text)
    const sent = SEQUENCE_STEPS.filter(s => seq[s.key]?.status === 'sent')
    return { sent: sent.length, total: saved.length, hasSaved: saved.length > 0 }
  }

  // Filter + sort
  const filtered = prospects
    .filter(p => filterStatus === 'all' || p.status === filterStatus)
    .filter(p => {
      if (!search) return true
      const s = search.toLowerCase()
      return (
        (p.name || '').toLowerCase().includes(s) ||
        (p.company || '').toLowerCase().includes(s) ||
        (p.notes || '').toLowerCase().includes(s)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'updatedAt') return new Date(b.updatedAt) - new Date(a.updatedAt)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '')
      return 0
    })

  const stats = STATUSES.reduce((acc, s) => {
    acc[s.value] = prospects.filter(p => p.status === s.value).length
    return acc
  }, {})

  const getStatusStyle = (statusValue) => STATUSES.find(s => s.value === statusValue) || STATUSES[0]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="section-title">Application Tracker</h2>
          <p className="section-subtitle">Track every prospect — outreach sequence, conversations, status, and next actions.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn-secondary text-xs">📊 Export CSV</button>
          <button onClick={handleExport} className="btn-secondary text-xs">💾 Export JSON</button>
          <label className="btn-secondary text-xs cursor-pointer">
            📂 Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(!showForm) }}
            className="btn-primary text-sm"
          >
            + Add Prospect
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 mb-6">
        {STATUSES.map(s => (
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
            {editId ? '✏️ Edit Prospect' : '➕ Add New Prospect'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Name *</label>
              <input className="input-field" value={form.name} onChange={e => handleFormChange('name', e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input-field" value={form.company} onChange={e => handleFormChange('company', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input-field" value={form.title} onChange={e => handleFormChange('title', e.target.value)} placeholder="CEO, Operations Manager..." />
            </div>
            <div>
              <label className="label">LinkedIn URL</label>
              <input className="input-field" value={form.linkedinUrl} onChange={e => handleFormChange('linkedinUrl', e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={e => handleFormChange('email', e.target.value)} placeholder="john@acme.com" />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={e => handleFormChange('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label">Last Message Sent</label>
              <textarea className="textarea-field" rows={3} value={form.lastMessage} onChange={e => handleFormChange('lastMessage', e.target.value)} placeholder="What was the last thing you sent?" />
            </div>
            <div>
              <label className="label">Next Action</label>
              <textarea className="textarea-field" rows={3} value={form.nextAction} onChange={e => handleFormChange('nextAction', e.target.value)} placeholder="What's the next step? By when?" />
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Notes</label>
            <textarea className="textarea-field" rows={2} value={form.notes} onChange={e => handleFormChange('notes', e.target.value)} placeholder="Anything else to remember..." />
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button onClick={handleAddOrEdit} disabled={!form.name.trim()} className="btn-primary">
              {editId ? '✓ Save Changes' : '+ Add Prospect'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM) }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Search and filter bar */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="input-field flex-1 min-w-48"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search by name, company, or notes..."
        />
        <select className="input-field w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="input-field w-36" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="updatedAt">Recently updated</option>
          <option value="name">Name A–Z</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Prospect list */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="font-semibold text-gray-700 mb-1">No prospects yet</h3>
          <p className="text-sm text-gray-400">Add your first prospect or generate an outreach sequence and save it here.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">+ Add First Prospect</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const statusStyle = getStatusStyle(p.status)
            const isExpanded = expandedRow === p.id
            const { sent, total, hasSaved } = getSequenceProgress(p.outreachSequence)
            const activeTabKey = getTabForProspect(p.id)
            const convLog = p.conversationLog || []
            const seq = p.outreachSequence || {}

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Row header */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-navy-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(p.name || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Name + company */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 truncate">{p.title}{p.company ? ` · ${p.company}` : ''}</div>
                  </div>

                  {/* Sequence progress pill */}
                  {hasSaved && (
                    <div
                      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        sent === total ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                      onClick={e => {
                        e.stopPropagation()
                        setExpandedRow(p.id)
                        setExpandedTab(prev => ({ ...prev, [p.id]: 'sequence' }))
                      }}
                    >
                      {sent === total ? '✓' : '📬'} {sent}/{total} sent
                    </div>
                  )}

                  {/* Conv log badge */}
                  {convLog.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full flex-shrink-0">
                      💬 {convLog.length}
                    </div>
                  )}

                  {/* Status dropdown */}
                  <select
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusStyle.color}`}
                    value={p.status}
                    onChange={e => { e.stopPropagation(); handleStatusChange(p.id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>

                  {/* Last update */}
                  <div className="text-xs text-gray-400 hidden sm:block w-20 text-right flex-shrink-0">
                    {new Date(p.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 fade-in">
                    {/* Basic info strip */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-b border-gray-100">
                      {p.linkedinUrl && (
                        <div>
                          <div className="font-medium text-gray-400 text-xs mb-1">LinkedIn</div>
                          <a href={p.linkedinUrl.startsWith('http') ? p.linkedinUrl : `https://${p.linkedinUrl}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-brand-blue hover:underline text-xs truncate block"
                            onClick={e => e.stopPropagation()}
                          >
                            {p.linkedinUrl}
                          </a>
                        </div>
                      )}
                      {p.email && (
                        <div>
                          <div className="font-medium text-gray-400 text-xs mb-1">Email</div>
                          <div className="text-xs text-gray-700">{p.email}</div>
                        </div>
                      )}
                      {p.nextAction && (
                        <div className="sm:col-span-2">
                          <div className="font-medium text-gray-400 text-xs mb-1">Next Action</div>
                          <div className="text-xs text-gray-700 bg-yellow-50 border border-yellow-200 p-2 rounded-lg">{p.nextAction}</div>
                        </div>
                      )}
                      {p.notes && (
                        <div className="sm:col-span-2">
                          <div className="font-medium text-gray-400 text-xs mb-1">Notes</div>
                          <div className="text-xs text-gray-700">{p.notes}</div>
                        </div>
                      )}
                    </div>

                    {/* CRM tabs */}
                    <div className="px-4 pt-3">
                      <div className="flex gap-1 mb-3">
                        {[
                          { key: 'sequence', label: '📬 Outreach Sequence', badge: hasSaved ? `${sent}/${total}` : null },
                          { key: 'log',      label: '💬 Conversation Log',  badge: convLog.length > 0 ? convLog.length : null },
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={e => { e.stopPropagation(); setExpandedTab(prev => ({ ...prev, [p.id]: tab.key })) }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              activeTabKey === tab.key
                                ? 'bg-brand-blue text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {tab.label}
                            {tab.badge !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                activeTabKey === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {tab.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* ── Outreach Sequence tab ─── */}
                      {activeTabKey === 'sequence' && (
                        <div className="pb-4" onClick={e => e.stopPropagation()}>
                          {!hasSaved ? (
                            <div className="text-center py-6 text-gray-400">
                              <div className="text-2xl mb-2">📭</div>
                              <p className="text-xs">No outreach messages saved yet.</p>
                              <p className="text-xs mt-1">Go to <strong>Outreach Generator</strong> → generate a sequence → Save to Tracker.</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {SEQUENCE_STEPS.map(step => {
                                const stepData = seq[step.key] || {}
                                const isSent = stepData.status === 'sent'
                                const hasMsg = !!stepData.text
                                const stepExpKey = `${p.id}_${step.key}`
                                const isStepExpanded = expandedStep[stepExpKey]

                                if (!hasMsg) return null // skip steps with no saved message

                                return (
                                  <div key={step.key}
                                    className={`rounded-lg border ${isSent ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}
                                  >
                                    <div className="flex items-center gap-3 p-3">
                                      {/* Checkbox */}
                                      <button
                                        onClick={() => handleToggleStep(p.id, step.key, stepData.status)}
                                        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                          isSent
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 hover:border-green-400'
                                        }`}
                                      >
                                        {isSent && (
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </button>

                                      {/* Label */}
                                      <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-semibold ${isSent ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                                          {step.icon} {step.label}
                                          <span className={`ml-1.5 font-normal ${isSent ? 'text-green-500' : 'text-gray-400'}`}>· {step.tip}</span>
                                        </div>
                                        {isSent && stepData.sentAt && (
                                          <div className="text-xs text-green-500 mt-0.5">
                                            Sent {new Date(stepData.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                          </div>
                                        )}
                                        {!isSent && (
                                          <div className="text-xs text-gray-400 mt-0.5 truncate">{stepData.text?.slice(0, 60)}…</div>
                                        )}
                                      </div>

                                      {/* Expand message button */}
                                      <button
                                        onClick={() => setExpandedStep(prev => ({ ...prev, [stepExpKey]: !isStepExpanded }))}
                                        className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 flex-shrink-0"
                                      >
                                        {isStepExpanded ? '▲ Hide' : '▼ View'}
                                      </button>
                                    </div>

                                    {/* Full message text */}
                                    {isStepExpanded && (
                                      <div className="px-3 pb-3 border-t border-gray-100 mt-1 pt-3">
                                        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono">
                                          {stepData.text}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                          <button
                                            onClick={() => { navigator.clipboard.writeText(stepData.text) }}
                                            className="text-xs text-brand-blue hover:underline"
                                          >
                                            📋 Copy message
                                          </button>
                                          {!isSent && (
                                            <button
                                              onClick={() => handleToggleStep(p.id, step.key, stepData.status)}
                                              className="text-xs text-green-600 hover:underline ml-2"
                                            >
                                              ✓ Mark as sent
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {/* Progress bar */}
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">Progress</span>
                                  <span className="text-xs font-medium text-gray-700">{sent} of {total} sent</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full transition-all"
                                    style={{ width: total > 0 ? `${(sent / total) * 100}%` : '0%' }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ── Conversation Log tab ─── */}
                      {activeTabKey === 'log' && (
                        <div className="pb-4" onClick={e => e.stopPropagation()}>
                          {/* Log entries */}
                          {convLog.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                              <div className="text-2xl mb-2">💬</div>
                              <p className="text-xs">No conversation logged yet.</p>
                              <p className="text-xs mt-1">Record their responses and your replies here.</p>
                            </div>
                          ) : (
                            <div className="space-y-2 mb-3 max-h-64 overflow-y-auto pr-1">
                              {convLog.map(entry => (
                                <div key={entry.id}
                                  className={`flex gap-2 ${entry.type === 'sent' ? 'flex-row-reverse' : ''}`}
                                >
                                  <div className={`max-w-[85%] rounded-xl p-3 text-xs relative group ${
                                    entry.type === 'sent'
                                      ? 'bg-brand-blue text-white rounded-tr-sm'
                                      : entry.type === 'received'
                                        ? 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'
                                        : 'bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg mx-auto text-center italic'
                                  }`}>
                                    {entry.type === 'note' && <span className="mr-1">📝</span>}
                                    <div className="whitespace-pre-wrap leading-relaxed">{entry.text}</div>
                                    <div className={`text-xs mt-1 opacity-60 ${entry.type === 'sent' ? 'text-right text-white/60' : 'text-gray-400'}`}>
                                      {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      {' '}{new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteLogEntry(p.id, entry.id)}
                                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs p-0.5 rounded"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Input area */}
                          {showLogInput[p.id] ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-3">
                              <div className="flex gap-2 mb-2">
                                {[
                                  { type: 'received', label: "Their reply", color: 'bg-gray-100 text-gray-700' },
                                  { type: 'note',     label: 'My note',    color: 'bg-yellow-100 text-yellow-700' },
                                ].map(opt => (
                                  <button
                                    key={opt.type}
                                    onClick={() => setShowLogInput(prev => ({ ...prev, [p.id]: opt.type }))}
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium border-2 transition-all ${
                                      showLogInput[p.id] === opt.type
                                        ? 'border-brand-blue ' + opt.color
                                        : 'border-transparent ' + opt.color
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                className="textarea-field text-xs"
                                rows={3}
                                value={logInput[`${p.id}_${showLogInput[p.id]}`] || ''}
                                onChange={e => setLogInput(prev => ({ ...prev, [`${p.id}_${showLogInput[p.id]}`]: e.target.value }))}
                                placeholder={
                                  showLogInput[p.id] === 'received'
                                    ? "Paste what they said..."
                                    : "Add a note..."
                                }
                                autoFocus
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleAddLogEntry(p.id, showLogInput[p.id])}
                                  disabled={!(logInput[`${p.id}_${showLogInput[p.id]}`] || '').trim()}
                                  className="btn-primary text-xs py-1.5"
                                >
                                  Save Entry
                                </button>
                                <button
                                  onClick={() => setShowLogInput(prev => ({ ...prev, [p.id]: null }))}
                                  className="btn-secondary text-xs py-1.5"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowLogInput(prev => ({ ...prev, [p.id]: 'received' }))}
                                className="btn-secondary text-xs flex-1"
                              >
                                📥 Log Their Reply
                              </button>
                              <button
                                onClick={() => setShowLogInput(prev => ({ ...prev, [p.id]: 'note' }))}
                                className="btn-secondary text-xs flex-1"
                              >
                                📝 Add Note
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom action row */}
                    <div className="flex gap-2 p-4 pt-2 border-t border-gray-100">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(p) }} className="btn-secondary text-xs">
                        ✏️ Edit
                      </button>
                      {p.linkedinUrl && (
                        <a
                          href={p.linkedinUrl.startsWith('http') ? p.linkedinUrl : `https://${p.linkedinUrl}`}
                          target="_blank" rel="noopener noreferrer"
                          className="btn-secondary text-xs"
                          onClick={e => e.stopPropagation()}
                        >
                          🔗 LinkedIn
                        </a>
                      )}
                      {confirmDelete === p.id ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-red-600">Delete this prospect?</span>
                          <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs py-1 px-2">Yes, delete</button>
                          <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-xs py-1 px-2">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(p.id) }}
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

      {/* Footer count */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Showing {filtered.length} of {prospects.length} prospects · Data saved in your browser
      </div>
    </div>
  )
}
