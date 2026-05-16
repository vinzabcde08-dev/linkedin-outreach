// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers — localStorage for instant reads, Firestore for team sync
// Every write goes to both: localStorage (fast) + Firestore (shared across team)
// On app load, call loadFromFirestore() to pull the latest shared data.
// ─────────────────────────────────────────────────────────────────────────────
import { db } from './firebase'
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'

// ── Firestore sync helpers ────────────────────────────────────────────────
// Fire-and-forget: writes to Firestore in background, never blocks the UI
function fsSet(docPath, data) {
  if (typeof window === 'undefined') return
  try {
    const [col, id] = docPath.split('/')
    setDoc(doc(db, col, id), data).catch(e => console.warn('Firestore write failed:', e))
  } catch (e) {
    console.warn('Firestore write failed:', e)
  }
}

// Pull all shared data from Firestore and save to localStorage
// Call this once on app mount to get the latest team data
export async function loadFromFirestore() {
  if (typeof window === 'undefined') return
  try {
    // Profile
    const profileSnap = await getDoc(doc(db, 'app', 'profile'))
    if (profileSnap.exists()) safeSet(KEYS.PROFILE, profileSnap.data())

    // Prospects
    const prospectsSnap = await getDoc(doc(db, 'app', 'prospects'))
    if (prospectsSnap.exists() && prospectsSnap.data().items) {
      safeSet(KEYS.PROSPECTS, prospectsSnap.data().items)
    }

    // Applications
    const appsSnap = await getDoc(doc(db, 'app', 'applications'))
    if (appsSnap.exists() && appsSnap.data().items) {
      safeSet(KEYS.APPLICATIONS, appsSnap.data().items)
    }

    // Content history
    const historySnap = await getDoc(doc(db, 'app', 'contentHistory'))
    if (historySnap.exists() && historySnap.data().items) {
      safeSet(KEYS.CONTENT_HISTORY, historySnap.data().items)
    }

    // Uploaded resume
    const resumeSnap = await getDoc(doc(db, 'app', 'uploadedResume'))
    if (resumeSnap.exists()) safeSet(KEYS.UPLOADED_RESUME, resumeSnap.data())

    console.log('[Sync] Loaded latest data from Firestore')
  } catch (e) {
    console.warn('[Sync] Could not load from Firestore (offline?):', e.message)
  }
}

const KEYS = {
  PROFILE: 'los_profile',
  PROSPECTS: 'los_prospects',
  APPLICATIONS: 'los_applications',
  CONTENT_HISTORY: 'los_content_history',
  LAST_BRIEF: 'los_last_brief',
  UPLOADED_RESUME: 'los_uploaded_resume',
  API_USAGE: 'los_api_usage',
}

// ── Default profile pre-populated from Vinz's resume ──────────────────────
export const DEFAULT_PROFILE = {
  fullName: 'Vinz Abcde V. Betonio',
  preferredName: 'Absidi',
  brandName: 'Absidi / Adsidi Multimedia Services',
  title: 'Operations Lead | Executive Assistant | Broadcast Journalism Trainer | VA Company Founder',
  company: 'Adsidi Multimedia Services',
  location: 'Tacurong City, Philippines (serving US, UK, and global clients)',
  email: 'vinzabcde08@gmail.com',
  phone: '+63 968 266 7221',
  linkedinUrl: '',
  websiteUrl: 'https://adsidi.co',
  portfolioUrl: '',
  timezone: 'Asia/Manila (PHT, UTC+8)',

  toneOfVoice: `Warm, confident, direct, and professional. I don't use jargon or overly formal language — I write the way I talk. I lead with value, keep things concise, and get to the point fast. I'm friendly but purposeful. I never sound like a template or a cold pitch. My messages feel personal and human because they are.`,

  bio: `I'm Absidi (Vinz), a Philippines-based Operations Lead, Executive Assistant, Broadcast Journalism Trainer, and the founder of Adsidi Multimedia Services. I help busy founders, executives, and growing businesses run smoother — through sharp operations support, strategic digital marketing, and high-quality content creation.

I've worked with US and Philippines-based clients across real estate, finance, government, and e-commerce. Whether it's managing a CEO's full calendar and inbox, building and running Facebook Ads campaigns, producing short-form video content, training journalism teams, or building the systems that keep remote teams organized — I get things done, and I do it well.

My VA company, Adsidi Multimedia Services, is built on the belief that great talent from the Philippines can deliver world-class work. I'm not just a freelancer — I'm an operator, a strategist, and a creative all in one.`,

  services: [
    'Executive & Administrative Assistance (EA/VA)',
    'Operations Management & Team Coordination',
    'Digital Marketing Strategy & Execution',
    'Facebook & Instagram Ads (Meta Ads)',
    'Social Media Management & Content Scheduling',
    'Content Creation (Reels, Graphics, Video Editing, Captions)',
    'Broadcast Journalism Training & Media Coaching',
    'CRM Management (HubSpot, Zoho, GoHighLevel)',
    'Lead Generation & Prospecting',
    'Email & Calendar Management',
    'Project & Task Management (Trello, Notion, Asana)',
    'Data Entry, File Organization & Documentation',
    'Customer Support (Chat, Email, Phone)',
    'VA Team Staffing & Management',
  ],

  tools: [
    'Adobe Photoshop', 'Premiere Pro', 'After Effects', 'Illustrator',
    'Canva / Canva Pro', 'CapCut', 'FL Studio',
    'Meta Business Suite', 'Buffer',
    'HubSpot', 'Zoho', 'GoHighLevel',
    'Trello', 'Notion', 'Google Workspace', 'Microsoft Office',
    'Slack', 'Zoom', 'Zapier', 'ChatGPT',
    'Shopify', 'WooCommerce',
  ],

  targetClients: `Founders, CEOs, and business owners in the US and UK who are overwhelmed and need a reliable right-hand person. Real estate companies needing marketing operations support. Startups scaling their remote teams. Media companies and news organizations needing broadcast journalism training. Businesses that want to hire top Filipino talent for quality work at competitive rates. Any executive who's doing $5K–$50K/month and needs someone to handle the "everything else."`,

  monthlyBudget: 10,
  anthropicBalance: 0,

  linkedinGoal: `Grow my client base for Adsidi Multimedia Services, position myself as the go-to Operations Lead and EA in the VA industry, and build a personal brand on LinkedIn as a Filipino entrepreneur, marketer, and trainer. I want to be known as someone who delivers results — not just another VA.`,

  achievements: [
    'Promoted to Marketing Team Lead at M Group Capital after strong campaign performance',
    'Founded Adsidi Multimedia Services — multimedia production company serving public sector and private clients',
    'Co-founded Sonic Roots Pro Audio Rental — operations, sales, and client management',
    'Served as Production Manager for Office of Gov. Datu Pax Ali S. Mangudadatu',
    'Managed marketing operations across real estate, finance, and public sector clients simultaneously',
    'Worked as CEO Executive Assistant at Data Samurai managing executive-level workflows',
  ],

  resumeText: `VINZ ABCDE V. BETONIO
Tacurong City, Philippines | +63 968 266 7221 | vinzabcde08@gmail.com

WORK EXPERIENCE
Brandit LLC — Data Entry Specialist (2026–Present, Part-time)
Data Samurai — CEO Executive Assistant & Social Consultant (2026–Present, Part-time)
M Group Capital & M Group Residential — Marketing Team Lead & Facebook Ads Specialist (2025–Present, Part-time)
Aguinaldo Business Management Services — Digital Marketing & Facebook Ads Specialist (Sep 2023–2025, Full-time)
The M&A Advisor — Administrative Support & Digital Marketing Specialist (Sep 2023–2025, Full-time)
EquestrianHousePA — Content Creator & Digital Marketing Specialist (2023–2025, Full-time)
J&C Support Ltd. — E-commerce Photo Editor (2022–2023, Part-time)

LEADERSHIP EXPERIENCE
Adsidi Multimedia Services — Owner & CEO (2024–Present)
Sonic Roots Pro Audio Rental — Co-owner & Managing Director (2023–Present)
Office of Gov. Datu Pax Ali S. Mangudadatu — Production Manager / Reels Editor & Graphics Designer (2022–2025)
Office of Cong. Marly Hofer Hasim — Reels Editor & Graphics Designer (2022–2025, Part-time)

EDUCATION
Notre Dame of Tacurong College — BA Political Science (2021–2025)

SKILLS
Digital Marketing & Social Media Management, Content Creation, Executive & Administrative Assistance,
CRM Systems (HubSpot, Zoho, GoHighLevel), Lead Generation, Project & Task Management,
Email & Calendar Management, Customer Support, Data Entry & Documentation`,
}

// ── Generic get/set helpers ───────────────────────────────────────────────
function safeGet(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key, value) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage write failed:', e)
  }
}

// ── Profile ───────────────────────────────────────────────────────────────
export function getProfile() {
  return safeGet(KEYS.PROFILE, DEFAULT_PROFILE)
}

export function saveProfile(profile) {
  safeSet(KEYS.PROFILE, profile)
  fsSet('app/profile', profile)
}

// ── Prospects (Application Tracker) ──────────────────────────────────────
export function getProspects() {
  return safeGet(KEYS.PROSPECTS, [])
}

export function saveProspects(prospects) {
  safeSet(KEYS.PROSPECTS, prospects)
  fsSet('app/prospects', { items: prospects, updatedAt: new Date().toISOString() })
}

export function addProspect(prospect) {
  const prospects = getProspects()
  const newProspect = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'identified',
    ...prospect,
  }
  saveProspects([newProspect, ...prospects])
  return newProspect
}

export function updateProspect(id, updates) {
  const prospects = getProspects()
  const updated = prospects.map(p =>
    p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
  )
  saveProspects(updated)
}

export function deleteProspect(id) {
  const prospects = getProspects()
  saveProspects(prospects.filter(p => p.id !== id))
}

// ── Outreach Sequence helpers ─────────────────────────────────────────────
// sequence = { connection, firstDm, followUp1, followUp2, followUp3 }
// each step = { text: '', status: 'pending'|'sent'|'skipped', sentAt: null }
export function saveOutreachSequence(prospectId, sequence) {
  updateProspect(prospectId, { outreachSequence: sequence })
}

export function markStepSent(prospectId, stepKey) {
  const prospect = getProspects().find(p => p.id === prospectId)
  if (!prospect) return
  const seq = { ...(prospect.outreachSequence || {}) }
  seq[stepKey] = { ...(seq[stepKey] || {}), status: 'sent', sentAt: new Date().toISOString() }
  updateProspect(prospectId, { outreachSequence: seq })
}

export function markStepUnsent(prospectId, stepKey) {
  const prospect = getProspects().find(p => p.id === prospectId)
  if (!prospect) return
  const seq = { ...(prospect.outreachSequence || {}) }
  seq[stepKey] = { ...(seq[stepKey] || {}), status: 'pending', sentAt: null }
  updateProspect(prospectId, { outreachSequence: seq })
}

// ── Conversation Log helpers ──────────────────────────────────────────────
// type: 'sent' | 'received' | 'note'
export function addConversationEntry(prospectId, type, text) {
  const prospect = getProspects().find(p => p.id === prospectId)
  if (!prospect) return
  const log = [...(prospect.conversationLog || [])]
  log.push({
    id: Date.now().toString(),
    type,
    text,
    timestamp: new Date().toISOString(),
  })
  updateProspect(prospectId, { conversationLog: log })
}

export function deleteConversationEntry(prospectId, entryId) {
  const prospect = getProspects().find(p => p.id === prospectId)
  if (!prospect) return
  const log = (prospect.conversationLog || []).filter(e => e.id !== entryId)
  updateProspect(prospectId, { conversationLog: log })
}

// ── Follow-up reminder ────────────────────────────────────────────────────
// Returns prospects that have at least one step with a saved message still pending
export function getProspectsNeedingFollowUp() {
  const prospects = getProspects()
  const steps = ['connection', 'firstDm', 'followUp1', 'followUp2', 'followUp3']
  return prospects.filter(p => {
    if (['closed_won', 'closed_lost'].includes(p.status)) return false
    const seq = p.outreachSequence || {}
    return steps.some(s => seq[s] && seq[s].text && seq[s].status === 'pending')
  })
}

// ── Applications (Applications Hub) ──────────────────────────────────────
export function getApplications() {
  return safeGet(KEYS.APPLICATIONS, [])
}

export function saveApplications(apps) {
  safeSet(KEYS.APPLICATIONS, apps)
  fsSet('app/applications', { items: apps, updatedAt: new Date().toISOString() })
}

export function addApplication(app) {
  const apps = getApplications()
  const newApp = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'researching',
    checklistState: {},
    notes: '',
    ...app,
  }
  saveApplications([newApp, ...apps])
  return newApp
}

export function updateApplication(id, updates) {
  const apps = getApplications()
  const updated = apps.map(a =>
    a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
  )
  saveApplications(updated)
}

export function deleteApplication(id) {
  const apps = getApplications()
  saveApplications(apps.filter(a => a.id !== id))
}

// ── Last Brief (carried from Analyzer → Outreach Generator) ──────────────
export function getLastBrief() {
  return safeGet(KEYS.LAST_BRIEF, null)
}

export function saveLastBrief(brief) {
  safeSet(KEYS.LAST_BRIEF, brief)
}

// ── Content History ───────────────────────────────────────────────────────
export function getContentHistory() {
  return safeGet(KEYS.CONTENT_HISTORY, [])
}

export function saveContentHistory(history) {
  safeSet(KEYS.CONTENT_HISTORY, history)
  fsSet('app/contentHistory', { items: history, updatedAt: new Date().toISOString() })
}

export function addContentBatch(batch) {
  const history = getContentHistory()
  safeSet(KEYS.CONTENT_HISTORY, [batch, ...history].slice(0, 30)) // keep last 30
}

// ── Full structured resume data (from PDF) ───────────────────────────────
export const FULL_RESUME_DATA = {
  workExperience: [
    {
      company: 'Brandit LLC',
      location: 'Pennsylvania (Remote)',
      roles: [{
        title: 'Data Entry Specialist',
        dates: '2026 - Present (Part-time)',
        bullets: [
          'Accurately encoded product orders and maintained up-to-date records in the system.',
          'Edited and updated signage details to ensure consistency and accuracy across listings.',
          'Supported operational efficiency by organizing and verifying product information.',
        ],
      }],
    },
    {
      company: 'Data Samurai',
      location: 'Louisiana (Remote)',
      roles: [{
        title: 'CEO Executive Assistant and Social Consultant',
        dates: '2026 - Present (Part-time)',
        bullets: [
          'Managed executive-level administrative tasks including scheduling, communications, and workflow coordination.',
          'Developed and executed social media strategies to enhance brand visibility and engagement.',
          'Created and curated content aligned with brand voice and marketing objectives.',
          'Analyzed performance metrics to refine content strategy and improve audience reach.',
        ],
      }],
    },
    {
      company: 'M Group Capital & M Group Residential',
      location: 'Dallas, Texas (Remote)',
      roles: [
        {
          title: 'Marketing Team Lead and Facebook Ads Specialist',
          dates: '2025 - Present (Part-time)',
          bullets: [
            'Promoted to lead the marketing team after demonstrating strong performance in campaign execution and cross-team coordination.',
            'Oversaw daily marketing operations including task delegation, content scheduling, and quality control across platforms.',
            'Coordinated with leadership to align marketing initiatives with real estate branding, lead generation, and sales goals.',
            'Reviewed analytics and campaign performance to optimize marketing strategies and improve conversion potential.',
          ],
        },
        {
          title: 'Marketing Assistant',
          dates: '',
          bullets: [
            'Supported marketing campaigns for real estate investment and residential properties under M Group Capital and M Group Residential.',
            'Created and scheduled marketing content including graphics, short-form videos, and captions for social media platforms.',
            'Assisted with lead tracking, CRM updates, and campaign reporting to support sales and marketing alignment.',
            'Collaborated with designers, sales teams, and management to ensure brand consistency across all marketing materials.',
          ],
        },
      ],
    },
    {
      company: 'Aguinaldo Business Management Services',
      location: 'New York, USA (Remote)',
      roles: [{
        title: 'Digital Marketing Specialist and Facebook Ads Specialist',
        dates: 'September 2023 – 2025 (Full-time)',
        bullets: [
          'Developed and managed Facebook and Instagram campaigns, creating graphics, reels, and copy to support lead generation and brand growth initiatives.',
        ],
      }],
    },
    {
      company: 'The M&A Advisor',
      location: 'New York, USA (Remote)',
      roles: [{
        title: 'Administrative Support & Digital Marketing Specialist',
        dates: 'September 2023 – 2025 (Full-time)',
        bullets: [
          'Provided end-to-end administrative support including calendar management, inbox handling, document preparation, and internal coordination.',
          'Assisted with client onboarding, meeting logistics, and virtual event execution to support daily business operations.',
          'Maintained CRM records, supported sponsorship and registration campaigns, and ensured timely follow-ups.',
          'Coordinated with cross-functional teams to improve operational efficiency and execution accuracy.',
        ],
      }],
    },
    {
      company: 'EquestrianHousePA',
      location: 'New York, USA (Remote)',
      roles: [{
        title: 'Content Creator & Digital Marketing Specialist',
        dates: '2023 – 2025 (Full-time)',
        bullets: [
          'Led social media and email marketing campaigns for award nominations, events, and brand promotions.',
          'Designed visual assets and wrote promotional copy to drive registrations, nominations, and audience engagement.',
          'Executed campaign launches across multiple platforms, ensuring consistency in messaging and branding.',
          'Increased online visibility through structured content calendars and performance-driven execution.',
        ],
      }],
    },
    {
      company: 'J&C Support Ltd.',
      location: 'Remote',
      roles: [{
        title: 'E-commerce Photo Editor',
        dates: '2022 – 2023 (Part-time)',
        bullets: [
          'Edited and optimized 200+ product images monthly for Bol.com e-commerce listings.',
          'Applied background removal, color correction, retouching, and layout optimization to meet platform standards.',
          'Improved product presentation quality, contributing to increased customer engagement and conversion potential.',
        ],
      }],
    },
  ],
  leadershipExperience: [
    {
      company: 'Adsidi Multimedia Services',
      location: 'General Santos City, Philippines',
      roles: [{
        title: 'Owner & Chief Executive Officer (CEO)',
        dates: '2024 – Present',
        bullets: [
          'Founded and currently lead a multimedia production company delivering video editing, graphic design, and digital content for public service, campaigns, and private clients.',
          'Directed creative strategy, content production, and project execution from concept development to final delivery.',
          'Managed client relationships, timelines, and production workflows to ensure consistent quality and on-time delivery.',
          'Oversaw technical setup and production support for events and campaign initiatives.',
        ],
      }],
    },
    {
      company: 'Sonic Roots Pro Audio Rental',
      location: 'Tacurong City, Philippines',
      roles: [{
        title: 'Co-owner & Managing Director',
        dates: '2023 – Present',
        bullets: [
          'Co-founded and manage a professional audio equipment rental business serving events, churches, and community programs.',
          'Led sales, marketing, and client acquisition efforts including inquiries, quotations, bookings, and customer follow-ups.',
          'Handled hands-on technical operations such as sound system setup, equipment installation, testing, and live event support.',
          'Developed branding assets and promotional materials to increase local visibility and repeat bookings.',
          'Managed logistics, inventory tracking, and equipment maintenance to ensure service reliability.',
        ],
      }],
    },
    {
      company: 'Office of Gov. Datu Pax Ali S. Mangudadatu',
      location: 'Isulan, Sultan Kudarat',
      roles: [{
        title: 'Production Manager / Reels Editor & Graphics Designer',
        dates: '2022 – 2025 (Full-time)',
        bullets: [
          'Led multimedia production for public service communications and campaign initiatives.',
          'Collaborated with executive staff to translate messaging into visually compelling reels and graphics.',
          'Applied trend-based design and storytelling techniques to strengthen digital presence and audience engagement.',
        ],
      }],
    },
    {
      company: 'Office of Cong. Marly Hofer Hasim',
      location: 'Zamboanga Sibugay (Remote)',
      roles: [{
        title: 'Reels Editor & Graphics Designer',
        dates: '2022 – 2025 (Part-time)',
        bullets: [
          'Produced reels, graphics, and multimedia content for public information and campaign communications.',
          'Supported production planning, content scheduling, and technical execution for digital initiatives.',
          'Delivered consistent, high-quality outputs under tight timelines.',
        ],
      }],
    },
  ],
  education: [{
    school: 'Notre Dame of Tacurong College',
    location: 'Tacurong City, Philippines',
    degree: 'Bachelor of Arts in Political Science',
    dates: '2021 – 2025',
  }],
  skills: {
    skillsList: [
      'Digital Marketing & Social Media Management',
      'Music Production',
      'Content Creation (Reels, Graphics, Video Editing, Captions)',
      'Executive & Administrative Assistance',
      'CRM Systems (HubSpot, Zoho, GoHighLevel)',
      'Lead Generation & Prospecting',
      'Client Relationship Management',
      'Project & Task Management',
      'Email & Calendar Management',
      'Customer Support (Chat, Email, Phone)',
      'Data Entry, File Organization & Documentation',
    ],
    technicalTools: 'Adobe Photoshop, Premiere Pro, After Effects, Illustrator, FL Studio, Canva/Canva Pro, Meta Business Suite, Buffer, Trello, Notion, Google Workspace, Microsoft Office, Slack, Zoom, Shopify, WooCommerce, Zapier, CapCut, ChatGPT',
    interests: [
      'Multimedia production and creative storytelling',
      'Digital marketing strategy and campaign optimization',
      'Music production and audio enhancement',
      'Exploring AI-powered tools for creative and productivity workflows',
    ],
  },
}

// ── Uploaded Resume (replaces FULL_RESUME_DATA when set) ─────────────────
export function getUploadedResume() {
  return safeGet(KEYS.UPLOADED_RESUME, null)
}

export function saveUploadedResume(data) {
  const payload = { ...data, _uploadedAt: new Date().toISOString() }
  safeSet(KEYS.UPLOADED_RESUME, payload)
  fsSet('app/uploadedResume', payload)
}

export function clearUploadedResume() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(KEYS.UPLOADED_RESUME) } catch {}
}

// ── Export / Import (for team sharing) ───────────────────────────────────
export function exportAllData() {
  return {
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    prospects: getProspects(),
    applications: getApplications(),
    contentHistory: getContentHistory(),
  }
}

export function importData(data) {
  if (data.profile) saveProfile(data.profile)
  if (data.prospects) saveProspects(data.prospects)
  if (data.applications) saveApplications(data.applications)
  if (data.contentHistory) saveContentHistory(data.contentHistory)
}

// ── API Usage / Credit Tracking ───────────────────────────────────────────
// Pricing: Claude Sonnet claude-sonnet-4-6 = $3/MTok input, $15/MTok output
const INPUT_COST_PER_M  = 3.00   // $ per 1M input tokens
const OUTPUT_COST_PER_M = 15.00  // $ per 1M output tokens

function getUsageRaw() {
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const stored = safeGet(KEYS.API_USAGE, null)
  if (!stored || stored.month !== currentMonth) {
    // New month — reset
    return { month: currentMonth, inputTokens: 0, outputTokens: 0, calls: 0, byTool: {} }
  }
  return stored
}

export function getUsage() {
  return getUsageRaw()
}

export function calcCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * INPUT_COST_PER_M +
         (outputTokens / 1_000_000) * OUTPUT_COST_PER_M
}

export function recordApiUsage(inputTokens = 0, outputTokens = 0, toolName = 'unknown') {
  if (typeof window === 'undefined') return
  const usage = getUsageRaw()
  usage.inputTokens  += inputTokens
  usage.outputTokens += outputTokens
  usage.calls        += 1
  if (!usage.byTool[toolName]) {
    usage.byTool[toolName] = { inputTokens: 0, outputTokens: 0, calls: 0 }
  }
  usage.byTool[toolName].inputTokens  += inputTokens
  usage.byTool[toolName].outputTokens += outputTokens
  usage.byTool[toolName].calls        += 1
  safeSet(KEYS.API_USAGE, usage)
}

export function clearUsage() {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(KEYS.API_USAGE) } catch {}
}

// ── Prospect Doc Storage (resume, letter, proposal, brief, video script) ──
// docType: 'tailoredResume' | 'applicationLetter' | 'pricingProposal' | 'clientBrief' | 'videoScript'
export function saveProspectDoc(prospectId, docType, content) {
  if (!prospectId || !docType) return
  updateProspect(prospectId, {
    [`docs_${docType}`]: content,
    [`docs_${docType}_savedAt`]: new Date().toISOString(),
  })
}
