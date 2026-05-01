# Absidi LinkedIn Outreach System

A personal LinkedIn outreach and content system built for **Vinz "Absidi" Betonio** — powered by Claude AI (Anthropic). Deploy on Vercel in under 5 minutes.

---

## Features

| Feature | What it does |
|---|---|
| 👤 **Profile Setup** | Store your info, tone of voice, services, and resume — pre-loaded with your data |
| 🔍 **Prospect Analyzer** | Paste a LinkedIn profile → get a full outreach brief with pain points and angles |
| ✉️ **Outreach Generator** | Generate connection request + first DM + 3 follow-ups in your voice |
| 💬 **Reply Handler** | Paste their reply → get analysis + the best response to move toward a deal |
| 📅 **Content Planner** | 5 LinkedIn content ideas daily with hooks, formats, and full scripts |
| 📊 **Application Tracker** | Track every prospect with status, notes, and next actions |

---

## Quick Setup (5 minutes)

### Step 1 — Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

---

### Step 2 — Deploy to Vercel

**Option A: One-click deploy (easiest)**

1. Upload this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. In the **Environment Variables** section, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-your-key-here`
5. Click **Deploy**

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# In this project folder:
vercel

# Set the environment variable
vercel env add ANTHROPIC_API_KEY
# Paste your API key when prompted

# Redeploy
vercel --prod
```

---

### Step 3 — Run locally (for testing)

```bash
# Install dependencies
npm install

# Create your local env file
cp .env.example .env.local

# Edit .env.local and add your API key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start the development server
npm run dev

# Open http://localhost:3000
```

---

## Sharing with Your Team

Since this uses **browser localStorage**, each team member has their own data. To share data across your team:

**Short-term solution (included):**
- Use the **Export JSON** button in the Tracker to export all your data
- Share the `.json` file with teammates
- They import it using the **Import** button

**Long-term solution (optional upgrade):**
To sync data across devices/teammates, you can connect a free database:
- [Supabase](https://supabase.com) (free PostgreSQL, easiest)
- [PlanetScale](https://planetscale.com) (free MySQL)
- [Firebase](https://firebase.google.com) (free NoSQL)

---

## Updating Your Profile

Since you add new clients regularly:
1. Go to **Profile Setup** → **Resume Text** tab
2. Paste your latest resume
3. Hit **Save Profile**

Claude will use your updated background in all future outputs.

---

## Tech Stack

- **Framework:** Next.js 14 (React)
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude (claude-sonnet-4-6)
- **Storage:** Browser localStorage (+ JSON export/import)
- **Deployment:** Vercel

---

## Cost Estimate

Each AI request uses approximately 1,000–4,000 tokens. With Anthropic's pricing:
- Prospect analysis: ~$0.01–0.02 per brief
- Outreach sequence: ~$0.02–0.04 per sequence
- Content ideas: ~$0.02–0.04 per batch
- Reply handler: ~$0.01–0.02 per reply

**Estimated monthly cost for daily use: $5–20/month** depending on usage volume.

---

## Project Structure

```
linkedin-outreach-system/
├── pages/
│   ├── index.js              # Main app (tab navigation)
│   ├── _app.js               # App wrapper
│   └── api/
│       └── claude.js         # Claude AI API route (server-side)
├── components/
│   ├── Layout.js             # Sidebar nav + header
│   ├── ProfileSetup.js       # Profile editor (pre-loaded with your info)
│   ├── ProspectAnalyzer.js   # LinkedIn prospect research
│   ├── OutreachGenerator.js  # Message sequence generator
│   ├── ReplyHandler.js       # Reply analysis + response writer
│   ├── ContentPlanner.js     # Daily LinkedIn content ideas
│   └── ApplicationTracker.js # Prospect CRM tracker
├── lib/
│   └── storage.js            # localStorage helpers + your default profile
├── styles/
│   └── globals.css           # Global styles + Tailwind
├── .env.example              # Environment variable template
└── README.md                 # This file
```

---

## Security Notes

- Your `ANTHROPIC_API_KEY` is **never exposed to the browser** — all AI calls go through the Next.js API route
- Never commit your `.env.local` file to Git (it's in `.gitignore`)
- Add your API key via Vercel's environment variables dashboard, not in code

---

Built for Vinz "Absidi" Betonio · Adsidi Multimedia Services · Philippines
