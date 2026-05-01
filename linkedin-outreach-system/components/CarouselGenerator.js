import { useState, useRef, useEffect } from 'react'
import { getProfile } from '../lib/storage'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_SUGGESTIONS = [
  '5 signs you need to hire a VA (before you burn out)',
  'How I manage 3 clients at once as a remote EA from the Philippines',
  'The real cost of NOT delegating your operations',
  'What I learned running Facebook Ads for real estate companies',
  '3 tools every overwhelmed CEO should be using right now',
  'Why hiring Filipino VAs is a game-changer for US businesses',
  'How to create content consistently when you\'re always busy',
  'The difference between a VA and an Operations Lead',
]

const LOGO_COLOR_OPTIONS = [
  { label: 'White',   value: '#ffffff', preview: '#374151' },
  { label: 'Orange',  value: '#E05520', preview: '#FDF0EC' },
  { label: 'Crimson', value: '#A8001E', preview: '#FDF0EC' },
  { label: 'Dark',    value: '#1E0A05', preview: '#F3F4F6' },
  { label: 'Navy',    value: '#0D3E6A', preview: '#F3F4F6' },
]

const BRAND_COLORS = {
  primary: '#E05520',
  crimson: '#A8001E',
  salmon:  '#E8836A',
  light:   '#FDF0EC',
  dark:    '#1E0A05',
  navy:    '#0D3E6A',
}

// Default fallback logo — simple "A" in brand gradient
const DEFAULT_LOGO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#A8001E"/>
      <stop offset="100%" stop-color="#E05520"/>
    </linearGradient></defs>
    <rect width="40" height="40" rx="8" fill="url(#g)"/>
    <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle"
      fill="white" font-size="24" font-weight="800" font-family="Arial,sans-serif">A</text>
  </svg>`
)}`

// ─────────────────────────────────────────────────────────────────────────────
// Logo recolor via Canvas API
// ─────────────────────────────────────────────────────────────────────────────
async function recolorLogo(originalDataUrl, hexColor) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth  || img.width  || 200
      canvas.height = img.naturalHeight || img.height || 200
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = imageData
      const r = parseInt(hexColor.slice(1, 3), 16)
      const g = parseInt(hexColor.slice(3, 5), 16)
      const b = parseInt(hexColor.slice(5, 7), 16)
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 10) { // non-transparent pixel — recolor it
          data[i]     = r
          data[i + 1] = g
          data[i + 2] = b
          // alpha stays unchanged — preserves shape
        }
      }
      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = originalDataUrl
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function CarouselGenerator() {
  // Core
  const [topic, setTopic]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [carouselHtml, setCarouselHtml] = useState('')   // raw from Claude
  const [processedHtml, setProcessedHtml] = useState('') // logo injected
  const [error, setError]               = useState('')

  // Logo
  const [logoOriginalUrl, setLogoOriginalUrl]   = useState(null)
  const [logoColor, setLogoColor]               = useState('#ffffff')
  const [useOriginal, setUseOriginal]           = useState(false)
  const [logoActiveUrl, setLogoActiveUrl]       = useState(null)
  const [logoProcessing, setLogoProcessing]     = useState(false)

  // Export
  const [exporting, setExporting]         = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportedPngs, setExportedPngs]   = useState([])
  const [exportError, setExportError]     = useState('')

  // Caption
  const [caption, setCaption]               = useState('')
  const [captionLoading, setCaptionLoading] = useState(false)
  const [captionCopied, setCaptionCopied]   = useState(false)

  const exportIframeRef = useRef(null)

  // ── Rebuild processedHtml whenever raw HTML or logo changes ───────────────
  useEffect(() => {
    if (!carouselHtml) { setProcessedHtml(''); return }
    const logoUrl = logoActiveUrl || DEFAULT_LOGO_DATA_URL
    const processed = carouselHtml.replace(/ADSIDI_LOGO_SRC/g, logoUrl)
    setProcessedHtml(processed)
  }, [carouselHtml, logoActiveUrl])

  // ── Logo upload ───────────────────────────────────────────────────────────
  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const originalUrl = ev.target.result
      setLogoOriginalUrl(originalUrl)
      setUseOriginal(false)
      setLogoProcessing(true)
      try {
        const recolored = await recolorLogo(originalUrl, logoColor)
        setLogoActiveUrl(recolored)
      } catch {
        setLogoActiveUrl(originalUrl)
      } finally {
        setLogoProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // ── Logo color change ─────────────────────────────────────────────────────
  async function handleColorChange(hex, isOriginal = false) {
    setLogoColor(hex)
    setUseOriginal(isOriginal)
    if (!logoOriginalUrl) return
    if (isOriginal) { setLogoActiveUrl(logoOriginalUrl); return }
    setLogoProcessing(true)
    try {
      const recolored = await recolorLogo(logoOriginalUrl, hex)
      setLogoActiveUrl(recolored)
    } catch {
      setLogoActiveUrl(logoOriginalUrl)
    } finally {
      setLogoProcessing(false)
    }
  }

  // ── Generate carousel ─────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!topic.trim()) { setError('Enter a topic for your carousel.'); return }
    setLoading(true)
    setError('')
    setCarouselHtml('')
    setProcessedHtml('')
    setExportedPngs([])
    setExportError('')
    setCaption('')

    try {
      const profile = getProfile()
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: 'generateCarousel', data: { topic }, profile }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      let html = data.result
      html = html.replace(/^```html\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      setCarouselHtml(html)
      // Auto-generate caption in parallel
      triggerCaptionGeneration(topic, profile)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Caption generation ────────────────────────────────────────────────────
  async function triggerCaptionGeneration(topicVal, profileVal) {
    setCaptionLoading(true)
    setCaption('')
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'generateCaption',
          data: { topic: topicVal },
          profile: profileVal || getProfile(),
        }),
      })
      const data = await res.json()
      if (res.ok) setCaption(data.result)
    } catch { /* silently fail — caption is bonus */ } finally {
      setCaptionLoading(false)
    }
  }

  // ── Export to PNG via html2canvas ─────────────────────────────────────────
  async function handleExportPngs() {
    if (!processedHtml || exporting) return
    setExporting(true)
    setExportProgress(0)
    setExportedPngs([])
    setExportError('')

    const iframe = exportIframeRef.current
    if (!iframe) {
      setExportError('Export frame not ready — please try again.')
      setExporting(false)
      return
    }

    try {
      // 1. Load HTML into export iframe (no sandbox so scripts run)
      await new Promise((resolve) => {
        const onLoad = () => { iframe.removeEventListener('load', onLoad); resolve() }
        iframe.addEventListener('load', onLoad)
        iframe.srcdoc = processedHtml
      })

      setExportProgress(8)

      // 2. Wait for Google Fonts and images to fully load
      await new Promise(r => setTimeout(r, 3500))
      setExportProgress(15)

      // 3. Inject html2canvas into the iframe
      await new Promise((resolve, reject) => {
        const doc = iframe.contentDocument
        if (!doc) { reject(new Error('Cannot access export frame. Try refreshing.')); return }
        const script = doc.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
        script.onload = resolve
        script.onerror = () => reject(new Error('Failed to load export library. Check your internet connection.'))
        doc.head.appendChild(script)
      })

      setExportProgress(20)

      const iframeDoc = iframe.contentDocument
      const iframeWin = iframe.contentWindow
      const slides    = iframeDoc.querySelectorAll('.slide')

      if (!slides.length) {
        throw new Error('No slides found. Try regenerating the carousel.')
      }

      const SCALE = 1080 / 420
      const pngs  = []

      for (let i = 0; i < slides.length; i++) {
        // Use the exposed goToSlide() function if available — it updates counter + progress bar too
        if (typeof iframeWin.goToSlide === 'function') {
          iframeWin.goToSlide(i)
        } else {
          // Fallback for older-generated carousels
          const track = iframeDoc.querySelector('.carousel-track')
          if (track) {
            track.style.transition = 'none'
            track.style.transform  = `translateX(${-i * 420}px)`
          }
        }

        // Always patch counter + progress bar directly (belt-and-suspenders fix)
        iframeDoc.querySelectorAll('.slide-counter').forEach(el => {
          el.textContent = `${i + 1} / ${slides.length}`
        })
        iframeDoc.querySelectorAll('.progress-fill').forEach(el => {
          el.style.width = `${((i + 1) / slides.length) * 100}%`
        })
        // Also patch any inline counter text patterns like "1/6" or "1 / 6" inside slide elements
        iframeDoc.querySelectorAll('.slide').forEach((slide, slideIdx) => {
          if (slideIdx !== i) return
          slide.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0 && /^\s*\d\s*[/\/]\s*6\s*$/.test(el.textContent)) {
              el.textContent = `${i + 1} / 6`
            }
          })
        })

        await new Promise(r => setTimeout(r, 350))

        const canvas = await iframeWin.html2canvas(slides[i], {
          scale:           SCALE,
          useCORS:         true,
          allowTaint:      false,
          logging:         false,
          width:           420,
          height:          420,
          x:               0,
          y:               0,
          backgroundColor: null,
          imageTimeout:    15000,
        })

        pngs.push(canvas.toDataURL('image/png'))
        setExportProgress(20 + Math.round(((i + 1) / slides.length) * 75))
      }

      setExportedPngs(pngs)
      setExportProgress(100)

      // Clean up export iframe
      setTimeout(() => { try { iframe.srcdoc = '' } catch {} }, 1500)
    } catch (err) {
      setExportError('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  // ── Download single PNG ───────────────────────────────────────────────────
  function handleDownloadPng(dataUrl, slideNum) {
    const safeTopic = topic.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    const a = document.createElement('a')
    a.href     = dataUrl
    a.download = `adsidi-slide-${slideNum}-${safeTopic}.png`
    a.click()
  }

  // ── Download all as ZIP ───────────────────────────────────────────────────
  async function handleDownloadAll() {
    if (!window.JSZip) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
        s.onload  = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })
    }
    const zip      = new window.JSZip()
    const safeTopic = topic.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    exportedPngs.forEach((dataUrl, i) => {
      zip.file(`slide-${i + 1}.png`, dataUrl.split(',')[1], { base64: true })
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `adsidi-carousel-${safeTopic}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Download as PDF (for LinkedIn document carousel) ─────────────────────
  async function handleDownloadPdf() {
    if (!exportedPngs.length) return
    // Load jsPDF from CDN
    if (!window.jspdf) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src     = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload  = resolve
        s.onerror = () => reject(new Error('Failed to load PDF library'))
        document.head.appendChild(s)
      })
    }
    const { jsPDF } = window.jspdf
    // Square pages: 1080×1080px
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [1080, 1080],
      hotfixes: ['px_scaling'],
    })
    exportedPngs.forEach((dataUrl, i) => {
      if (i > 0) pdf.addPage([1080, 1080])
      pdf.addImage(dataUrl, 'PNG', 0, 0, 1080, 1080)
    })
    const safeTopic = topic.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    pdf.save(`adsidi-carousel-${safeTopic}.pdf`)
  }

  // ── Copy caption ──────────────────────────────────────────────────────────
  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(caption)
      setCaptionCopied(true)
      setTimeout(() => setCaptionCopied(false), 2500)
    } catch { /* ignore */ }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto">

      {/* Hidden export iframe — NO sandbox so scripts & fonts run */}
      <iframe
        ref={exportIframeRef}
        title="Export Frame"
        style={{
          position:      'fixed',
          top:           0,
          left:          0,
          width:         '420px',
          height:        '420px',
          opacity:       0,
          pointerEvents: 'none',
          zIndex:        -1,
          border:        'none',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)' }}
          >
            <span className="text-white text-lg font-bold">A</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">LinkedIn Carousel Builder</h2>
            <p className="text-xs text-gray-400">Adsidi-branded · 1080×1080px · 6 slides · PNG export</p>
          </div>
        </div>
      </div>

      {/* ── Logo Upload ─────────────────────────────────────────────────── */}
      <div className="card mb-5">
        <label className="label">Logo (optional)</label>
        <p className="text-xs text-gray-400 mb-4">
          Upload your logo PNG to place on slides 1 &amp; 6. Pick a fill color — we'll recolor it while keeping the exact shape.
        </p>
        <div className="flex items-start gap-5">
          {/* Upload area */}
          <label className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 transition-colors relative overflow-hidden bg-gray-50">
            {logoActiveUrl ? (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background: useOriginal ? '#f9fafb' : logoColor === '#ffffff' ? '#1e1e1e' : '#f9fafb',
                  }}
                />
                <img
                  src={logoActiveUrl}
                  className="relative z-10 w-14 h-14 object-contain"
                  alt="Logo preview"
                />
                {logoProcessing && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                    <span className="spinner border-orange-500 border-t-transparent w-5 h-5" />
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="text-2xl mb-1">🖼️</span>
                <span className="text-xs text-gray-400 text-center leading-tight px-1">Upload<br/>PNG</span>
              </>
            )}
            <input
              type="file"
              accept=".png,image/png"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>

          {/* Color options */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium mb-2">
              {logoOriginalUrl ? 'Recolor to:' : 'Logo color (applied when you upload):'}
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Original */}
              {logoOriginalUrl && (
                <button
                  onClick={() => handleColorChange(logoColor, true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    useOriginal ? 'ring-2 ring-orange-400 border-transparent bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <span className="text-base">🎨</span> Original
                </button>
              )}
              {/* Preset colors */}
              {LOGO_COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleColorChange(opt.value, false)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                    !useOriginal && logoColor === opt.value
                      ? 'ring-2 ring-orange-400 border-transparent bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ background: opt.value }}
                  />
                  {opt.label}
                </button>
              ))}
              {/* Custom color picker */}
              <label
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs cursor-pointer hover:border-orange-300 transition-all"
                title="Pick custom color"
              >
                <input
                  type="color"
                  value={logoColor.startsWith('#') && logoColor.length === 7 ? logoColor : '#ffffff'}
                  onChange={e => handleColorChange(e.target.value, false)}
                  className="w-3.5 h-3.5 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                Custom
              </label>
            </div>
            {!logoOriginalUrl && (
              <p className="text-xs text-gray-400 mt-2">No logo uploaded yet — we'll use the default Adsidi "A" logo.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Topic Input ─────────────────────────────────────────────────── */}
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
            6 slides · Square 1:1 · PNG export · Auto caption · ~45–60s
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

      {/* ── Loading State ───────────────────────────────────────────────── */}
      {loading && (
        <div className="card text-center py-12 fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)' }}
            >
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <span className="text-sm font-medium text-gray-700">Designing your Adsidi carousel...</span>
          </div>
          <div className="flex justify-center gap-2 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg skeleton" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Building 6 slides with your brand colors, typography, and content...</p>
        </div>
      )}

      {/* ── Preview + Export ─────────────────────────────────────────────── */}
      {processedHtml && !loading && (
        <div className="fade-in space-y-5">

          {/* Action bar */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">✅ Carousel Ready</h3>
              <p className="text-xs text-gray-400 mt-0.5">Topic: {topic}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setExportedPngs([])
                  setCaption('')
                  handleGenerate()
                }}
                className="btn-secondary text-xs"
              >
                🔄 Regenerate
              </button>
              <button
                onClick={handleExportPngs}
                disabled={exporting}
                className="btn-primary text-sm"
                style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)', minWidth: '160px' }}
              >
                {exporting
                  ? <><span className="spinner border-white border-t-transparent" /> {exportProgress}%</>
                  : '📸 Export as PNG'
                }
              </button>
            </div>
          </div>

          {/* Export progress bar */}
          {exporting && (
            <div className="card p-3">
              <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
                <span>Exporting slide {Math.max(1, Math.ceil((exportProgress - 20) / 75 * 6))}/6...</span>
                <span className="font-medium">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${exportProgress}%`, background: 'linear-gradient(90deg, #A8001E, #E05520)' }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Loading fonts, rendering slides at 1080×1080px... this takes about 30 seconds.
              </p>
            </div>
          )}

          {exportError && (
            <div className="card border-red-200 bg-red-50 p-3 text-red-700 text-sm">
              ⚠️ {exportError}
            </div>
          )}

          {/* Preview iframe */}
          <div className="card p-0 overflow-hidden">
            <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-gray-400 text-xs ml-2">LinkedIn Carousel Preview</span>
              <span className="ml-auto text-gray-500 text-xs">← → arrows to navigate</span>
            </div>
            <iframe
              srcDoc={processedHtml}
              className="w-full"
              style={{ height: '560px', border: 'none', background: '#1a1a1a' }}
              title="Carousel Preview"
              sandbox="allow-scripts"
            />
          </div>

          {/* Exported PNG grid */}
          {exportedPngs.length > 0 && (
            <div className="card fade-in">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                <div>
                  <h4 className="font-semibold text-gray-900">📸 Exported Slides — Ready to Post</h4>
                  <p className="text-xs text-gray-400 mt-0.5">1080×1080px · Click a slide to download individually</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadAll}
                    className="btn-secondary text-xs"
                  >
                    ⬇️ Download All (.zip)
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="btn-primary text-sm"
                    style={{ background: 'linear-gradient(135deg, #A8001E, #E05520)' }}
                  >
                    📄 Download PDF (LinkedIn)
                  </button>
                </div>
              </div>

              {/* LinkedIn how-to banner */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <p className="font-bold text-blue-900 mb-1">📌 How to post as a proper LinkedIn carousel (swipeable):</p>
                <ol className="list-decimal pl-4 space-y-1 text-blue-700">
                  <li>Click <strong>"Download PDF (LinkedIn)"</strong> above</li>
                  <li>On LinkedIn, click <strong>Start a post</strong></li>
                  <li>Click the <strong>document icon</strong> (📄) — NOT the photo icon</li>
                  <li>Upload the PDF — LinkedIn will turn each page into a swipeable slide</li>
                  <li>Add your caption and post!</li>
                </ol>
                <p className="mt-2 text-blue-600 italic">
                  ⚠️ Uploading individual images (via the photo icon) creates a photo album grid — that's the wrong format.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {exportedPngs.map((dataUrl, i) => (
                  <div
                    key={i}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-100"
                    onClick={() => handleDownloadPng(dataUrl, i + 1)}
                  >
                    <img src={dataUrl} className="w-full block" alt={`Slide ${i + 1}`} />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                      <span className="text-white text-2xl mb-1">⬇️</span>
                      <span className="text-white text-xs font-medium">Download Slide {i + 1}</span>
                    </div>
                    <div
                      className="absolute bottom-1 left-1 text-white text-xs px-1.5 py-0.5 rounded font-medium"
                      style={{ background: 'rgba(0,0,0,0.5)' }}
                    >
                      {i + 1}/6
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LinkedIn Caption */}
          {(captionLoading || caption) && (
            <div className="card border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">💼 LinkedIn Caption</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Ready to paste when you post</p>
                </div>
                <div className="flex items-center gap-2">
                  {!captionLoading && caption && (
                    <>
                      <button
                        onClick={() => triggerCaptionGeneration(topic)}
                        className="btn-secondary text-xs"
                      >
                        🔄 Rewrite
                      </button>
                      <button
                        onClick={handleCopyCaption}
                        className="btn-primary text-xs"
                        style={{ background: captionCopied ? '#16a34a' : 'linear-gradient(135deg, #A8001E, #E05520)' }}
                      >
                        {captionCopied ? '✓ Copied!' : '📋 Copy'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {captionLoading ? (
                <div className="flex items-center gap-3 py-4 text-sm text-gray-500">
                  <span className="spinner border-orange-400 border-t-transparent w-4 h-4 flex-shrink-0" />
                  Writing your LinkedIn caption...
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {caption}
                  </pre>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!processedHtml && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium border-2 border-dashed gap-1"
              style={{
                background:   i % 2 === 0 ? '#FDF0EC' : i === 2 ? 'linear-gradient(135deg, #A8001E, #E05520)' : '#1E0A05',
                borderColor:  i % 2 === 0 ? '#E05520' : 'transparent',
                color:        i % 2 === 0 ? '#E05520' : '#FDF0EC',
              }}
            >
              <span className="text-xs opacity-50">Slide {i + 1}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
