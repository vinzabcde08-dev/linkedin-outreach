// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers — all data persists in localStorage under namespaced keys
// ─────────────────────────────────────────────────────────────────────────────

const KEYS = {
  PROFILE: 'los_profile',
  PROSPECTS: 'los_prospects',
  CONTENT_HISTORY: 'los_content_history',
  LAST_BRIEF: 'los_last_brief',
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
}

// ── Prospects (Application Tracker) ──────────────────────────────────────
export function getProspects() {
  return safeGet(KEYS.PROSPECTS, [])
}

export function saveProspects(prospects) {
  safeSet(KEYS.PROSPECTS, prospects)
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
}

export function addContentBatch(batch) {
  const history = getContentHistory()
  safeSet(KEYS.CONTENT_HISTORY, [batch, ...history].slice(0, 30)) // keep last 30
}

// ── Export / Import (for team sharing) ───────────────────────────────────
export function exportAllData() {
  return {
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    prospects: getProspects(),
    contentHistory: getContentHistory(),
  }
}

export function importData(data) {
  if (data.profile) saveProfile(data.profile)
  if (data.prospects) saveProspects(data.prospects)
  if (data.contentHistory) saveContentHistory(data.contentHistory)
}
