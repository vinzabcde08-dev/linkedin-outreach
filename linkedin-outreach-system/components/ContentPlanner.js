import { useState, useEffect } from 'react'
import { getProfile, addContentBatch, getContentHistory } from '../lib/storage'
import { callClaude } from '../lib/api'
import CarouselGenerator from './CarouselGenerator'

const FORMAT_COLORS = {
  'Text Post':       'bg-blue-100 text-blue-700',
  'Carousel':        'bg-purple-100 text-purple-700',
  'Short Video':     'bg-red-100 text-red-700',
  'Poll':            'bg-green-100 text-green-700',
  'Document Post':   'bg-orange-100 text-orange-700',
  'Short Video Script': 'bg-red-100 text-red-700',
}

function parseIdeas(text) {
  // Try to split by IDEA sections
  const ideas = []
  const pattern = /##\s*💡\s*IDEA\s*(\d+):?\s*(.*?)(?=##\s*💡\s*IDEA|\Z)/gis
  let match
  while ((match = pattern.exec(text)) !== null) {
    ideas.push({
      number: match[1],
      title: match[2].trim(),
      content: match[0].trim(),
    })
  }
  return ideas.length > 0 ? ideas : [{ number: '1', title: 'Today\'s Ideas', content: text }]
}

function getFormatFromContent(content) {
  const match = content.match(/\*\*Format:\*\*\s*(.+)/i)
  return match ? match[1].trim() : 'Text Post'
}

function getHookFromContent(content) {
  const match = content.match(/\*\*Hook.*?:\*\*\s*(.+)/i)
  return match ? match[1].trim() : ''
}

export default function ContentPlanner() {
  const [activeTab, setActiveTab] = useState('ideas')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState([])
  const [rawResult, setRawResult] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [expandedIdea, setExpandedIdea] = useState(0)
  const [history, setHistory] = useState(getContentHistory)
  const [showHistory, setShowHistory] = useState(false)

  // Restore last session's ideas on mount so they survive tab switches
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('los_draft_content_raw')
      const savedIdeas = localStorage.getItem('los_draft_content_ideas')
      if (savedRaw) setRawResult(savedRaw)
      if (savedIdeas) setIdeas(JSON.parse(savedIdeas))
    } catch {}
  }, [])

  async function handleGenerate() {
    setLoading(true)
    setError('')
    setIdeas([])
    setRawResult('')

    try {
      const profile = getProfile()
      const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })
      const text = await callClaude('generateContent', { date: today }, profile)

      setRawResult(text)
      const parsed = parseIdeas(text)
      setIdeas(parsed)
      setExpandedIdea(0)
      try {
        localStorage.setItem('los_draft_content_raw', text)
        localStorage.setItem('los_draft_content_ideas', JSON.stringify(parsed))
      } catch {}

      const batch = {
        date: today,
        generatedAt: new Date().toISOString(),
        ideas: parsed,
        raw: text,
      }
      addContentBatch(batch)
      setHistory(getContentHistory())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyIdea(content) {
    navigator.clipboard.writeText(content)
    setCopied(content.slice(0, 20))
    setTimeout(() => setCopied(''), 2000)
  }

  function copyAll() {
    navigator.clipboard.writeText(rawResult)
    setCopied('all')
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="section-title">Content Studio</h2>
        <p className="section-subtitle">
          Generate LinkedIn content ideas with full scripts, or build an Adsidi-branded carousel ready to post.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ideas')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'ideas'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✨ Content Ideas
        </button>
        <button
          onClick={() => setActiveTab('carousel')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'carousel'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🎨 Carousel Builder
        </button>
      </div>

      {/* Carousel tab */}
      {activeTab === 'carousel' && (
        <div className="fade-in">
          <CarouselGenerator />
        </div>
      )}

      {/* Ideas tab */}
      {activeTab === 'ideas' && (
      <div className="fade-in">

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">Daily Content Ideas</p>
          <p className="text-xs text-gray-400 mt-0.5">5 ideas with full hooks, formats, and scripts tailored to your expertise.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="btn-secondary text-xs"
          >
            📚 History ({history.length})
          </button>
          {rawResult && (
            <button onClick={copyAll} className="copy-btn">
              {copied === 'all' ? '✓ Copied all' : '📋 Copy all'}
            </button>
          )}
        </div>
      </div>

      {/* Generate button */}
      <div className="card mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900 text-sm">
            📅 {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            5 content ideas based on your expertise, audience, and what performs on LinkedIn
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary min-w-[180px]"
        >
          {loading ? (
            <><span className="spinner border-white border-t-transparent" /> Generating ideas...</>
          ) : (
            '✨ Generate Today\'s Ideas'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className="card mb-6 fade-in">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">📚 Recent Content Batches</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((batch, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setRawResult(batch.raw)
                  setIdeas(batch.ideas)
                  setExpandedIdea(0)
                  setShowHistory(false)
                }}
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{batch.date}</div>
                  <div className="text-xs text-gray-400">{batch.ideas?.length || 0} ideas</div>
                </div>
                <span className="text-xs text-brand-blue">Load →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ideas display */}
      {ideas.length > 0 && (
        <div className="fade-in">
          {/* Idea selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {ideas.map((idea, i) => {
              const format = getFormatFromContent(idea.content)
              return (
                <button
                  key={i}
                  onClick={() => setExpandedIdea(i)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                    expandedIdea === i
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-brand-blue'
                  }`}
                >
                  <div className="font-semibold">Idea {idea.number}</div>
                  <div className={`text-xs mt-0.5 ${expandedIdea === i ? 'text-white/70' : 'text-gray-400'}`}>
                    {format}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Current idea */}
          {(() => {
            const idea = ideas[expandedIdea]
            if (!idea) return null
            const format = getFormatFromContent(idea.content)
            const hook = getHookFromContent(idea.content)
            const formatColor = FORMAT_COLORS[format] || 'bg-gray-100 text-gray-700'

            return (
              <div className="card fade-in">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`status-badge text-xs px-2.5 py-1 ${formatColor}`}>
                        {format}
                      </span>
                      <span className="text-gray-400 text-xs">Idea {idea.number}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base">{idea.title}</h3>
                    {hook && (
                      <div className="mt-2 text-sm text-gray-500 italic">
                        Hook: "{hook}"
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => copyIdea(idea.content)}
                    className="copy-btn flex-shrink-0"
                  >
                    {copied === idea.content.slice(0, 20) ? '✓ Copied!' : '📋 Copy idea'}
                  </button>
                </div>

                <div className="result-box text-sm whitespace-pre-wrap leading-relaxed">
                  {idea.content}
                </div>

                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">Format: {format}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    Best time to post: 8–10am or 12–1pm PHT (target US audience = evening US time)
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Empty state */}
      {ideas.length === 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '📖', title: 'Personal Story', desc: 'Behind-the-scenes from your work life as a Filipino EA & ops lead' },
            { icon: '💡', title: 'Practical Tips', desc: 'Actionable advice on operations, VA, digital marketing, or journalism' },
            { icon: '🔥', title: 'Contrarian Take', desc: 'A bold opinion about the VA or remote work industry' },
            { icon: '🏆', title: 'Client Win', desc: 'A result or case study that shows what you can do' },
            { icon: '🛠️', title: 'Educational', desc: 'Teach one thing from your skill set: tools, tactics, frameworks' },
          ].map((item, i) => (
            <div key={i} className="card border-dashed hover:border-brand-blue transition-colors cursor-default">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-semibold text-gray-800 text-sm">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      )}

      </div>
      )}

    </div>
  )
}
