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
                className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${pill.bg} ${pill.text} hover:opacity-80`}
                title="Click to see API credit breakdown"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pill.dot}`} />
                <span>${totalCost.toFixed(3)} / ${budget}</span>
                <div className="w-14 h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${pill.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </button>

              {/* Expanded panel */}
              {creditOpen && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 p-5 fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">API Credit Usage</h3>
                    <button onClick={() => setCreditOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                  </div>

                  {/* Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>${totalCost.toFixed(4)} used</span>
                      <span>${budget.toFixed(2)} monthly budget</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pill.bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1.5">{pct.toFixed(1)}% used this month · resets {usage?.month || '—'}</div>
                  </div>

                  {/* Token totals */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Input',  value: `${((usage?.inputTokens  || 0) / 1000).toFixed(1)}K`, sub: 'tokens' },
                      { label: 'Output', value: `${((usage?.outputTokens || 0) / 1000).toFixed(1)}K`, sub: 'tokens' },
                      { label: 'Calls',  value: usage?.calls || 0,                                     sub: 'total' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                        <div className="text-xs text-gray-400">{s.label}</div>
                        <div className="font-semibold text-gray-800 text-sm">{s.value}</div>
                        <div className="text-xs text-gray-400">{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Per-tool */}
                  {usage?.byTool && Object.keys(usage.byTool).length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Tool</div>
                      <div className="space-y-1.5">
                        {Object.entries(usage.byTool)
                          .sort((a, b) => calcCost(b[1].inputTokens, b[1].outputTokens) - calcCost(a[1].inputTokens, a[1].outputTokens))
                          .map(([key, t]) => {
                            const cost    = calcCost(t.inputTokens, t.outputTokens)
                            const toolPct = totalCost > 0 ? (cost / totalCost) * 100 : 0
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <div className="text-xs text-gray-600 w-36 truncate">{TOOL_LABELS[key] || key}</div>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pill.bar}`} style={{ width: `${toolPct}%` }} />
                                </div>
                                <div className="text-xs text-gray-500 w-14 text-right">${cost.toFixed(4)}</div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Actual Anthropic balance */}
                  {anthropicBalance > 0 && (
                    <div className="mb-4 bg-blue-50 rounded-xl p-3">
                      <div className="text-xs font-semibold text-blue-700 mb-1.5">Anthropic Account Balance</div>
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-lg font-bold text-blue-800">${anthropicBalance.toFixed(2)}</div>
                          <div className="text-xs text-blue-500">entered in Profile Setup</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-blue-700">
                            ~${Math.max(0, anthropicBalance - totalCost).toFixed(2)} left
                          </div>
                          <div className="text-xs text-blue-500">after this month</div>
                        </div>
                      </div>
                      <div className="mt-2 w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, anthropicBalance > 0 ? (totalCost / anthropicBalance) * 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400">$3/MTok in · $15/MTok out</div>
                    <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer"
                       className="text-xs text-brand-blue hover:underline">
                      Billing →
                    </a>
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
