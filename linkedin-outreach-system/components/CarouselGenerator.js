import { useState } from 'react'
import { getProfile } from '../lib/storage'

const TOPIC_SUGGESTIONS = [
  '5 signs you need to hire a VA (before you burn out)',
  'How I manage 3 clients at once as a remote EA from the Philippines',
  'The real cost of NOT delegating your operations',
  'What I learned running Facebook Ads for real estate companies',
  '3 tools every overwhelmed CEO should be using in 2025',
  'Why hiring Filipino VAs is a game-changer for US businesses',
  'How to create content consistently when you\'re always busy',
  'The difference between a VA and an Operations Lead',
]

const BRAND_COLORS = {
  primary: '#E05520',
  crimson: '#A8001E',
  salmon: '#E8836A',
  light: '#FDF0EC',
  dark: '#1E0A05',
  navy: '#0D3E6A',
}

export default function CarouselGenerator() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [carouselHtml, setCarouselHtml] = useState('')
  const [error, setError] = useState('')
  const [downloaded, setDownloaded] = useState(false)
  const [showExportGuide, setShowExportGuide] = useState(false)

  async function handleGenerate() {
    if (!topic.trim()) {
      setError('Enter a topic for your carousel.')
      return
    }
    setLoading(true)
    setError('')
    setCarouselHtml('')
    setDownloaded(false)

    try {
      const profile = getProfile()
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'generateCarousel', data: { topic }, profile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')

      // Extract HTML from result (Claude may wrap it in markdown code blocks)
      let html = data.result
      html = html.replace(/^```html\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      setCarouselHtml(html)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (!carouselHtml) return
    const blob = new Blob([carouselHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeTopic = topic.slice(0, 40).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    a.href = url
    a.download = `adsidi-carousel-${safeTopic}.html`
    a.click()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  function handleRegenerateSlide() {
    // Re-run for a fresh version
    handleGenerate()
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)' }}>
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">LinkedIn Carousel Builder</h2>
            <p className="text-xs text-gray-400">Adsidi-branded · 1080×1080px · 6 slides</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Generate a fully designed LinkedIn carousel with your Adsidi branding. Download as HTML, then screenshot each slide for posting.
        </p>
      </div>

      {/* Brand palette preview */}
      <div className="flex items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-gray-100">
        <span className="text-xs text-gray-400 mr-1">Brand colors:</span>
        {Object.entries(BRAND_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1" title={`${name}: ${color}`}>
            <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ background: color }} />
            <span className="text-xs text-gray-400 hidden sm:block">{color}</span>
          </div>
        ))}
        <span className="ml-auto text-xs font-medium text-gray-500">Plus Jakarta Sans</span>
      </div>

      {/* Input */}
      <div className="card mb-6">
        <label className="label">Carousel Topic</label>
        <p className="text-xs text-gray-400 mb-3">Be specific. The more focused the topic, the better the slides.</p>
        <textarea
          className="textarea-field"
          rows={3}
          value={topic}
          onChange={e => { setTopic(e.target.value); setError('') }}
          placeholder="e.g. 5 signs you need to hire a VA before you burn out"
        />

        {/* Topic suggestions */}
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Or pick one:</p>
          <div className="flex flex-wrap gap-2">
            {TOPIC_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => setTopic(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  topic === s
                    ? 'border-orange-400 bg-orange-50 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

        <div className="flex items-center justify-between mt-5">
          <div className="text-xs text-gray-400">
            6 slides · Square 1:1 · Adsidi branding · ~45–60 seconds to generate
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="btn-primary min-w-[200px]"
            style={!loading ? { background: 'linear-gradient(135deg, #A8001E, #E05520)' } : {}}
          >
            {loading ? (
              <><span className="spinner border-white border-t-transparent" /> Designing slides...</>
            ) : (
              '🎨 Generate Carousel'
            )}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card text-center py-12 fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)' }}>
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Designing your Adsidi carousel...</span>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg skeleton"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Building 6 slides with your brand colors, typography, and content...</p>
        </div>
      )}

      {/* Carousel preview */}
      {carouselHtml && !loading && (
        <div className="fade-in space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">✅ Your Carousel is Ready</h3>
              <p className="text-xs text-gray-400 mt-0.5">Topic: {topic}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRegenerateSlide} className="btn-secondary text-xs">
                🔄 Regenerate
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary text-sm"
                style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)' }}
              >
                {downloaded ? '✓ Downloaded!' : '⬇️ Download HTML'}
              </button>
            </div>
          </div>

          {/* Preview iframe */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-gray-400 text-xs ml-2">LinkedIn Carousel Preview</span>
              <span className="ml-auto text-gray-500 text-xs">Click slides to advance → </span>
            </div>
            <iframe
              srcDoc={carouselHtml}
              className="w-full"
              style={{ height: '600px', border: 'none', background: '#F5F5F5' }}
              title="Carousel Preview"
              sandbox="allow-scripts"
            />
          </div>

          {/* Export guide */}
          <div className="card border-orange-200 bg-orange-50">
            <button
              onClick={() => setShowExportGuide(!showExportGuide)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-orange-600 font-semibold text-sm">📸 How to export as PNG images for LinkedIn</span>
              </div>
              <svg className={`w-4 h-4 text-orange-400 transition-transform ${showExportGuide ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showExportGuide && (
              <div className="mt-4 space-y-3 text-sm text-orange-800 fade-in">
                <p className="font-semibold">Method 1 — Browser Screenshot (easiest, no install needed):</p>
                <ol className="space-y-2 list-decimal pl-5">
                  <li>Click <strong>"Download HTML"</strong> above and open the file in Chrome</li>
                  <li>Press <strong>F12</strong> → click the phone/tablet icon (Toggle Device Toolbar)</li>
                  <li>Set width to <strong>420px</strong> in the toolbar at the top</li>
                  <li>Use a Chrome extension like <strong>"GoFullPage"</strong> or right-click → Inspect → screenshot each slide</li>
                  <li>Or zoom the browser to exactly <strong>257%</strong> and screenshot each 420×420 slide (output = ~1080×1080)</li>
                </ol>

                <p className="font-semibold mt-3">Method 2 — Playwright (best quality, exact 1080×1080px):</p>
                <div className="bg-orange-100 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  <pre>{`pip install playwright
playwright install chromium

python3 << 'EOF'
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

HTML = Path("adsidi-carousel-topic.html")  # your downloaded file
OUT  = Path("slides"); OUT.mkdir(exist_ok=True)
TOTAL, W, H = 6, 420, 420
SCALE = 1080 / 420  # = 2.571

async def export():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width":W,"height":H},
            device_scale_factor=SCALE)
        await page.set_content(HTML.read_text(), wait_until="networkidle")
        await page.wait_for_timeout(3000)
        for i in range(TOTAL):
            await page.evaluate(f"""() => {{
                document.querySelector('.carousel-track').style.cssText =
                    'transition:none;transform:translateX({-i*420}px)';
            }}""")
            await page.wait_for_timeout(300)
            await page.screenshot(
                path=str(OUT/f"slide_{i+1}.png"),
                clip={"x":0,"y":0,"width":W,"height":H})
            print(f"Slide {i+1}/6 exported ✓")
        await browser.close()

asyncio.run(export())
EOF`}</pre>
                </div>
                <p className="text-xs text-orange-600 mt-2">This outputs 6 PNG files at exactly 1080×1080px, ready to upload as a LinkedIn document/carousel post.</p>
              </div>
            )}
          </div>

          {/* LinkedIn posting tips */}
          <div className="card bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 text-sm mb-2">💼 LinkedIn Posting Tips</h4>
            <ul className="space-y-1.5 text-sm text-blue-700">
              <li>→ Post as a <strong>Document Post</strong> (PDF upload) for native carousel swipe — combine your PNG slides into a PDF first</li>
              <li>→ Or post as <strong>multiple images</strong> in one post — LinkedIn shows them as a swipeable gallery</li>
              <li>→ Best posting times for US audience from Philippines: <strong>8–10pm PHT</strong> (7–9am EST)</li>
              <li>→ Write your caption <strong>before</strong> posting — use the Content Planner to generate it</li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!carouselHtml && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl flex items-center justify-center text-sm font-medium border-2 border-dashed"
              style={{
                background: i % 2 === 0 ? '#FDF0EC' : i === 2 ? 'linear-gradient(135deg, #A8001E, #E05520)' : '#1E0A05',
                borderColor: i % 2 === 0 ? '#E05520' : 'transparent',
                color: i % 2 === 0 ? '#E05520' : '#FDF0EC',
              }}
            >
              Slide {i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
