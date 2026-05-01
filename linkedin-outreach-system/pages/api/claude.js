import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─────────────────────────────────────────────────────────────────────────────
// System prompt builder — gives Claude full context about Absidi
// ─────────────────────────────────────────────────────────────────────────────
function buildSystemPrompt(profile) {
  const name = profile?.preferredName || 'Absidi'
  const title = profile?.title || 'Operations Lead | Executive Assistant | VA Company Founder'
  const company = profile?.company || 'Adsidi Multimedia Services'
  const location = profile?.location || 'Tacurong City, Philippines'
  const services = (profile?.services || []).join(', ')
  const tone = profile?.toneOfVoice || 'Warm, confident, direct, and professional'
  const bio = profile?.bio || ''
  const targetClients = profile?.targetClients || ''
  const tools = (profile?.tools || []).join(', ')
  const achievements = (profile?.achievements || []).join('\n- ')
  const linkedinGoal = profile?.linkedinGoal || ''
  const websiteUrl = profile?.websiteUrl || 'https://adsidi.co'
  const portfolioUrl = profile?.portfolioUrl || ''

  return `You are the AI outreach and content assistant for ${name}, a Philippines-based professional.

## WHO ${name.toUpperCase()} IS
- Full name: Vinz Abcde V. Betonio (goes by "${name}" as a brand/professional name)
- Title: ${title}
- Company: ${company}
- Location: ${location}
- Education: BA Political Science, Notre Dame of Tacurong College (2021–2025)

## BIO
${bio}

## SERVICES OFFERED
${services}

## TOOLS & TECH STACK
${tools}

## KEY ACHIEVEMENTS
- ${achievements}

## TARGET CLIENTS
${targetClients}

## LINKEDIN GOAL
${linkedinGoal}

## WEBSITE & PORTFOLIO
- Company website: ${websiteUrl}
- Portfolio: ${portfolioUrl || '(not set — use website URL when asked)'}
When a prospect asks for a portfolio, website, or examples of work, reference these URLs naturally in the response.

## TONE OF VOICE
${tone}

## TONE GUIDELINES
When writing AS ${name}:
- Sound like a real person, not a template
- Be warm and approachable, never stiff or corporate
- Lead with value or a specific insight — don't open with "I wanted to reach out"
- Keep it concise and punchy — short paragraphs, no fluff
- Be confident without being pushy
- Reference specific details when possible — show you did your homework
- Use light Filipino warmth where natural (no slang, just genuine friendliness)
- Never use: "I hope this message finds you well", "I came across your profile", "synergy", "leverage"
- Always have a clear, low-pressure call to action

## IMPORTANT
Always write in ${name}'s voice. Every output should sound like it came from them personally — not from a bot, not from a generic template, and not from a copywriter.`
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature prompt builders
// ─────────────────────────────────────────────────────────────────────────────
function buildAnalyzeProspectPrompt(prospectInput) {
  return `Analyze this LinkedIn prospect profile and produce a detailed outreach brief for me.

## PROSPECT PROFILE / URL
${prospectInput}

## YOUR TASK
Research this person (use what's in the profile + your knowledge about their company/industry) and provide a structured brief with exactly these sections:

---
## 🧑 PROSPECT OVERVIEW
**Name:** [Full name]
**Title:** [Current role]
**Company:** [Company name]
**Industry:** [Industry]
**Location:** [Location]
**Profile Summary:** [2–3 sentences about who they are and what they do]

## 🏢 COMPANY OVERVIEW
**What they do:** [Clear description]
**Company size:** [Approximate headcount / stage]
**Target market:** [Who are their customers]
**Recent news or signals:** [Anything notable — funding, hiring, expansion, content they posted]

## 😩 PAIN POINTS & CHALLENGES
[List 4–6 specific operational, marketing, or team challenges this person/company likely faces based on their role, industry, and company stage. Be specific, not generic.]

## 💡 WHY THEY NEED ME
[Based on their pain points and my services, explain specifically which 2–3 services I offer that would help them most, and WHY. Connect the dots clearly.]

## 🎯 OUTREACH ANGLE
[The single best hook or angle to approach this person. What will make them stop and read? What specific pain point or observation should I lead with?]

## 💬 CONVERSATION STARTER
[One specific detail, achievement, or piece of content from their profile I can reference to show I actually looked at their profile — not just a generic mention]

## 🌡️ WARMTH SCORE
[Score from 1–10, where 10 = perfect fit, high-intent. Include 1 sentence explaining the score.]
---

Be specific and actionable. This brief will be used to write personalized LinkedIn outreach messages.`
}

function buildGenerateOutreachPrompt(brief, prospectName) {
  return `Based on this prospect brief, write a complete LinkedIn outreach sequence for me to use.

## PROSPECT BRIEF
${brief}

## YOUR TASK
Write the full outreach sequence below. Each message should sound like me — warm, confident, direct, and professional. Not a template.

---
## ✉️ 1. CONNECTION REQUEST
(Under 300 characters. Personal, specific, not salesy. Makes them curious enough to accept.)

[Write the connection request here]

**Character count:** [X/300]

---
## 💬 2. FIRST DM (After they accept — send within 24h)
(3–5 sentences. Lead with something specific about them or their company. Offer a relevant insight or observation. End with ONE soft, low-pressure CTA — not "can I have 15 minutes?")

[Write the first DM here]

---
## 🔁 3. FOLLOW-UP 1 (3 days after first DM — no reply)
(2–4 sentences. Different angle from the first DM. Add a piece of value — a stat, insight, or question relevant to their industry. Don't beg for a reply.)

[Write follow-up 1 here]

---
## 🔁 4. FOLLOW-UP 2 (7 days after — still no reply)
(2–3 sentences. Shorter. Share a quick win, result, or case study relevant to them. Keep it light.)

[Write follow-up 2 here]

---
## 🔁 5. FOLLOW-UP 3 (14 days after — final touch)
(2–3 sentences. The graceful last message. Be honest that it's the last one. Leave the door open for later. No desperation.)

[Write follow-up 3 here]

---

After all messages, add a short section:

## 📌 USAGE NOTES
[2–3 bullet points of tips for using this sequence — best times to send, what to personalize, what to watch for in their profile before sending]`
}

function buildReplyHandlerPrompt(replyText, context) {
  return `My LinkedIn prospect replied to my outreach. Help me understand the reply and write the best response.

## CONTEXT (what I sent them)
${context || 'Initial LinkedIn outreach / connection message.'}

## THEIR REPLY
${replyText}

## YOUR TASK
Give me a full reply analysis and response guide:

---
## 📥 WHAT THEY SAID
[2–3 sentence summary of their reply in plain English. What are they actually communicating?]

## 📊 REPLY ANALYSIS
**Sentiment:** [Positive / Neutral / Skeptical / Negative]
**Intent signals:** [List 2–3 signals — are they curious? Interested? Brushing off? Objecting?]
**Key objections or concerns (if any):** [List them specifically]
**Opportunity level:** [High / Medium / Low — with 1 sentence why]

## 💬 RECOMMENDED RESPONSE
[Write my full response message here. Aim for 4–7 sentences. Address their specific reply. Move toward a discovery call or next step naturally. Don't be pushy. Sound like me.]

## 🔄 ALTERNATIVE RESPONSE (if they seem hesitant)
[A softer, more curiosity-based version of the response that keeps the door open without pushing for a call]

## ⚡ NEXT STEP RECOMMENDATION
[What should I do after sending this response? What outcome am I aiming for?]

---
Keep it real. I want responses that actually work — not overly polished sales talk.`
}

function buildContentPlannerPrompt(profile, date) {
  const services = (profile?.services || []).join(', ')
  const achievements = (profile?.achievements || []).join(', ')

  return `Generate 5 LinkedIn content ideas for me to post today, ${date}.

## MY EXPERTISE
- Operations Lead, Executive Assistant, Broadcast Journalism Trainer, VA Company Founder
- Services: ${services}
- Background includes: ${achievements}
- Audience: Founders, CEOs, business owners in the US and Philippines
- Goal: Build my personal brand, attract clients, establish authority in VA/ops/digital marketing space

## YOUR TASK
Give me 5 diverse, high-performing LinkedIn content ideas. Mix formats. Make each one feel specific and real — drawn from the kind of experiences and insights I actually have.

For each idea:

---
## 💡 IDEA [NUMBER]: [Catchy working title]

**Format:** [Text Post / Carousel / Short Video Script / Poll / Document Post]

**Why this will perform:** [1 sentence on why this resonates with my audience]

**Hook (first line):** [Write the exact opening line — make it stop the scroll]

**Angle / Key insight:** [What's the core message or takeaway]

**Full Script / Outline:**
[Write the complete post copy OR a detailed outline for carousel/video]

**CTA:** [What should people do at the end — comment, DM, follow, share?]

**Hashtags:** [5–8 relevant hashtags]

---

Mix these topic areas across the 5 ideas:
1. Personal story / behind-the-scenes from my work life
2. Practical tips (operations, VA, digital marketing, or journalism)
3. Controversial or contrarian take about the VA / remote work industry
4. Client results or win (can be anonymized/composite)
5. Educational content about one of my skills (tools, tactics, frameworks)

Make each one feel authentic to who I am — a young Filipino entrepreneur working with international clients. Not a LinkedIn influencer recycling generic advice.`
}

function buildCarouselPrompt(topic, profile) {
  const name = profile?.preferredName || 'Absidi'
  const company = profile?.company || 'Adsidi Multimedia Services'
  const website = profile?.websiteUrl || 'adsidi.co'
  const handle = profile?.linkedinUrl ? profile.linkedinUrl.replace(/.*\/in\//, '@') : '@absidi'

  return `Generate a complete, self-contained LinkedIn carousel HTML about the following topic for ${name} / ${company}.

TOPIC: ${topic}

BRAND (Adsidi — exact brand colors):
- Brand name: Adsidi / ${name}
- Tagline: "Your Business, Elevated"
- Website: ${website}
- LinkedIn handle: ${handle}
- Primary: #E05520 (burnt orange — main accent)
- Crimson: #A8001E (deep red — secondary accent)
- Salmon: #E8836A (light warm accent, use for gradient tops)
- Light BG: #FDF0EC (warm cream — never pure white)
- Dark BG: #1E0A05 (near-black dark brown)
- Navy: #0D3E6A (deep navy blue — use for dark gradient slides)
- Font: Plus Jakarta Sans (Google Fonts)
- Logo icon: upward arrow in a speech-bubble shape (replicate with SVG: rounded rect + arrow SVG path, filled with linear gradient from #A8001E to #E05520)

LINKEDIN CAROUSEL SPECS:
- Format: SQUARE 1:1 ratio — preview at 420×420px (exported at 1080×1080 via device_scale_factor=2.571)
- 6 slides total
- Alternate light (#F5F6FA) and dark (#0F1929) backgrounds for visual rhythm
- Each slide is 420×420px, self-contained

REQUIRED SLIDE STRUCTURE:
Slide 1 (LIGHT #FDF0EC): Hero — bold hook statement + Adsidi logo lockup (SVG icon + "adsidi.co" text) + orange tag label
Slide 2 (DARK #1E0A05): Problem/Pain point — what's broken or frustrating about this topic. Use crimson accent.
Slide 3 (GRADIENT linear-gradient(165deg, #A8001E, #E05520, #E8836A)): Key insight/solution — the core answer. White text.
Slide 4 (LIGHT #FDF0EC): Tips/Steps — 3–4 numbered items, #E05520 orange step numbers
Slide 5 (NAVY #0D3E6A): Deeper detail, stat, or example — adds credibility. White + salmon accent text.
Slide 6 (GRADIENT linear-gradient(165deg, #1E0A05, #A8001E, #E05520)): CTA — "Follow ${name} for more" + tagline "Your Business, Elevated" + website ${website} + full progress bar + NO swipe arrow

REQUIRED UI ELEMENTS ON EVERY SLIDE:
1. Progress bar (bottom): 3px height, #E05520 fill for light slides / white fill for dark slides, "X/6" counter
2. Swipe arrow (right edge, all slides EXCEPT slide 6): subtle chevron, #E05520 on light slides / white on dark
3. Brand watermark on slide 1 and 6: Large "A" at ~4% opacity as background
4. Tag label above heading: 10px, uppercase, letter-spacing 2px, #E05520 on light / #E8836A on dark

TECHNICAL REQUIREMENTS:
- Single HTML file, fully self-contained (no external dependencies except Google Fonts CDN)
- Import Plus Jakarta Sans: @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap')
- Carousel track: all slides in a flex row, translateX for navigation
- Include JS for click/swipe navigation (keyboard arrows + click to advance)
- Wrapper class: .carousel-frame (420px wide, 420px tall, overflow hidden)
- Track class: .carousel-track (flex row, transition: transform 0.3s ease)
- Each slide class: .slide (420px × 420px, flex-shrink:0, position:relative, display:flex, flex-direction:column)
- Content padding: 32px (sides), 52px bottom (to clear progress bar)
- Heading size: 26–32px, weight 800, line-height 1.1
- Body text: 13–14px, weight 400, line-height 1.55
- Include a "⬇️ Download HTML" button BELOW the carousel frame (not inside slides)

OUTPUT: Return ONLY the complete HTML — no explanation text before or after. Start with <!DOCTYPE html> and end with </html>.`
}

// ─────────────────────────────────────────────────────────────────────────────
// Main API handler
// ─────────────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not set. Add it in your .env.local file or Vercel environment variables.'
    })
  }

  const { feature, data, profile } = req.body

  if (!feature || !data) {
    return res.status(400).json({ error: 'Missing feature or data in request body' })
  }

  try {
    let userMessage = ''

    switch (feature) {
      case 'analyzeProspect':
        userMessage = buildAnalyzeProspectPrompt(data.prospectInput)
        break
      case 'generateOutreach':
        userMessage = buildGenerateOutreachPrompt(data.brief, data.prospectName)
        break
      case 'handleReply':
        userMessage = buildReplyHandlerPrompt(data.replyText, data.context)
        break
      case 'generateContent':
        userMessage = buildContentPlannerPrompt(profile, data.date)
        break
      case 'generateCarousel':
        userMessage = buildCarouselPrompt(data.topic, profile)
        break
      default:
        return res.status(400).json({ error: `Unknown feature: ${feature}` })
    }

    const maxTokens = feature === 'generateCarousel' ? 8000 : 4096

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: buildSystemPrompt(profile),
      messages: [{ role: 'user', content: userMessage }],
    })

    const result = message.content[0]?.text || ''

    return res.status(200).json({
      result,
      usage: {
        input_tokens: message.usage?.input_tokens,
        output_tokens: message.usage?.output_tokens,
      },
    })
  } catch (error) {
    console.error('Claude API error:', error)

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key. Check your ANTHROPIC_API_KEY.' })
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit hit. Wait a moment and try again.' })
    }

    return res.status(500).json({ error: error.message || 'Something went wrong with the AI request.' })
  }
}
