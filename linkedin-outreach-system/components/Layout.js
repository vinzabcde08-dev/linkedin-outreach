import { useState } from 'react'

const NAV_ITEMS = [
  { id: 'profile',   label: 'Profile Setup',        icon: '👤', desc: 'Your info & voice' },
  { id: 'prospect',  label: 'Prospect Analyzer',    icon: '🔍', desc: 'Research & brief' },
  { id: 'outreach',  label: 'Outreach Generator',   icon: '✉️',  desc: 'Messages & DMs' },
  { id: 'reply',     label: 'Reply Handler',         icon: '💬', desc: 'Handle responses' },
  { id: 'content',   label: 'Content Studio',       icon: '🎨', desc: 'Ideas + Carousel' },
  { id: 'tracker',   label: 'Application Tracker',  icon: '📊', desc: 'Track prospects' },
]

export default function Layout({ activeTab, onTabChange, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const activeItem = NAV_ITEMS.find(i => i.id === activeTab)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`flex flex-col bg-navy-900 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        } flex-shrink-0`}
      >
        {/* Logo / Brand */}
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center flex-shrink-0 font-bold text-white text-sm">
            A
          </div>
          {sidebarOpen && (
            <div className="ml-3 overflow-hidden">
              <div className="text-white font-semibold text-sm leading-tight whitespace-nowrap">Absidi</div>
              <div className="text-white/40 text-xs whitespace-nowrap">LinkedIn OS</div>
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

        {/* Nav items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-left group ${
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
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/10">
            <div className="text-white/30 text-xs text-center">Powered by Claude AI</div>
          </div>
        )}
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
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
            <div className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">
              V
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
