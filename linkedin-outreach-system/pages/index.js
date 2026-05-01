import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import ProfileSetup from '../components/ProfileSetup'
import ProspectAnalyzer from '../components/ProspectAnalyzer'
import OutreachGenerator from '../components/OutreachGenerator'
import ReplyHandler from '../components/ReplyHandler'
import ContentPlanner from '../components/ContentPlanner'
import ApplicationTracker from '../components/ApplicationTracker'
import ResumeTailor from '../components/ResumeTailor'
import ApplicationLetter from '../components/ApplicationLetter'
import { getProspects } from '../lib/storage'

export default function Home() {
  const [activeTab, setActiveTab] = useState('profile')
  const [currentProspect, setCurrentProspect] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)

  // Check if first visit
  useEffect(() => {
    const visited = localStorage.getItem('los_visited')
    if (!visited) {
      setShowWelcome(true)
      localStorage.setItem('los_visited', '1')
    }
  }, [])

  function handleProspectAnalyzed(prospect) {
    setCurrentProspect(prospect)
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
  }

  return (
    <>
      <Head>
        <title>Absidi LinkedIn Outreach System</title>
        <meta name="description" content="Absidi's personal LinkedIn outreach and content system powered by Claude AI" />
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
              Your LinkedIn Outreach System is ready. Your profile is pre-loaded with your information from your resume.
            </p>
            <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-6">
              <p><strong>Before you start:</strong></p>
              <p>1. Go to <span className="text-brand-blue font-medium">Profile Setup</span> and verify your info</p>
              <p>2. Add your <span className="text-brand-blue font-medium">LinkedIn URL</span></p>
              <p>3. Add your <span className="text-brand-blue font-medium">Anthropic API key</span> to your Vercel environment</p>
              <p>4. Start with <span className="text-brand-blue font-medium">Prospect Analyzer</span> → then Outreach Generator</p>
            </div>
            <button
              onClick={() => setShowWelcome(false)}
              className="btn-primary w-full"
            >
              Let's Go 🚀
            </button>
          </div>
        </div>
      )}

      <Layout activeTab={activeTab} onTabChange={handleTabChange}>
        {/* Profile Setup */}
        {activeTab === 'profile' && (
          <ProfileSetup onProfileSaved={() => {}} />
        )}

        {/* Prospect Analyzer */}
        {activeTab === 'prospect' && (
          <ProspectAnalyzer
            onProspectAnalyzed={(prospect) => {
              handleProspectAnalyzed(prospect)
            }}
          />
        )}

        {/* Outreach Generator */}
        {activeTab === 'outreach' && (
          <OutreachGenerator prospect={currentProspect} />
        )}

        {/* Reply Handler */}
        {activeTab === 'reply' && (
          <ReplyHandler />
        )}

        {/* Resume Tailor */}
        {activeTab === 'resume' && (
          <ResumeTailor />
        )}

        {/* Application Letter */}
        {activeTab === 'appletter' && (
          <ApplicationLetter />
        )}

        {/* Content Planner */}
        {activeTab === 'content' && (
          <ContentPlanner />
        )}

        {/* Application Tracker */}
        {activeTab === 'tracker' && (
          <ApplicationTracker />
        )}

        {/* API key not set warning — shown on all pages when in development */}
        {process.env.NODE_ENV === 'development' && activeTab !== 'profile' && activeTab !== 'tracker' && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-4 py-2 rounded-full shadow-sm">
            ⚠️ Make sure ANTHROPIC_API_KEY is set in your .env.local file
          </div>
        )}
      </Layout>
    </>
  )
}
