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

function buildTailorResumePrompt(jobContext, resumeData) {
  return `You are tailoring a resume for a specific client or job opportunity. Analyze the context and return a precisely tailored version of the resume as JSON.

## JOB / CLIENT CONTEXT
${jobContext}

## CURRENT RESUME DATA (JSON)
${JSON.stringify(resumeData, null, 2)}

## RULES
1. Keep ALL companies and job titles — never remove an entire role
2. You MAY omit individual bullet points that are clearly irrelevant (keep minimum 1 bullet per role)
3. You MAY rewrite bullet points to better match the opportunity's language, needs, and keywords
4. You MAY reorder bullet points within a role (most relevant first)
5. Skills section: reorder skills list to put most relevant skills first
6. Never change company names, locations, or dates — only bullet content and ordering
7. Never fabricate experience or add things that didn't happen
8. If the resume already fits well, return it mostly unchanged
9. Be surgical — only change what genuinely improves fit for this opportunity

Return ONLY valid JSON — no explanation text before or after. Match this exact structure:
{
  "tailoringNotes": "2-4 sentences explaining what you changed and why",
  "workExperience": [ ...same structure as input... ],
  "leadershipExperience": [ ...same structure as input... ],
  "education": [ ...same structure as input... ],
  "skills": { "skillsList": [...], "technicalTools": "...", "interests": [...] }
}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse pasted text → profile fields (auto-fill profile setup)
// ─────────────────────────────────────────────────────────────────────────────
function buildParseProfilePrompt(text) {
  return `You are reading someone's resume, bio, LinkedIn profile, or "about me" text. Extract the key information and return it as a JSON profile object.

INPUT TEXT:
${text}

Return ONLY valid JSON — no explanation, no markdown fences. Use this exact structure:
{
  "fullName": "Full legal name if found, else empty string",
  "preferredName": "Nickname or brand name if found, else empty string",
  "title": "Professional title or headline (combine multiple roles with | separator)",
  "company": "Primary company or business name",
  "location": "City, Country",
  "email": "Email address if found, else empty string",
  "phone": "Phone number if found, else empty string",
  "websiteUrl": "Website URL if found, else empty string",
  "portfolioUrl": "Portfolio URL if different from website, else empty string",
  "linkedinUrl": "LinkedIn URL if found, else empty string",
  "bio": "A first-person professional bio (2–4 sentences) summarizing who they are and what they do. Write it naturally in their voice based on the text.",
  "toneOfVoice": "Describe their communication style based on the writing (2–3 sentences). If unclear, write: Warm, confident, direct, and professional.",
  "services": ["list", "of", "services", "or", "skills", "they", "offer"],
  "tools": ["list", "of", "tools", "software", "or", "platforms", "they", "use"],
  "achievements": ["key achievement 1", "key achievement 2", "key achievement 3"],
  "targetClients": "Who they serve or want to serve — inferred from context",
  "linkedinGoal": "Their professional goal — inferred from context"
}

Rules:
- Leave fields as empty string "" or empty array [] if the info is not present — never invent data
- For services and tools: extract ALL mentions, even brief ones
- For bio: write in first person ("I am...", "I help...")
- For achievements: extract specific results, numbers, or notable accomplishments`
}

function buildParseResumePrompt(resumeText) {
  return `Parse the following resume text into a structured JSON object for use in a resume management system.

RESUME TEXT:
${resumeText}

Return ONLY valid JSON — no explanation, no markdown fences. Match this exact structure:
{
  "workExperience": [
    {
      "company": "Company Name",
      "location": "City, State / Remote",
      "roles": [
        {
          "title": "Job Title",
          "dates": "Month Year – Month Year (or just Year – Year)",
          "bullets": ["bullet point 1", "bullet point 2", "bullet point 3"]
        }
      ]
    }
  ],
  "leadershipExperience": [
    {
      "company": "Org/Company Name",
      "location": "City, Country",
      "roles": [
        {
          "title": "Role Title",
          "dates": "Date range",
          "bullets": ["bullet point"]
        }
      ]
    }
  ],
  "education": [
    {
      "school": "School Name",
      "location": "City, Country",
      "degree": "Full degree name",
      "dates": "Year – Year"
    }
  ],
  "skills": {
    "skillsList": ["Skill 1", "Skill 2"],
    "technicalTools": "Tool1, Tool2, Tool3 (comma-separated string)",
    "interests": ["Interest 1", "Interest 2"]
  }
}

Rules:
- workExperience = paid employment / freelance client roles
- leadershipExperience = founder/owner/co-founder roles, major volunteer leadership, government service roles
- If the resume doesn't explicitly separate these, put entrepreneurial/founder roles in leadershipExperience and all other employment in workExperience
- If a company had multiple roles, list all roles inside one company entry
- Preserve bullet points from the resume as accurately as possible; write them in full sentences if they appear as fragments
- If no interests section exists, infer 3–4 relevant interests from the person's background
- Preserve all dates exactly as written on the resume
- Do not invent or fabricate any experience not present in the text`
}

function buildParseJobPostPrompt(jobPost) {
  return `Extract the full application requirements from this job post. Be thorough — capture every single thing the applicant needs to submit or do.

JOB POST:
${jobPost}

Return ONLY valid JSON — no markdown, no code fences, no explanation. Use this exact structure:
{
  "roleTitle": "exact job title from post",
  "companyName": "company or employer name from post (look for 'Business or Contact Name', 'Company:', etc.)",
  "hiringManagerName": "name if mentioned, or null",
  "applicationLink": "the exact URL to apply if found (forms, job boards, email links, etc.), or null",
  "applicationMethod": "describe how to apply: 'online form', 'email', 'LinkedIn Easy Apply', 'Indeed', 'OnlineJobs.ph', 'VirtualStaff.ph', etc.",
  "applicationEmail": "email address to send to, or null",
  "requiredSubmissions": [
    { "item": "item name", "notes": "any specific requirements for this item" }
  ],
  "questionsToAnswer": [
    "exact question text from the post"
  ],
  "specialInstructions": "any other specific instructions not captured above, or null",
  "deadline": "application deadline if mentioned, or null",
  "salary": "salary or rate mentioned, or null",
  "jobSource": "where this job appears to be from: OnlineJobs.ph / VirtualStaff.ph / Indeed / LinkedIn / Other",
  "employerProfile": {
    "name": "employer/business name",
    "memberSince": "if mentioned",
    "totalJobPosts": "if mentioned",
    "location": "employer location if mentioned"
  }
}

Rules:
- requiredSubmissions: list EVERY item they ask for (resume, portfolio, links, videos, metrics, etc.)
- questionsToAnswer: copy every question EXACTLY as written in the post
- applicationLink: look carefully — it might be in a sentence like "apply using this link", or a Monday.com form, Typeform, Google Form, etc.
- If no explicit link found but there's an email, set applicationMethod to "email" and populate applicationEmail
- companyName: look for labels like "Business or Contact Name:", "Company:", "Employer:", "About the Employer", etc.`
}

function buildResearchEmployerPrompt(companyName, jobDescription) {
  return `Research this company/employer for a job applicant. Use your knowledge to provide as much detail as possible.

COMPANY NAME: ${companyName}
JOB DESCRIPTION CONTEXT:
${jobDescription.slice(0, 1500)}

Your task: Provide everything you know about this company. Be honest about your confidence level. If you're not certain about something, say so in the notes field.

Return ONLY valid JSON — no markdown, no code fences:
{
  "companyName": "cleaned up official company name",
  "description": "2-3 sentence description of what this company does",
  "industry": "industry/sector",
  "companyType": "restaurant / agency / e-commerce / SaaS / etc.",
  "size": "estimated headcount or 'small business' / 'SME' / 'enterprise'",
  "location": "where they're based",
  "website": "most likely website URL (include https://), or null if unknown",
  "confidence": "high / medium / low — how confident you are in the info above",
  "socials": {
    "linkedin": "URL or null",
    "facebook": "URL or null",
    "instagram": "handle or URL or null",
    "twitter": "handle or URL or null",
    "youtube": "URL or null",
    "tiktok": "handle or URL or null"
  },
  "painPoints": [
    "specific pain point 1 based on their industry, size, and role they're hiring for",
    "specific pain point 2",
    "specific pain point 3",
    "specific pain point 4"
  ],
  "competitors": [
    { "name": "competitor name", "description": "what they do / why they compete" },
    { "name": "competitor name", "description": "what they do / why they compete" },
    { "name": "competitor name", "description": "what they do / why they compete" }
  ],
  "whatToEmphasize": [
    "what the applicant should highlight based on this company's specific needs",
    "another emphasis point",
    "another emphasis point"
  ],
  "suggestedFixes": [
    "a specific improvement or opportunity you could bring to this company",
    "another suggestion"
  ],
  "recentSignals": "any notable news, growth signals, social content patterns, or context relevant to this company — or 'No specific signals found' if unknown",
  "notes": "caveats about what you could/couldn't verify — be transparent"
}`
}

function buildApplicationLetterPrompt(jobDescription, hiringManager, companyName, resumeData, profile) {
  const name     = profile?.fullName  || 'Vinz Betonio'
  const email    = profile?.email     || 'vinzabcde08@gmail.com'
  const phone    = profile?.phone     || '+63 968 266 7221'
  const location = profile?.location  || 'Tacurong City, Philippines'

  const rawLinkedin = profile?.linkedinUrl || ''
  const linkedinUrl = rawLinkedin
    ? (rawLinkedin.startsWith('http') ? rawLinkedin : `https://${rawLinkedin}`)
    : ''

  // Build a brief summary of experience from resume data
  const companies = (resumeData?.workExperience || []).map(e => e.company).slice(0, 4).join(', ')
  const roles     = (resumeData?.workExperience || [])
    .flatMap(e => e.roles || [])
    .map(r => r.title)
    .slice(0, 4)
    .join(', ')
  const skills    = (resumeData?.skills?.skillsList || []).slice(0, 8).join(', ')
  const tools     = resumeData?.skills?.technicalTools || ''

  return `Write a professional application letter for the role described below. The letter is for ${name}, based on the resume data provided.

## JOB DESCRIPTION / ROLE
${jobDescription}

## ADDRESSED TO
Hiring Manager: ${hiringManager}
Company: ${companyName}

## APPLICANT INFO (from resume)
Name: ${name}
Location: ${location}
Email: ${email}
Phone: ${phone}${linkedinUrl ? `\nLinkedIn: ${linkedinUrl}` : ''}
Recent roles: ${roles}
Companies worked for: ${companies}
Key skills: ${skills}
Tools: ${tools}

## FULL RESUME DATA (for reference)
${JSON.stringify(resumeData, null, 2)}

## WRITING RULES — IMPORTANT, FOLLOW EXACTLY
1. Use SIMPLE, CLEAR language — no corporate buzzwords, no jargon, no "I am writing to express my keen interest"
2. Sound like a real person who is genuinely excited — warm, confident, direct
3. Keep it SHORT and PUNCHY — no more than 4–5 paragraphs total
4. Include a "What I can bring to this role:" section with 4–6 bullet points that directly match the job description
5. Each bullet point should be SPECIFIC and CONCRETE — connect a real skill or experience to a specific job requirement
6. The opening line must HOOK the reader — don't start with "I am applying for"
7. Do NOT include a formal date or address header — start directly with "Dear ${hiringManager},"
8. End with a confident but not pushy closing (1–2 sentences max), then the signature block
9. Signature block format:
   ${name}
   ${phone}
   ${email}${linkedinUrl ? `\n   ${linkedinUrl}` : ''}

Return ONLY the plain letter text — no markdown, no code fences, no extra commentary. Just the letter starting with "Dear ${hiringManager}," and ending with the signature.`
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
- LOGO: Use EXACTLY this HTML element for the logo — do NOT generate an SVG logo, do NOT use any other src value:
  <img src="ADSIDI_LOGO_SRC" class="adsidi-logo" style="width:36px;height:36px;object-fit:contain;display:block;" alt="Adsidi">
  The literal text "ADSIDI_LOGO_SRC" will be replaced with the real logo image at runtime.

LINKEDIN CAROUSEL SPECS:
- Format: SQUARE 1:1 ratio — preview at 420×420px (exported at 1080×1080)
- 6 slides total
- Each slide is 420×420px, self-contained

REQUIRED SLIDE STRUCTURE:
Slide 1 (LIGHT #FDF0EC): Hero — bold hook statement + logo element (<img src="ADSIDI_LOGO_SRC">) + "adsidi.co" text beside it + orange tag label. NO left arrow (first slide).
Slide 2 (DARK #1E0A05): Problem/Pain point — what's broken or frustrating about this topic. Use crimson accent. Has LEFT arrow + RIGHT arrow.
Slide 3 (GRADIENT linear-gradient(165deg, #A8001E, #E05520, #E8836A)): Key insight/solution — the core answer. White text. Has LEFT arrow + RIGHT arrow.
Slide 4 (LIGHT #FDF0EC): Tips/Steps — 3–4 numbered items, #E05520 orange step numbers. Has LEFT arrow + RIGHT arrow.
Slide 5 (NAVY #0D3E6A): Deeper detail, stat, or example — adds credibility. White + salmon accent text. Has LEFT arrow + RIGHT arrow.
Slide 6 (GRADIENT linear-gradient(165deg, #1E0A05, #A8001E, #E05520)): CTA — "Follow ${name} for more" + tagline "Your Business, Elevated" + website ${website} + full progress bar. Has LEFT arrow. NO right arrow (last slide).

REQUIRED UI ELEMENTS ON EVERY SLIDE:
1. Progress bar (bottom): 3px height, #E05520 fill for light slides / white fill for dark slides, "X/6" counter
2. RIGHT chevron button (right edge, slides 1–5 only): absolute positioned, click navigates to next slide. #E05520 on light / white on dark. Use class "nav-btn nav-next".
3. LEFT chevron button (left edge, slides 2–6 only): absolute positioned, click navigates to previous slide. #E05520 on light / white on dark. Use class "nav-btn nav-prev".
4. Brand watermark on slides 1 and 6: Large "A" at ~4% opacity as background element
5. Tag label above heading: 10px, uppercase, letter-spacing 2px, #E05520 on light / #E8836A on dark

TECHNICAL REQUIREMENTS:
- Single HTML file, fully self-contained (no external dependencies except Google Fonts CDN)
- Import Plus Jakarta Sans: @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap')
- Carousel track: all slides in a flex row, translateX for navigation
- Wrapper class: .carousel-frame (420px wide, 420px tall, overflow hidden, position:relative)
- Track class: .carousel-track (display:flex, transition: transform 0.35s cubic-bezier(0.4,0,0.2,1))
- Each slide class: .slide (420px × 420px, flex-shrink:0, position:relative, display:flex, flex-direction:column, overflow:hidden)
- Nav buttons: position:absolute, top:50%, transform:translateY(-50%), z-index:10, no background, border:none, cursor:pointer, font-size:22px, padding:8px, opacity:0.7, hover:opacity:1
- Content padding: 32px sides, 52px bottom (to clear progress bar area)
- Heading size: 26–32px, weight 800, line-height 1.1
- Body text: 13–14px, weight 400, line-height 1.55

CRITICAL JAVASCRIPT REQUIREMENTS — follow these EXACTLY:
- ALL counter elements MUST use class "slide-counter" (the "X/6" text)
- ALL progress fill bar elements MUST use class "progress-fill"
- You MUST define and expose window.goToSlide as a global function:
  window.goToSlide = function(n) {
    var track = document.querySelector('.carousel-track');
    if (track) { track.style.transition = 'none'; track.style.transform = 'translateX(' + (-n * 420) + 'px)'; }
    document.querySelectorAll('.slide-counter').forEach(function(el) { el.textContent = (n + 1) + ' / 6'; });
    document.querySelectorAll('.progress-fill').forEach(function(el) { el.style.width = (((n + 1) / 6) * 100) + '%'; });
    currentSlide = n;
  };
- Navigation buttons, keyboard, and touch MUST call goToSlide(n) (NOT directly manipulate transforms)
- Include JS for BIDIRECTIONAL navigation:
  * .nav-next button click → goToSlide(currentSlide + 1)
  * .nav-prev button click → goToSlide(currentSlide - 1)
  * Keyboard ArrowRight → next; ArrowLeft → prev
  * Touch: touchstart/touchend swipe left → next; swipe right → prev

OUTPUT: Return ONLY the complete HTML — no explanation text before or after. Start with <!DOCTYPE html> and end with </html>.`
}

function buildVideoScriptPrompt(data, profile) {
  const name     = profile?.preferredName || 'Absidi'
  const website  = profile?.websiteUrl    || 'adsidi.co'
  const { prospectName, company, videoType, videoLength, jobDescription, questions, customInstructions } = data

  const typeLabel = {
    loom_intro: 'Loom Introduction Video',
    qa_video:   'Q&A / Answer-Specific Questions Video',
    portfolio:  'Portfolio Walkthrough Video',
    custom:     'Custom Video',
  }[videoType] || 'Video Introduction'

  const lengthGuide = {
    '90s':  '90 seconds maximum (~150 words of spoken content)',
    '2min': '1–2 minutes (~200–300 words of spoken content)',
    '3min': '2–3 minutes (~300–450 words of spoken content)',
    '5min': '3–5 minutes (~450–750 words of spoken content)',
  }[videoLength] || '1–2 minutes'

  return `I need to record a ${typeLabel} for a job application. Generate a complete recording package for me.

## CONTEXT
- Recording for: ${prospectName} at ${company}
- Video type: ${typeLabel}
- Target length: ${lengthGuide}
- My website: ${website}
${customInstructions ? `- My extra instructions: ${customInstructions}` : ''}

## JOB DESCRIPTION / BRIEF
${jobDescription || '(No job description provided)'}

## QUESTIONS TO ANSWER
${questions || '(None specified — extract from the job description above, or structure as a natural introduction if no questions found)'}

---
Generate all four sections below. Be specific — reference ${company} and ${prospectName} by name throughout.

---
## 🚨 INSTRUCTION NOTES — READ BEFORE RECORDING
Extract EVERY specific video requirement from the job description. Include:
- Platform or format required (Loom, Google Drive link, MP4 upload, YouTube unlisted, etc.)
- Length limits or minimum length if mentioned
- Must-mention items — specific skills, tools, experience, or topics they explicitly asked about
- Tone or style requirements they specified (formal, casual, no scripts, etc.)
- Submission method — where to send the video (email, form, link)
- Any deadline mentioned
- Anything they said NOT to do
- If the job description has no specific video instructions, write exactly: "No specific video requirements found in the job post. Record a clean, professional ${typeLabel} under ${lengthGuide} and submit alongside your application."

---
## ✅ PRE-RECORDING CHECKLIST
6–8 specific bullet points of what to prepare before hitting record:
- Environment (lighting, background, audio check)
- Tabs or links to have open (portfolio, specific work examples)
- Key numbers or results to have memorized and ready to mention
- Specific detail about ${company} to reference naturally in the video
- Opening line — write it out word for word so they can practice it
- One thing to avoid or watch out for based on this specific job post

---
## 🎬 FULL SCRIPT — ${typeLabel.toUpperCase()}
Write the complete word-for-word script. Structure:

**[OPENING — ~${videoType === '90s' ? '10s' : '20s'}]**
DO NOT start with "Hi my name is ${name}." Start with a hook — a specific observation about ${company}, a bold statement, or a result that earns attention immediately. Then introduce yourself naturally in the second or third sentence.
[Write opening here]

**[BODY${videoType === 'qa_video' ? ' — ONE SECTION PER QUESTION' : ''}]**
${videoType === 'qa_video'
  ? `Answer each question in its own labeled section. Format: **[Q: Question text]** then the answer. Keep each answer 30–45 seconds. Start each answer with a clear signal word, not "So..." or "Um..."`
  : videoType === 'portfolio'
    ? `Walk through 2–3 specific examples. For each: [challenge → what ${name} did → specific result]. Keep each example 45–60 seconds.`
    : `Cover: who ${name} is → what they specifically do that's relevant to this role → the single most relevant result or achievement → what they bring that others don't → why ${company} specifically`
}
[Write body here]

**[CLOSING — ~15s]**
Confident, warm close. Specific CTA (not "I look forward to hearing from you"). Mention ${website}. End naturally.
[Write closing here]

---
## ⚡ QUICK REFERENCE TALKING POINTS
For when ${name} prefers to speak naturally. 8–12 bullet points grouped by section:

**Opening:**
- [2–3 points]

**Body:**
- [4–6 key points to hit — include specific numbers and examples]

**Closing:**
- [2 points]

---
SCRIPT WRITING RULES — FOLLOW EXACTLY:
- Write exactly how ${name} speaks — warm, direct, confident, NOT stiff or formal
- Short sentences. This is spoken word. Not an essay.
- Include [pause] for natural beats, (smile) for warmth moments, — for run-on thoughts
- NO buzzwords: passionate, leverage, synergy, results-driven, excited to share
- Every section must reference something SPECIFIC about ${company} — not generic filler
- The whole thing should sound like something ${name} would actually say spontaneously, not rehearsed sales copy
- Write the word counts and time estimates next to each section header`
}

function buildCaptionPrompt(topic, profile) {
  const name = profile?.preferredName || 'Absidi'
  const company = profile?.company || 'Adsidi Multimedia Services'
  const website = profile?.websiteUrl || 'adsidi.co'
  const services = (profile?.services || []).slice(0, 5).join(', ')

  return `Write a LinkedIn post caption to accompany a carousel post about the following topic.

CAROUSEL TOPIC: ${topic}

ABOUT ME: ${name} — ${company}. Services: ${services}. Website: ${website}

CAPTION REQUIREMENTS:
- Total length: 160–230 words
- Tone: Warm, confident, direct, and personal — sounds like a real person, not a brand account. My writing style: I lead with value, get to the point, and sound human.
- Structure:
  1. Hook (first 1–2 lines, will appear before LinkedIn "see more" cutoff): Stop the scroll. Start with a bold statement, a relatable pain point, or a surprising truth. NO "I'm excited to share" or "Happy to announce" openers.
  2. Body (3–5 short paragraphs / punchy lines): Expand on the carousel's core insight. Include 1 personal touch — a real experience, observation, or result that connects to the topic.
  3. CTA (final 1–2 lines): Specific invite — ask a question, invite them to DM, or prompt a comment. Not generic "let me know your thoughts."
- Formatting: Generous line breaks (no walls of text). 2–3 emoji woven in naturally — not all at the start, not all at the end.
- End with 5–8 hashtags on their own line. Mix: 2 niche (#VirtualAssistant #OperationsLead), 2 mid-tier (#RemoteWork #LinkedInMarketing), 1 broad (#Entrepreneur or #Business). Maximum 8 hashtags.
- Do NOT mention "swipe" or "this carousel" — the caption should work as a standalone post.
- Do NOT start the caption with "I" — start with a statement, question, or observation.

Return ONLY the caption text — no labels, no explanation, no markdown formatting.`
}

function buildPricingProposalPrompt(data, profile) {
  const name    = profile?.preferredName || 'Absidi'
  const company = profile?.company       || 'Adsidi Multimedia Services'
  const website = profile?.websiteUrl    || 'adsidi.co'
  const email   = profile?.email         || 'vinzabcde08@gmail.com'
  const phone   = profile?.phone         || '+63 968 266 7221'
  const {
    prospectName, company: clientCompany, selectedServices, rateType,
    budget, hoursPerWeek, startDate, jobContext, customNotes,
  } = data

  const rateLabel = {
    monthly_retainer: 'Monthly Retainer',
    hourly:           'Hourly Rate',
    project_based:    'Project-Based (One-Time)',
    performance:      'Performance-Based',
  }[rateType] || 'Monthly Retainer'

  return `Create a complete, professional pricing proposal for ${name} (${company}) to send to a potential client.

## CLIENT
Name / Contact: ${prospectName}
Company: ${clientCompany}
Pricing structure: ${rateLabel}
${budget          ? `Client's stated budget: ${budget}` : ''}
${hoursPerWeek    ? `Est. engagement: ${hoursPerWeek} hours/week` : ''}
${startDate       ? `Proposed start date: ${startDate}` : ''}

## SERVICES TO INCLUDE
${selectedServices.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## JOB CONTEXT / BRIEF
${jobContext || '(No specific job description provided)'}

## CUSTOM NOTES
${customNotes || '(None)'}

## ABOUT ${name.toUpperCase()} / ${company.toUpperCase()}
- Philippines-based Operations Lead, EA, Digital Marketer, and VA Company Founder
- Serves US and global clients with high-quality, reliable work
- Website: ${website}
- Email: ${email} | Phone: ${phone}

---

Generate a complete proposal with these four sections:

---
## 🤝 PITCH NOTE
A short, personalized opening message to send with the proposal (5–8 sentences). Sound like ${name} — warm, confident, direct. Reference something specific about ${clientCompany}'s needs based on the job context. Briefly summarize what's included and close with a soft CTA to review the proposal and schedule a quick call.

---
## 💰 PRICING TABLE
Format as a clear, professional pricing breakdown. For each service included:
- Service name
- What's included (2–4 brief deliverables/scope bullets)
- Rate (use realistic, competitive rates for a Philippines-based professional in USD: EA/VA retainer $400–$800/mo, Marketing $500–$1200/mo, Content creation $300–$700/mo, adjust based on scope)
${budget ? `Try to keep total within or around the client's stated budget of ${budget} if possible.` : ''}

After the per-service breakdown, include:
- **Total:** Sum of all services with the rate period
- **Savings if paying quarterly:** (10% discount)
- **Savings if paying semi-annually:** (15% discount)

Format this section cleanly — use spacing and dashes to make it readable as plain text.

---
## 📋 TERMS & CONDITIONS
Keep it short and professional (6–10 bullets):
- Payment terms (invoice due date, preferred method)
- Onboarding / kick-off process
- Communication and availability hours (PHT timezone, overlap with US)
- Revision policy
- Scope creep policy
- Cancellation / notice period
- Confidentiality

---
## ⚡ NEXT STEPS
3–5 short, numbered steps outlining what happens after the client says yes. Make it feel easy and welcoming. End with a simple CTA.

---
WRITING RULES:
- Sound like ${name} throughout — not a corporate contract
- Keep the pitch note feeling personal and specific to ${clientCompany}
- Pricing should be realistic and competitive for a skilled Filipino VA/Ops professional
- The whole proposal should make ${clientCompany} feel like working with ${name} is the obvious, low-risk choice`
}

function buildClientBriefPrompt(data, profile) {
  const name = profile?.preferredName || 'Absidi'
  const {
    prospectName, company, role, linkedinUrl, status, briefSummary,
    outreachSequence, conversationLog, notes, meetingType, meetingNotes,
  } = data

  const meetingLabel = {
    discovery:  'Discovery / Sales Call',
    followup:   'Follow-Up Meeting',
    proposal:   'Proposal Presentation',
    onboarding: 'Onboarding Call',
  }[meetingType] || 'Meeting'

  // Flatten conversation log to readable text
  const convHistory = (conversationLog || []).length > 0
    ? conversationLog.map(e =>
        `[${new Date(e.timestamp).toLocaleDateString()} · ${e.type.toUpperCase()}] ${e.text}`
      ).join('\n\n')
    : 'No conversation history recorded yet.'

  // Flatten outreach sequence
  const steps = ['connection', 'firstDm', 'followUp1', 'followUp2', 'followUp3']
  const stepLabels = { connection: 'Connection Request', firstDm: 'First DM', followUp1: 'Follow-Up 1', followUp2: 'Follow-Up 2', followUp3: 'Follow-Up 3' }
  const seq = outreachSequence || {}
  const outreachSummary = steps
    .filter(s => seq[s]?.text)
    .map(s => `[${stepLabels[s]} — ${seq[s].status?.toUpperCase() || 'PENDING'}${seq[s].sentAt ? ` · sent ${new Date(seq[s].sentAt).toLocaleDateString()}` : ''}]\n${seq[s].text}`)
    .join('\n\n')

  return `Create a complete pre-meeting Client Brief for ${name} to use before their upcoming ${meetingLabel} with ${prospectName} from ${company}.

## PROSPECT DATA FROM TRACKER
Name: ${prospectName}
Company: ${company}
Role / Title: ${role || '(not recorded)'}
LinkedIn: ${linkedinUrl || '(not recorded)'}
Current status: ${status || '(not set)'}

## PROSPECT BRIEF / ANALYZER NOTES
${briefSummary || "(No analyst brief on file — use what's available from conversation history and notes)"}

## OUTREACH SEQUENCE HISTORY
${outreachSummary || '(No outreach messages on file)'}

## FULL CONVERSATION LOG
${convHistory}

## PROSPECT NOTES
${notes || '(No notes)'}

## MEETING TYPE
${meetingLabel}

## ADDITIONAL MEETING NOTES FROM ${name.toUpperCase()}
${meetingNotes || '(None)'}

---

Generate the full Client Brief with these sections:

---
## 🧠 CLIENT SNAPSHOT
A concise 4–6 sentence profile of ${prospectName} and ${company}:
- Who they are and what they do
- What stage their business is at (based on all available signals)
- What brought them into ${name}'s pipeline
- Their overall vibe / communication style (inferred from conversation history)

---
## 💬 CONVERSATION HISTORY SUMMARY
A clean, chronological summary of the outreach + conversation history. For each key touchpoint:
- Date
- What was said / sent
- Their response and what it revealed
- Current standing: where the relationship is right now

---
## 🎯 PAIN POINTS & NEEDS
Based on everything you know: list 4–6 specific pain points or needs this person/company has. Be specific — draw from their conversation responses, job description, and company context.

---
## 📈 OPPORTUNITY & FIT
Why is ${name} the right person for this? List 3–5 specific fit points — skills or experience that directly match what ${company} needs. Be concrete, not generic.

---
## ⚡ TALKING POINTS FOR THE ${meetingLabel.toUpperCase()}
8–12 tactical bullets. Include:
- The opening line — how to start the meeting with energy and specificity (write it out word for word)
- 3–5 questions to ask that demonstrate genuine understanding of their business
- Key things to mention about ${name}'s background that are most relevant to this client
- How to handle the pricing / next steps conversation if it comes up
- 1 personal touch — something from the conversation history to reference that shows ${name} was paying attention

---
## 🚨 WATCH-OUTS & RED FLAGS
Anything to be careful about — objections they've hinted at, sensitivities to avoid, pricing expectations to manage, or warning signs from the conversation history. If there's nothing concerning, say so.

---
## 📌 NEXT STEPS AFTER THE CALL
3–5 specific action items ${name} should take immediately after the meeting ends, based on where things are likely to go.

---
BRIEF WRITING RULES:
- Be direct and actionable — this is a reference doc ${name} will read 5 minutes before the call
- Pull specific quotes or details from the conversation history where possible
- Don't pad with generic advice — every sentence should be specific to ${prospectName} and ${company}
- The talking points should feel like ${name}'s own voice, not sales coaching generic tips`
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
      case 'tailorResume':
        userMessage = buildTailorResumePrompt(data.jobContext, data.resumeData)
        break
      case 'generateCaption':
        userMessage = buildCaptionPrompt(data.topic, profile)
        break
      case 'parseProfile':
        userMessage = buildParseProfilePrompt(data.text)
        break
      case 'parseResume':
        userMessage = buildParseResumePrompt(data.resumeText)
        break
      case 'parseJobPost':
        userMessage = buildParseJobPostPrompt(data.jobPost)
        break
      case 'researchEmployer':
        userMessage = buildResearchEmployerPrompt(data.companyName, data.jobDescription)
        break
      case 'generateAppLetter':
        userMessage = buildApplicationLetterPrompt(
          data.jobDescription,
          data.hiringManager || 'Hiring Manager',
          data.companyName   || 'your company',
          data.resumeData,
          profile
        )
        break
      case 'generateVideoScript':
        userMessage = buildVideoScriptPrompt(data, profile)
        break
      case 'generatePricingProposal':
        userMessage = buildPricingProposalPrompt(data, profile)
        break
      case 'generateClientBrief':
        userMessage = buildClientBriefPrompt(data, profile)
        break
      default:
        return res.status(400).json({ error: `Unknown feature: ${feature}` })
    }

    const maxTokens = (feature === 'generateCarousel' || feature === 'tailorResume') ? 8000 : feature === 'generateCaption' ? 2048 : 4096

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

    // Credit balance exhausted — Anthropic returns 402 or a specific message
    const msg = error.message || ''
    const isOutOfCredits =
      error.status === 402 ||
      msg.toLowerCase().includes('credit') ||
      msg.toLowerCase().includes('balance') ||
      msg.toLowerCase().includes('billing') ||
      msg.toLowerCase().includes('payment')

    if (isOutOfCredits) {
      return res.status(402).json({
        error: 'OUT_OF_CREDITS',
        message: 'Your Anthropic API credits are empty. Top up at console.anthropic.com/settings/billing to keep using the app.',
      })
    }

    return res.status(500).json({ error: error.message || 'Something went wrong with the AI request.' })
  }
}
