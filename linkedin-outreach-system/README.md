# Adsidi Client Generator

A personal client acquisition and outreach system built for **Vinz "Absidi" Betonio** — powered by Claude AI (Anthropic). Deploy on Vercel in under 5 minutes.

## Features

| Group | Feature | What it does |
|-------|---------|--------------|
| 📊 Pipeline | **Prospect Hub** | Full CRM — track every prospect, status, notes, and follow-up sequence |
| 📊 Pipeline | **Prospect Analyzer** | Paste a LinkedIn profile → get a full outreach brief with pain points and angles |
| 📊 Pipeline | **Outreach Generator** | Generate connection request + first DM + 3 follow-ups in your voice |
| 📊 Pipeline | **Reply Handler** | Paste their reply → get analysis + the best response to move toward a deal |
| 📄 Materials | **Resume Tailor** | Tailor your resume for each specific client or job posting |
| 📄 Materials | **Application Letter** | Generate personalized cover letters with full job context |
| 📄 Materials | **Video Script** | Record-ready intro or pitch video scripts |
| 💰 Close & Prep | **Pricing Proposal** | Generate a full service proposal with pricing table, terms, and next steps |
| 💰 Close & Prep | **Client Brief** | Pre-meeting intel — conversation history, pain points, talking points, red flags |
| 🎨 Content | **Content Studio** | 5 daily LinkedIn content ideas with hooks + Adsidi-branded carousel builder |
| ⚙️ Settings | **Profile Setup** | Store your info, tone, services — paste your resume to auto-fill everything |

---

## Quick Setup (5 minutes)

### Step 1 — Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys → Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Deploy to Vercel

1. Push this `linkedin-outreach-system` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Set **Root Directory** to `linkedin-outreach-system`
4. Add environment variable: `ANTHROPIC_API_KEY` = your key from Step 1
5. Click **Deploy**

### Step 3 — First launch

1. Open your deployed URL
2. Go to **Profile Setup → Auto-fill** tab
3. Paste your resume or LinkedIn bio → Claude fills in everything automatically
4. Click **Save Profile**
5. Start with **Prospect Hub** to add your first prospect

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Your Anthropic API key from console.anthropic.com |

---

## Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **AI:** Claude claude-sonnet-4-6 via Anthropic SDK
- **Styling:** Tailwind CSS
- **Storage:** localStorage (browser) + Firebase Firestore (cloud sync)
- **Deployment:** Vercel

---

## Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run development server
npm run dev
# Open http://localhost:3000
```

---

Built by **Adsidi Multimedia Services** · Powered by Claude AI
