import { useState, useEffect } from 'react'
import { getProfile, addProspect } from '../lib/storage'
import { callClaude } from '../lib/api'

// ─── LinkedIn weekly limits ───────────────────────────────────────────────────
const LINKEDIN_LIMITS = {
  free:    { connections: 100, notes: 'Free accounts: ~100 connection requests/week. Best practice: spread them across the week, max 20–25/day. Connection messages: 300 chars max.' },
  premium: { connections: 250, notes: 'Premium / Sales Nav: ~200–250 connection requests/week. InMails: 20–50/month depending on plan. Avoid spamming — acceptance rate matters.' },
}

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn',  icon: '🔗' },
  { value: 'email',    label: 'Email',     icon: '📧' },
  { value: 'both',     label: 'Both',      icon: '🔄' },
  { value: 'other',    label: 'Other',     icon: '💬' },
]

function getMondayStr() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

// ─── Lead Card (extracted outside for stable reference) ──────────────────────
function LeadCard({ lead, onReachedOut, onNoLinkedin, onPlatform, onAddToHub, onSave, onRemove }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
      lead._reachedOut ? 'border-green-200 bg-green-50/20' : 'border-gray-100'
    }`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-navy-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
          {(lead.name || '?').charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-gray-900 text-sm">{lead.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {lead.title}{lead.company ? ` · ${lead.company}` : ''}
              </div>
              {lead.location && (
                <div className="text-xs text-gray-400 mt-0.5">📍 {lead.location}</div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {lead.confidence && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  lead.confidence === 'high'   ? 'bg-green-100 text-green-700'  :
                  lead.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {lead.confidence === 'high' ? '✓ Verified' : lead.confidence === 'medium' ? '~ Likely' : '? Uncertain'}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {lead.bio && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-2">{lead.bio}</p>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-2">
            {lead.linkedinUrl && (
              <a
                href={lead.linkedinUrl.startsWith('http') ? lead.linkedinUrl : `https://${lead.linkedinUrl}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-blue hover:underline flex items-center gap-1"
              >
                🔗 LinkedIn
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="text-xs text-gray-600 hover:underline flex items-center gap-1">
                📧 {lead.email}
              </a>
            )}
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:underline flex items-center gap-1"
              >
                🌐 Website
              </a>
            )}
          </div>

          {/* No LinkedIn suggestion */}
          {lead._noLinkedin && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              📧 <strong>No LinkedIn found.</strong>{' '}
              {lead.email
                ? `Try email at: ${lead.email}`
                : lead.website
                  ? `Check their website for contact info: ${lead.website}`
                  : 'Search for their email or contact form on their company website.'
              }
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Reached out button */}
            <button
              onClick={onReachedOut}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                lead._reachedOut
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              {lead._reachedOut ? '✓ Reached Out' : '✉️ Mark Reached Out'}
            </button>

            {/* No LinkedIn toggle */}
            <button
              onClick={onNoLinkedin}
              className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                lead._noLinkedin
                  ? 'bg-red-50 border-red-200 text-red-600 font-medium'
                  : 'border-gray-200 text-gray-500 hover:border-red-300'
              }`}
              title={lead._noLinkedin ? 'Click to unmark' : 'Mark as no LinkedIn account'}
            >
              {lead._noLinkedin ? '✗ No LinkedIn' : '✗ No LinkedIn?'}
            </button>

            {/* Platform selector */}
            <select
              value={lead._platform || 'linkedin'}
              onChange={e => onPlatform(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
              title="How will you reach out?"
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
              ))}
            </select>

            {/* Save to list (only for search results) */}
            {onSave && (
              <button
                onClick={onSave}
                disabled={lead._savedToList}
                className="text-xs text-gray-500 hover:text-brand-blue px-2 py-1.5 rounded-lg border border-gray-200 hover:border-brand-blue transition-all disabled:opacity-50"
              >
                {lead._savedToList ? '✓ Saved' : '📌 Save to List'}
              </button>
            )}

            {/* Add to Prospect Hub */}
            <button
              onClick={onAddToHub}
              disabled={lead._addedToHub}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ml-auto ${
                lead._addedToHub
                  ? 'text-green-600 bg-green-50 border border-green-200 font-medium'
                  : 'btn-primary'
              }`}
            >
              {lead._addedToHub ? '✓ In Prospect Hub' : '📊 Add to Hub →'}
            </button>
          </div>
        </div>
      </div>

      {/* Remove button (discovery list only) */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-3 right-3 text-gray-200 hover:text-red-400 text-lg leading-none"
          title="Remove from list"
        >
          ×
        </button>
      )}
    </div>
  )
}

// ─── Group Card ──────────────────────────────────────────────────────────────
function GroupCard({ group, onToggleMember, onRemove }) {
  return (
    <div className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
      group._isMember ? 'border-green-200 bg-green-50/20' : 'border-gray-100'
    }`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-lg flex-shrink-0 mt-0.5">
          👥
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-gray-900 text-sm">{group.name}</div>
              {group.members && (
                <div className="text-xs text-gray-400 mt-0.5">👤 {group.members} members</div>
              )}
            </div>
            {group._isMember && (
              <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                ✓ Member
              </span>
            )}
          </div>

          {group.description && (
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{group.description}</p>
          )}

          {group.whyJoin && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
              💡 <strong>Why join:</strong> {group.whyJoin}
            </div>
          )}

          {group._isMember && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800">
              ✅ <strong>You're a member!</strong> You can now send direct messages to other members without a connection request — no weekly limit applies.
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Member toggle */}
            <button
              onClick={onToggleMember}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                group._isMember
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600'
              }`}
            >
              {group._isMember ? '✓ I\'m a Member' : '🙋 Mark as Joined'}
            </button>

            {/* LinkedIn search link */}
            <a
              href={group.linkedinUrl
                ? (group.linkedinUrl.startsWith('http') ? group.linkedinUrl : `https://${group.linkedinUrl}`)
                : `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(group.name)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-blue hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-brand-blue"
            >
              🔗 {group.linkedinUrl ? 'Open Group' : 'Search on LinkedIn'}
            </a>

            {onRemove && (
              <button onClick={onRemove} className="ml-auto text-xs text-gray-400 hover:text-red-400 px-2">
                × Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LeadDiscovery() {
  // Search form state
  const [targetRole,   setTargetRole]   = useState('')
  const [industry,     setIndustry]     = useState('')
  const [location,     setLocation]     = useState('United States')
  const [companySize,  setCompanySize]  = useState('')
  const [extraContext, setExtraContext] = useState('')
  const [numResults,   setNumResults]   = useState('8')
  const [showSearch,   setShowSearch]   = useState(true)

  // Results
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [leads,   setLeads]   = useState([])  // current search results (not persisted)

  // Discovery list (persisted across sessions)
  const [discoveryList, setDiscoveryList] = useState([])

  // Weekly tracking
  const [accountType, setAccountType] = useState('free')
  const [weeklyStats, setWeeklyStats] = useState({ connections: 0, dms: 0 })

  // Groups
  const [groups,          setGroups]          = useState([])          // current search results
  const [groupList,       setGroupList]       = useState([])          // persisted list
  const [groupsLoading,   setGroupsLoading]   = useState(false)
  const [groupsError,     setGroupsError]     = useState('')
  const [groupQuery,      setGroupQuery]      = useState('')
  const [showGroupSearch, setShowGroupSearch] = useState(true)

  // ── Load persisted data ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('los_discovery_list')
      if (raw) setDiscoveryList(JSON.parse(raw))
    } catch {}

    try {
      const raw = localStorage.getItem('los_weekly_outreach')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed.weekStart === getMondayStr()) {
        setWeeklyStats({ connections: parsed.connections || 0, dms: parsed.dms || 0 })
        setAccountType(parsed.accountType || 'free')
      }
      // else: new week — keep defaults (0)
    } catch {}

    try {
      const raw = localStorage.getItem('los_group_list')
      if (raw) setGroupList(JSON.parse(raw))
    } catch {}
  }, [])

  // ── Persist helpers ──
  function persistDiscovery(list) {
    setDiscoveryList(list)
    try { localStorage.setItem('los_discovery_list', JSON.stringify(list)) } catch {}
  }

  function persistWeekly(stats, acct = accountType) {
    setWeeklyStats(stats)
    try {
      localStorage.setItem('los_weekly_outreach', JSON.stringify({
        ...stats, weekStart: getMondayStr(), accountType: acct,
      }))
    } catch {}
  }

  function incrementWeekly(platform) {
    const isLinkedIn = platform === 'linkedin' || platform === 'both'
    const updated = {
      connections: weeklyStats.connections + (isLinkedIn ? 1 : 0),
      dms: weeklyStats.dms + (!isLinkedIn ? 1 : 0),
    }
    persistWeekly(updated)
  }

  // ── Search ──
  async function handleSearch() {
    if (!targetRole.trim()) {
      setError('Enter the role or type of person you want to find.')
      return
    }
    setLoading(true)
    setError('')
    setLeads([])

    try {
      const profile = getProfile()
      const raw = await callClaude('discoverLeads', {
        targetRole, industry, location, companySize, extraContext, numResults,
      }, profile)

      let parsed = []
      try {
        const clean = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
        const start = clean.indexOf('[')
        const end   = clean.lastIndexOf(']')
        if (start !== -1 && end !== -1) parsed = JSON.parse(clean.slice(start, end + 1))
      } catch {
        setError('Could not parse the search results. Try again.')
        return
      }

      const enriched = parsed.map((lead, i) => ({
        ...lead,
        _id: `sr_${Date.now()}_${i}`,
        _reachedOut: false,
        _noLinkedin: !lead.linkedinUrl,
        _platform: lead.linkedinUrl ? 'linkedin' : 'email',
        _addedToHub: false,
        _savedToList: false,
      }))
      setLeads(enriched)
      setShowSearch(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Search result mutations ──
  function srUpdate(id, patch) {
    setLeads(prev => prev.map(l => l._id === id ? { ...l, ...patch } : l))
  }

  function srReachedOut(lead) {
    const updated = !lead._reachedOut
    srUpdate(lead._id, { _reachedOut: updated })
    if (updated) incrementWeekly(lead._platform)
  }

  function srNoLinkedin(lead) {
    const noLi = !lead._noLinkedin
    srUpdate(lead._id, { _noLinkedin: noLi, _platform: noLi ? 'email' : 'linkedin' })
  }

  function srPlatform(id, platform) {
    srUpdate(id, { _platform: platform })
  }

  function srAddToHub(lead) {
    addProspect({
      name: lead.name || '',
      title: lead.title || '',
      company: lead.company || '',
      linkedinUrl: lead.linkedinUrl || '',
      email: lead.email || '',
      status: 'identified',
      outreachChannel: lead._platform || 'linkedin',
      notes: [
        lead.bio ? `Bio: ${lead.bio}` : '',
        lead.location ? `Location: ${lead.location}` : '',
        lead.website ? `Website: ${lead.website}` : '',
        lead.source ? `Source: ${lead.source}` : '',
      ].filter(Boolean).join('\n'),
    })
    srUpdate(lead._id, { _addedToHub: true })
    // Also save to discovery list
    const updated = { ...lead, _addedToHub: true, _savedToList: true, _savedAt: new Date().toISOString() }
    persistDiscovery([updated, ...discoveryList.filter(l => l._id !== lead._id)])
  }

  function srSaveToList(lead) {
    srUpdate(lead._id, { _savedToList: true })
    const updated = { ...lead, _savedToList: true, _savedAt: new Date().toISOString() }
    persistDiscovery([updated, ...discoveryList.filter(l => l._id !== lead._id)])
  }

  function saveAllToList() {
    const newLeads = leads
      .filter(l => !l._savedToList)
      .map(l => ({ ...l, _savedToList: true, _savedAt: new Date().toISOString() }))
    setLeads(prev => prev.map(l => ({ ...l, _savedToList: true })))
    persistDiscovery([...newLeads, ...discoveryList.filter(l => !newLeads.find(n => n._id === l._id))])
  }

  // ── Discovery list mutations ──
  function dlUpdate(id, patch) {
    persistDiscovery(discoveryList.map(l => l._id === id ? { ...l, ...patch } : l))
  }

  function dlReachedOut(lead) {
    const updated = !lead._reachedOut
    dlUpdate(lead._id, { _reachedOut: updated })
    if (updated) incrementWeekly(lead._platform)
  }

  function dlNoLinkedin(lead) {
    const noLi = !lead._noLinkedin
    dlUpdate(lead._id, { _noLinkedin: noLi, _platform: noLi ? 'email' : 'linkedin' })
  }

  function dlPlatform(id, platform) {
    dlUpdate(id, { _platform: platform })
  }

  function dlAddToHub(lead) {
    addProspect({
      name: lead.name || '',
      title: lead.title || '',
      company: lead.company || '',
      linkedinUrl: lead.linkedinUrl || '',
      email: lead.email || '',
      status: 'identified',
      outreachChannel: lead._platform || 'linkedin',
      notes: [
        lead.bio ? `Bio: ${lead.bio}` : '',
        lead.location ? `Location: ${lead.location}` : '',
        lead.website ? `Website: ${lead.website}` : '',
      ].filter(Boolean).join('\n'),
    })
    dlUpdate(lead._id, { _addedToHub: true })
  }

  function dlRemove(id) {
    persistDiscovery(discoveryList.filter(l => l._id !== id))
  }

  // ── Groups logic ──
  function persistGroupList(list) {
    setGroupList(list)
    try { localStorage.setItem('los_group_list', JSON.stringify(list)) } catch {}
  }

  async function handleFindGroups() {
    const query = groupQuery.trim() || targetRole.trim()
    if (!query) { setGroupsError('Enter a topic or target audience to find relevant groups.'); return }
    setGroupsLoading(true)
    setGroupsError('')
    setGroups([])

    try {
      const profile = getProfile()
      const raw = await callClaude('findLinkedInGroups', { query, industry, location }, profile)

      let parsed = []
      try {
        const clean = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim()
        const start = clean.indexOf('[')
        const end   = clean.lastIndexOf(']')
        if (start !== -1 && end !== -1) parsed = JSON.parse(clean.slice(start, end + 1))
      } catch {
        setGroupsError('Could not parse results. Try again.')
        return
      }

      const enriched = parsed.map((g, i) => ({
        ...g,
        _id: `grp_${Date.now()}_${i}`,
        _isMember: groupList.some(gl => gl.name === g.name && gl._isMember),
        _savedToList: groupList.some(gl => gl.name === g.name),
      }))
      setGroups(enriched)
      setShowGroupSearch(false)
    } catch (e) {
      setGroupsError(e.message)
    } finally {
      setGroupsLoading(false)
    }
  }

  function grpToggleMember(id, fromSearch) {
    if (fromSearch) {
      setGroups(prev => prev.map(g => {
        if (g._id !== id) return g
        const updated = { ...g, _isMember: !g._isMember }
        // sync to groupList if already there
        persistGroupList(groupList.map(gl => gl.name === g.name ? { ...gl, _isMember: updated._isMember } : gl))
        return updated
      }))
    } else {
      persistGroupList(groupList.map(g => g._id === id ? { ...g, _isMember: !g._isMember } : g))
    }
  }

  function grpSaveToList(group) {
    setGroups(prev => prev.map(g => g._id === group._id ? { ...g, _savedToList: true } : g))
    if (!groupList.find(gl => gl.name === group.name)) {
      persistGroupList([{ ...group, _savedToList: true, _savedAt: new Date().toISOString() }, ...groupList])
    }
  }

  function saveAllGroups() {
    const newGroups = groups
      .filter(g => !groupList.find(gl => gl.name === g.name))
      .map(g => ({ ...g, _savedToList: true, _savedAt: new Date().toISOString() }))
    setGroups(prev => prev.map(g => ({ ...g, _savedToList: true })))
    persistGroupList([...newGroups, ...groupList])
  }

  function grpRemove(id) {
    persistGroupList(groupList.filter(g => g._id !== id))
  }

  // ── Computed ──
  const limit = LINKEDIN_LIMITS[accountType]
  const connPct = Math.min(100, (weeklyStats.connections / limit.connections) * 100)
  const connBarColor = connPct >= 80 ? 'bg-red-500' : connPct >= 60 ? 'bg-yellow-500' : 'bg-green-500'

  const dlPending   = discoveryList.filter(l => !l._reachedOut).length
  const dlReached   = discoveryList.filter(l => l._reachedOut).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Lead Discovery</h2>
        <p className="section-subtitle">
          Search the internet for potential prospects to reach out to this week — with LinkedIn limit tracking built in.
        </p>
      </div>

      {/* ── Weekly Outreach Tracker ────────────────────────── */}
      <div className="card mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">📊 Weekly Outreach Tracker</h3>
            <p className="text-xs text-gray-400 mt-0.5">Resets every Monday. Stays in sync as you mark leads as "Reached Out".</p>
          </div>
          <select
            value={accountType}
            onChange={e => { setAccountType(e.target.value); persistWeekly(weeklyStats, e.target.value) }}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 bg-white"
          >
            <option value="free">Free Account</option>
            <option value="premium">Premium / Sales Nav</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-3">
          {/* LinkedIn connections */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">🔗 LinkedIn Connections Sent</span>
              <span className={`text-xs font-bold ${connPct >= 80 ? 'text-red-600' : connPct >= 60 ? 'text-yellow-600' : 'text-gray-800'}`}>
                {weeklyStats.connections} / {limit.connections}
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${connBarColor}`}
                style={{ width: `${Math.max(2, connPct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">This week (Mon–Sun)</span>
              <span className={`text-[10px] font-medium ${connPct >= 80 ? 'text-red-500' : 'text-gray-400'}`}>
                {limit.connections - weeklyStats.connections} left
              </span>
            </div>
          </div>

          {/* Email / other */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">📧 Email / Other Outreach</span>
              <span className="text-xs font-bold text-gray-800">{weeklyStats.dms} sent</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (weeklyStats.dms / 30) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">This week</span>
              <span className="text-[10px] text-gray-400">No strict platform limit</span>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        {connPct >= 80 && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mt-1">
            ⚠️ {connPct >= 100
              ? 'LinkedIn connection limit reached for this week. Wait until Monday to send more requests.'
              : `Approaching your LinkedIn limit (${Math.round(connPct)}%). ${limit.connections - weeklyStats.connections} connections left — switch to email outreach for new leads.`}
          </div>
        )}

        {/* Rules note */}
        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">{limit.notes}</p>

        {/* Manual adjust */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">Adjust manually:</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => persistWeekly({ ...weeklyStats, connections: Math.max(0, weeklyStats.connections - 1) })}
              className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold leading-none flex items-center justify-center">−</button>
            <span className="text-xs text-gray-600 w-16 text-center">🔗 {weeklyStats.connections}</span>
            <button onClick={() => persistWeekly({ ...weeklyStats, connections: weeklyStats.connections + 1 })}
              className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold leading-none flex items-center justify-center">+</button>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => persistWeekly({ ...weeklyStats, dms: Math.max(0, weeklyStats.dms - 1) })}
              className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold leading-none flex items-center justify-center">−</button>
            <span className="text-xs text-gray-600 w-16 text-center">📧 {weeklyStats.dms}</span>
            <button onClick={() => persistWeekly({ ...weeklyStats, dms: weeklyStats.dms + 1 })}
              className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm font-bold leading-none flex items-center justify-center">+</button>
          </div>
          <button onClick={() => persistWeekly({ connections: 0, dms: 0 })}
            className="text-xs text-red-400 hover:text-red-600 ml-auto">Reset week</button>
        </div>
      </div>

      {/* ── Search Form ───────────────────────────────────── */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">🌐 Find New Prospects Online</h3>
          <button onClick={() => setShowSearch(!showSearch)} className="text-xs text-gray-400 hover:text-gray-600">
            {showSearch ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {showSearch && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Role / Type of Person *</label>
                <input
                  className="input-field"
                  value={targetRole}
                  onChange={e => setTargetRole(e.target.value)}
                  placeholder="e.g. Real estate CEO, Marketing Director, US-based Startup Founder"
                />
              </div>
              <div>
                <label className="label">Industry</label>
                <input
                  className="input-field"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. Real estate, SaaS, E-commerce, Healthcare"
                />
              </div>
              <div>
                <label className="label">Location</label>
                <input
                  className="input-field"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. United States, Texas, New York"
                />
              </div>
              <div>
                <label className="label">Company Size</label>
                <select className="input-field" value={companySize} onChange={e => setCompanySize(e.target.value)}>
                  <option value="">Any size</option>
                  <option value="1-10 employees (solopreneur / tiny team)">1–10 (solopreneur / tiny team)</option>
                  <option value="11-50 employees (small business)">11–50 (small business)</option>
                  <option value="51-200 employees (growing SME)">51–200 (growing SME)</option>
                  <option value="201-500 employees">201–500 (mid-market)</option>
                  <option value="500+ employees">500+ (enterprise)</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Additional Context <span className="text-gray-400 font-normal">(optional — helps a lot)</span></label>
              <textarea
                className="textarea-field"
                rows={2}
                value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
                placeholder="e.g. Must be active on LinkedIn, scaling their team, US-based real estate investor with 5+ properties, running paid ads..."
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Find</label>
                <select
                  className="input-field w-16 py-1.5"
                  value={numResults}
                  onChange={e => setNumResults(e.target.value)}
                >
                  {['5','8','10','12','15'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs text-gray-500">real people</span>
              </div>

              <div className="flex items-center gap-3">
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button
                  onClick={handleSearch}
                  disabled={loading || !targetRole.trim()}
                  className="btn-primary min-w-[170px]"
                >
                  {loading
                    ? <><span className="spinner border-white border-t-transparent" /> Searching the web…</>
                    : '🌐 Find Prospects'
                  }
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 mt-2">
              ℹ️ Claude searches LinkedIn, company websites, Twitter, and other public sources to find real named individuals. Results may take 30–60 seconds.
            </p>
          </>
        )}
      </div>

      {/* ── LinkedIn Groups ───────────────────────────────── */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">👥 LinkedIn Groups to Join</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Group members can be messaged directly — <strong>no connection request needed</strong>, no weekly limit.
            </p>
          </div>
          <button onClick={() => setShowGroupSearch(!showGroupSearch)} className="text-xs text-gray-400 hover:text-gray-600">
            {showGroupSearch ? '▲ Collapse' : '▼ Expand'}
          </button>
        </div>

        {showGroupSearch && (
          <>
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 mb-4 leading-relaxed">
              💡 <strong>LinkedIn Group Hack:</strong> When you and a prospect are both members of the same LinkedIn group, you can send them a message directly from the group — it doesn't count as a connection request and bypasses the weekly limit. Great strategy for scaling outreach.
            </div>

            <div className="flex gap-3 items-end mb-3">
              <div className="flex-1">
                <label className="label">Find groups for <span className="text-gray-400 font-normal">(describe your target audience or topic)</span></label>
                <input
                  className="input-field"
                  value={groupQuery}
                  onChange={e => setGroupQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFindGroups()}
                  placeholder={targetRole ? `e.g. ${targetRole} groups` : 'e.g. Real estate investors, SaaS founders, Virtual assistants...'}
                />
              </div>
              <button
                onClick={handleFindGroups}
                disabled={groupsLoading || (!groupQuery.trim() && !targetRole.trim())}
                className="btn-primary whitespace-nowrap"
              >
                {groupsLoading
                  ? <><span className="spinner border-white border-t-transparent" /> Searching…</>
                  : '👥 Find Groups'
                }
              </button>
            </div>

            {groupsError && <p className="text-red-500 text-xs mb-2">{groupsError}</p>}

            <p className="text-[10px] text-gray-400">
              ℹ️ Results are real LinkedIn groups found on the web. Click "Search on LinkedIn" to find and join them. Mark "I'm a Member" once you've joined.
            </p>
          </>
        )}

        {/* Group search results */}
        {groups.length > 0 && (
          <div className="mt-4 fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">{groups.length} groups found</span>
              <button onClick={saveAllGroups} className="text-xs text-brand-blue hover:underline">
                📌 Save all to My List
              </button>
            </div>
            <div className="space-y-3">
              {groups.map(g => (
                <GroupCard
                  key={g._id}
                  group={g}
                  onToggleMember={() => grpToggleMember(g._id, true)}
                  onRemove={null}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── My Groups List (persisted) ────────────────────── */}
      {groupList.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              📋 My Groups List
              <span className="ml-2 text-xs text-gray-400 font-normal">
                ({groupList.filter(g => g._isMember).length} joined · {groupList.filter(g => !g._isMember).length} pending)
              </span>
            </h3>
          </div>
          <div className="space-y-3">
            {groupList.map(g => (
              <GroupCard
                key={g._id}
                group={g}
                onToggleMember={() => grpToggleMember(g._id, false)}
                onRemove={() => grpRemove(g._id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Search Results ────────────────────────────────── */}
      {leads.length > 0 && (
        <div className="mb-6 fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              🎯 Search Results — {leads.length} prospect{leads.length !== 1 ? 's' : ''} found
            </h3>
            <button
              onClick={saveAllToList}
              className="text-xs text-brand-blue hover:underline"
            >
              📌 Save all to My List
            </button>
          </div>
          <div className="space-y-3">
            {leads.map(lead => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onReachedOut={() => srReachedOut(lead)}
                onNoLinkedin={() => srNoLinkedin(lead)}
                onPlatform={p => srPlatform(lead._id, p)}
                onAddToHub={() => srAddToHub(lead)}
                onSave={() => srSaveToList(lead)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Discovery List (persisted) ────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">
              📋 My Discovery List
              {discoveryList.length > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  ({dlReached} reached out · {dlPending} pending)
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Persists across sessions. Saved from search results or added directly.</p>
          </div>
        </div>

        {discoveryList.length === 0 ? (
          <div className="card border-dashed bg-gray-50/50 border-gray-200 text-center py-10">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Your discovery list is empty</p>
            <p className="text-xs text-gray-400">Search for prospects above, then save them here to track across the week.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {discoveryList.map(lead => (
              <div key={lead._id} className="relative">
                <LeadCard
                  lead={lead}
                  onReachedOut={() => dlReachedOut(lead)}
                  onNoLinkedin={() => dlNoLinkedin(lead)}
                  onPlatform={p => dlPlatform(lead._id, p)}
                  onAddToHub={() => dlAddToHub(lead)}
                  onRemove={() => dlRemove(lead._id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
