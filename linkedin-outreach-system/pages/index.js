import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { getProspects, getProspectsNeedingFollowUp, loadFromFirestore } from '../lib/storage'

// All page components are client-only — they use localStorage, canvas, FileReader, etc.
// ssr: false prevents Next.js from trying to render them in Node.js at build time.
const ProfileSetup      = dynamic(() => import('../components/ProfileSetup'),      { ssr: false })
const ProspectAnalyzer  = dynamic(() => import('../components/ProspectAnalyzer'),  { ssr: false })
const OutreachGenerator = dynamic(() => import('../components/OutreachGenerator'), { ssr: false })
const ReplyHandler      = dynamic(() => import('../components/ReplyHandler'),      { ssr: false })
const ContentPlanner    = dynamic(() => import('../components/ContentPlanner'),    { ssr: false })
const ApplicationTracker = dynamic(() => import('../components/ApplicationTracker'), { ssr: false })
const ResumeTailor      = dynamic(() => import('../components/ResumeTailor'),      { ssr: false })
const ApplicationLetter = dynamic(() => import('../components/ApplicationLetter'), { ssr: false })
const VideoScript       = dynamic(() => import('../components/VideoScript'),       { ssr: false })
const PricingProposal   = dynamic(() => import('../components/PricingProposal'),   { ssr: false })
const ClientBrief       = dynamic(() => import('../components/ClientBrief'),       { ssr: false })

const SEQUENCE_STEP_LABELS = {
  connection: '🤝 Connection Request',
  firstDm:    '💬 First DM',
  followUp1:  '🔁 Follow-Up 1',
  followUp2:  '🔁 Follow-Up 2',
  followUp3:  '🔁 Follow-Up 3',
}

function getNextPendingStep(prospect) {
  const steps = ['connection', 'firstDm', 'followUp1', 'followUp2', 'followUp3']
  const seq = prospect.outreachSequence || {}
  return steps.find(s => seq[s] && seq[s].text && seq[s].status === 'pending') || null
}

export default function Home() {
  const [mounted, setMounted]             = useState(false)
  const [activeTab, setActiveTab]         = useState('tracker')
  const [currentProspect, setCurrentProspect] = useState(null)
  const [showWelcome, setShowWelcome]     = useState(false)
  const [showReminder, setShowReminder]   = useState(false)
  const [reminderProspects, setReminderProspects] = useState([])
  const [syncStatus, setSyncStatus]       = useState('syncing')

  // Prevent SSR entirely — this app uses localStorage, Firebase, canvas, etc.
  // Render a blank shell on the server; hydrate fully on the client.
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    setSyncStatus('syncing')
    loadFromFirestore()
      .then(() => {
        setSyncStatus('synced')
        const today = new Date().toDateString()
        const lastDismissed = localStorage.getItem('los_reminder_dismissed')
        if (lastDismissed !== today) {
          const needsFollowUp = getProspectsNeedingFollowUp()
          if (needsFollowUp.length > 0) {
            setReminderProspects(needsFollowUp.slice(0, 5))
            setShowReminder(true)
          }
        }
      })
      .catch(() => setSyncStatus('offline'))

    const visited = localStorage.getItem('los_visited')
    if (!visited) {
      setShowWelcome(true)
      localStorage.setItem('los_visited', '1')
    }
  }, [])

  function handleReminderDismiss() {
    localStorage.setItem('los_reminder_dismissed', new Date().toDateString())
    setShowReminder(false)
  }

  function handleReminderGoToTracker() {
    handleReminderDismiss()
    setActiveTab('tracker')
  }

  function handleProspectAnalyzed(prospect) {
    setCurrentProspect(prospect)
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
  }

  // Show blank page on server — full app renders after hydration
  if (!mounted) return (
    <>
      <Head>
        <title>Adsidi Client Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:'#F8FAFC' }}>
        <div style={{ color:'#F97316', fontSize:'14px', fontWeight:600 }}>Loading Adsidi…</div>
      </div>
    </>
  )

  return (
    <>
      <Head>
        <title>Adsidi Client Generator</title>
        <meta name="description" content="Absidi's personal client acquisition and outreach system powered by Claude AI" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔗</text></svg>" />
      </Head>

      {/* Welcome modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl fade-in">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Absidi!</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Your Adsidi Client Generator is ready. Profile pre-loaded from your resume.
            </p>
            <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-6">
              <p><strong>Quick start:</strong></p>
              <p>1. Go to <span className="text-brand-blue font-medium">Profile Setup</span> → verify your info + add LinkedIn URL</p>
              <p>2. Add your <span className="text-brand-blue font-medium">Anthropic API key</span> to Vercel env vars</p>
              <p>3. Start in <span className="text-brand-blue font-medium">Prospect Hub</span> → Analyzer → Outreach → Close</p>
            </div>
            <button onClick={() => setShowWelcome(false)} className="btn-primary w-full">
              Let's Go 🚀
            </button>
          </div>
        </div>
      )}

      {/* Follow-up reminder */}
      {showReminder && !showWelcome && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl fade-in">
            <div className="flex items-start gap-3 mb-4">
              <div className="text-3xl flex-shrink-0">📬</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Time to follow up!</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {reminderProspects.length === 1
                    ? 'You have 1 prospect waiting for a message.'
                    : `You have ${reminderProspects.length} prospects waiting for a message.`}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto">
              {reminderProspects.map(p => {
                const nextStep = getNextPendingStep(p)
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-navy-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(p.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{p.name}</div>
                      {p.company && <div className="text-xs text-gray-400 truncate">{p.company}</div>}
                    </div>
                    {nextStep && (
                      <div className="text-xs text-brand-blue bg-blue-50 px-2 py-1 rounded-full flex-shrink-0 font-medium">
                        {SEQUENCE_STEP_LABELS[nextStep]}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={handleReminderGoToTracker} className="btn-primary flex-1">
                📊 Go to Tracker
              </button>
              <button onClick={handleReminderDismiss} className="btn-secondary flex-1">
                Skip for today
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">
              Resets every day — you'll see this again tomorrow.
            </p>
          </div>
        </div>
      )}

      <Layout activeTab={activeTab} onTabChange={handleTabChange} syncStatus={syncStatus}>
        {/* All tabs mounted — CSS display hide/show keeps state & API calls alive across tab switches */}

        <div style={{ display: activeTab === 'tracker' ? 'block' : 'none' }}>
          <ApplicationTracker />
        </div>

        <div style={{ display: activeTab === 'prospect' ? 'block' : 'none' }}>
          <ProspectAnalyzer
            onProspectAnalyzed={(prospect) => {
              handleProspectAnalyzed(prospect)
            }}
          />
        </div>

        <div style={{ display: activeTab === 'outreach' ? 'block' : 'none' }}>
          <OutreachGenerator prospect={currentProspect} />
        </div>

        <div style={{ display: activeTab === 'reply' ? 'block' : 'none' }}>
          <ReplyHandler />
        </div>

        <div style={{ display: activeTab === 'resume' ? 'block' : 'none' }}>
          <ResumeTailor />
        </div>

        <div style={{ display: activeTab === 'appletter' ? 'block' : 'none' }}>
          <ApplicationLetter />
        </div>

        <div style={{ display: activeTab === 'videoscript' ? 'block' : 'none' }}>
          <VideoScript />
        </div>

        <div style={{ display: activeTab === 'proposal' ? 'block' : 'none' }}>
          <PricingProposal />
        </div>

        <div style={{ display: activeTab === 'brief' ? 'block' : 'none' }}>
          <ClientBrief />
        </div>

        <div style={{ display: activeTab === 'content' ? 'block' : 'none' }}>
          <ContentPlanner />
        </div>

        <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
          <ProfileSetup onProfileSaved={() => {}} />
        </div>

        {process.env.NODE_ENV === 'development' && activeTab !== 'profile' && activeTab !== 'tracker' && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-4 py-2 rounded-full shadow-sm">
            ⚠️ Make sure ANTHROPIC_API_KEY is set in your .env.local file
          </div>
        )}
      </Layout>
    </>
  )
}
