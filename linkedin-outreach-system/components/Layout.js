import { useState, useEffect } from 'react'
import { getProfile, getUsage, calcCost } from '../lib/storage'

const NAV_GROUPS = [
  {
    label: 'Pipeline',
    items: [
      { id: 'tracker',  label: 'Prospect Hub',       icon: '📊', desc: 'Track all prospects' },
      { id: 'prospect', label: 'Prospect Analyzer',  icon: '🔍', desc: 'Research & brief' },
      { id: 'outreach', label: 'Outreach Generator', icon: '✉️',  desc: 'Messages & DMs' },
      { id: 'reply',    label: 'Reply Handler',      icon: '💬', desc: 'Handle responses' },
    ],
  },
  {
    label: 'Materials',
    items: [
      { id: 'resume',      label: 'Resume Tailor',      icon: '📄', desc: 'Tailor for each client' },
      { id: 'appletter',   label: 'Application Letter', icon: '📝', desc: 'Cover letters' },
      { id: 'videoscript', label: 'Video Script',       icon: '🎬', desc: 'Record-ready scripts' },
    ],
  },
  {
    label: 'Close & Prep',
    items: [
      { id: 'proposal', label: 'Pricing Proposal', icon: '💰', desc: 'Service proposals' },
      { id: 'brief',    label: 'Client Brief',     icon: '🧠', desc: 'Meeting intel' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'content', label: 'Content Studio', icon: '🎨', desc: 'Ideas + Carousel' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'profile', label: 'Profile Setup', icon: '👤', desc: 'Your info & voice' },
    ],
  },
]

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items)

function getPillStyle(pct) {
  if (pct >= 85) return { bg: 'bg-red-100',    text: 'text-red-700',    bar: 'bg-red-500',    dot: 'bg-red-500' }
  if (pct >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500', dot: 'bg-yellow-500' }
  return               { bg: 'bg-green-100',   text: 'text-green-700',  bar: 'bg-green-500',  dot: 'bg-green-500' }
}

const TOOL_LABELS = {
  analyzeProspect:          'Prospect Analyzer',
  generateOutreach:         'Outreach Generator',
  handleReply:              'Reply Handler',
  tailorResume:             'Resume Tailor',
  generateAppLetter:        'Application Letter',
  generateVideoScript:      'Video Script',
  generatePricingProposal:  'Pricing Proposal',
  generateClientBrief:      'Client Brief',
  generateContent:          'Content Studio',
  generateCarousel:         'Content Studio',
  generateCaption:          'Content Studio',
  parseResume:              'Profile Setup',
  parseJobPost:             'Outreach Generator',
  researchEmployer:         'Prospect Analyzer',
}

export default function Layout({ activeTab, onTabChange, syncStatus, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [creditOpen, setCreditOpen]   = useState(false)
  const [usage, setUsage]                       = useState(null)
  const [budget, setBudget]                     = useState(10)
  const [anthropicBalance, setAnthropicBalance] = useState(0)

  const activeItem = ALL_ITEMS.find(i => i.id === activeTab)

  useEffect(() => {
    const u = getUsage()
    const p = getProfile()
    setUsage(u)
    setBudget(p?.monthlyBudget || 10)
    setAnthropicBalance(p?.anthropicBalance || 0)
  }, [activeTab])

  const totalCost = usage ? calcCost(usage.inputTokens || 0, usage.outputTokens || 0) : 0
  const pct       = Math.min(100, budget > 0 ? (totalCost / budget) * 100 : 0)
  const pill      = getPillStyle(pct)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={`flex flex-col bg-navy-900 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0`}>

        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center flex-shrink-0 font-bold text-white text-sm">
            A
          </div>
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Adsidi</div>
              <div className="text-white/40 text-xs whitespace-nowrap">Client Generator</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-white/40 hover:text-white/80 transition-colors p-1 rounded"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              }
            </svg>
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-1">
              {sidebarOpen && (
                <div className="px-5 pt-3 pb-1 text-white/30 text-[10px] font-semibold uppercase tracking-widest">
                  {group.label}
                </div>
              )}
              {!sidebarOpen && <div className="border-t border-white/10 mx-2 my-2" />}
              <div className="px-2 space-y-0.5">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left ${
                      activeTab === item.id
                        ? 'bg-brand-blue text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <span className="text-base flex-shrink-0 w-5 text-center">{item.icon}</span>
                    {sidebarOpen && (
                      <div className="overflow-hidden">
                        <div className="text-sm font-medium leading-tight whitespace-nowrap">{item.label}</div>
                        <div className={`text-xs leading-tight whitespace-nowrap ${activeTab === item.id ? 'text-white/70' : 'text-white/40'}`}>
                          {item.desc}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="text-white/30 text-xs text-center">Powered by Claude AI</div>
          </div>
        )}
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-gray-900">
              {activeItem?.icon} {activeItem?.label}
            </h1>
            <p className="text-xs text-gray-400">{activeItem?.desc}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">

            {/* Sync status */}
            {syncStatus === 'syncing' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                Syncing…
              </div>
            )}
            {syncStatus === 'synced' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-600">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Synced
              </div>
            )}
            {syncStatus === 'offline' && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Offline
              </div>
            )}

            {/* ── Credit Pill ── */}
            <div className="relative">
              <button
                onClick={() => setCreditOpen(o => !o)}
                className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                title="Click to see API credit breakdown"
              >
                <span className="text-gray-500 font-medium">API Credits</span>
                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 85 ? '#ef4444' : pct >= 60 ? 'linear-gradient(90deg,#22c55e,#eab308,#f97316)' : 'linear-gradient(90deg,#22c55e,#84cc16)',
                    }}
                  />
                </div>
                <span className={`font-bold ${pct >= 85 ? 'text-red-600' : pct >= 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                  ${totalCost.toFixed(3)} / ${budget}
                </span>
              </button>

              {/* Expanded panel */}
              {creditOpen && (
                <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5 fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">⚡ API Usage This Month</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Estimated cost based on Claude Sonnet token pricing · Resets {usage?.month ? `${usage.month.slice(0,3)} 1` : 'monthly'}</p>
                    </div>
                    <button onClick={() => setCreditOpen(false)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none w-7 h-7 flex items-center justify-center">×</button>
                  </div>

                  {/* Big budget display */}
                  <div className="mb-4">
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly budget used</span>
                      <span className="text-xl font-black text-gray-900">${totalCost.toFixed(2)} <span className="text-sm font-normal text-gray-400">of ${budget.toFixed(2)} budget</span></span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 85 ? '#ef4444' : pct >= 60 ? 'linear-gradient(90deg,#22c55e,#eab308,#f97316)' : 'linear-gradient(90deg,#22c55e,#84cc16,#eab308)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Token stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'INPUT TOKENS',  value: `${((usage?.inputTokens  || 0) / 1000).toFixed(1)}K`, sub: `~$${((usage?.inputTokens||0)/1e6*3).toFixed(2)} at $3/MTok` },
                      { label: 'OUTPUT TOKENS', value: `${((usage?.outputTokens || 0) / 1000).toFixed(1)}K`, sub: `~$${((usage?.outputTokens||0)/1e6*15).toFixed(2)} at $15/MTok` },
                      { label: 'API CALLS',     value: usage?.calls || 0,                                     sub: `since ${usage?.month || 'this month'}` },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{s.label}</div>
                        <div className="font-black text-gray-800 text-lg leading-none">{s.value}</div>
                        <div className="text-[10px] text-gray-400 mt-1 leading-tight">{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-tool breakdown */}
                  {usage?.byTool && Object.keys(usage.byTool).length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-600 mb-2.5">Cost by tool this month</div>
                      <div className="space-y-2">
                        {Object.entries(usage.byTool)
                          .sort((a, b) => calcCost(b[1].inputTokens, b[1].outputTokens) - calcCost(a[1].inputTokens, a[1].outputTokens))
                          .map(([key, t]) => {
                            const cost    = calcCost(t.inputTokens, t.outputTokens)
                            const toolPct = totalCost > 0 ? (cost / totalCost) * 100 : 0
                            const icon    = { analyzeProspect:'🔍', researchEmployer:'🔍', generateOutreach:'✉️', handleReply:'💬', tailorResume:'📄', parseResume:'📄', generateAppLetter:'📝', parseJobPost:'📝', generateVideoScript:'🎬', generatePricingProposal:'💰', generateClientBrief:'🧠', generateContent:'🎨', generateCarousel:'🎨', generateCaption:'🎨' }[key] || '⚡'
                            return (
                              <div key={key} className="flex items-center gap-2.5">
                                <span className="text-sm w-5 text-center">{icon}</span>
                                <div className="text-xs text-gray-600 w-32 truncate font-medium">{TOOL_LABELS[key] || key}</div>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-orange-400" style={{ width: `${toolPct}%` }} />
                                </div>
                                <div className="text-xs font-semibold text-gray-600 w-12 text-right">${cost.toFixed(2)}</div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Status box */}
                  <div className={`rounded-xl p-3 mb-3 flex items-start gap-2.5 ${pct >= 85 ? 'bg-red-50' : pct >= 60 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                    <span className="text-base">{pct >= 85 ? '⚠️' : pct >= 60 ? '🟡' : '✅'}</span>
                    <p className={`text-xs leading-relaxed ${pct >= 85 ? 'text-red-700' : pct >= 60 ? 'text-yellow-700' : 'text-green-700'}`}>
                      {pct >= 85
                        ? `You're at ${pct.toFixed(0)}% of your $${budget} budget — consider increasing it in Profile Setup.`
                        : pct >= 60
                        ? `You're at ${pct.toFixed(0)}% of your $${budget} budget — you have $${(budget - totalCost).toFixed(2)} left this month.`
                        : `You're at ${pct.toFixed(0)}% of your $${budget} budget — plenty left.`
                      }
                      {' '}Check your real balance anytime at{' '}
                      <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer" className="font-bold underline">console.anthropic.com</a>
                    </p>
                  </div>

                  <div className="text-center text-xs text-gray-400">
                    Budget resets on the 1st of each month · <button onClick={() => { setCreditOpen(false); }} className="underline hover:text-gray-600">Adjust in Profile Setup</button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
