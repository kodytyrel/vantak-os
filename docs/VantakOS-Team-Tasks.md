# VantakOS — Team Task Assignments

**KC Dev Studio LLC**
**February 2026 — Version 2**

*Prepared by Kody Christian, Founder*

**Chris** — Co-Founder / Sales | **Shon** — Backend & Infrastructure | **Dallin** — Business Testing & Content

---

## What is VantakOS?

VantakOS is a business-in-a-box platform that lets small service businesses launch their own branded app, website, and tool suite. One codebase powers every business — a barber, a pressure washer, a mobile detailer, a roofing company. Each business gets their own look, their own URL, and their own customer experience as a PWA (Progressive Web App) that installs to a customer's phone without needing the App Store.

Think of it as the **Shopify of service businesses**. Shopify lets anyone sell products online. Vantak lets anyone run a service business with a professional app, website, and tool suite — without knowing anything about technology.

---

## The Pricing Model

Our pricing is built on a simple philosophy: stack so much value that the price becomes irrelevant compared to what they're getting. A custom app costs $30K–$150K from a dev shop. We deliver it for a fraction of that. Our top tier ($100K+ custom development) signals to the market that we play at every level — and it makes every tier below it look like a steal.

| Tier | Name | Upfront | Monthly | Who It's For |
|------|------|---------|---------|--------------|
| **0** | **Bootstrap** | $200 deposit | $0 + 5% fee | Testing an idea. Zero monthly risk. |
| **1** | **Business Tools** | $200 deposit | $99/mo | Running a real biz. Full tools, no app. |
| **2** | **Production App** | $5,000 | $1,000/mo | First real app + website. Vantak branded. |
| **3** | **White Label** | $15,000 | $1.5–2K/mo | Their brand, full customization. |
| **4** | **White Glove** | $25–30K | $2,000+/mo | Done-for-you. We build everything. |
| **5** | **Custom Dev** | $100K+ | Custom | Enterprise. Also our price anchor. |

**Key detail:** The $200 deposit on Tiers 0–1 is non-refundable. It filters out tire-kickers. If $200 scares someone off, they weren't going to be a good customer.

**Production App guarantee:** If they process $1K in transactions within 30 days, we refund their first month. This drives deep adoption — by the time they've hit $1K, their customers are in the system and switching costs are real. We still earn Stripe fees during the guarantee period.

---

## Where We're At — Honest Assessment

### What's built and working:

- Multi-tenant architecture (each business is isolated and secure)
- Owner dashboard ("Command Center") with KPI metrics
- Stripe Connect payment processing
- Invoicing, point-of-sale terminal, booking system
- Expense/mileage tracking (TaxVault)
- PWA manifest generation per business
- Founding Member program (first 100 get lifetime fee waiver)
- Tier gating system
- AI-powered support bot (Gemini)

### What's broken right now:

- **Signup flow doesn't work** — users can't get past registration. This is the #1 blocker.
- **Customer-facing PWA is ugly and non-functional**
- Preview mode is broken
- Many database tables exist but have no working frontend (estimates, marketing, etc.)
- No email or SMS notifications
- No customer portal or login
- No appointment calendar view
- Front-end doesn't match the new premium pricing/value proposition
- TypeScript build errors being suppressed (`ignoreBuildErrors: true`)

### What exists in the database (Supabase):

`tenants` (9 test rows), `services`, `appointments`, `customers`, `invoices`, `estimates`, `estimate_items`, `products`, `expenses`, `mileage_logs`. Most tables have RLS enabled. Stripe Connect fields exist on tenants table.

---

## How This Document Works

Each of you has a section with your tasks. Every task has a difficulty rating, the tools you'll need, a plain-English description, and step-by-step instructions.

**Important:** You are not expected to know how to code all of this from memory. Use Claude (claude.ai or Cursor) as your coding partner. Paste these tasks in, share the relevant code files, and let the AI help you build. That's how Kody built all 120,000+ lines of code across his projects — it's how we work.

---

## Getting Set Up (Everyone Do This First)

### Task 0: Clone the Repo and Run VantakOS Locally

**Difficulty:** Beginner | **Tools:** Terminal, Node.js, Git, VS Code/Cursor

Before you can work on anything, you need the code on your computer and running in your browser.

1. Install these tools if you don't have them: Node.js (nodejs.org — download the LTS version), Git (git-scm.com), and VS Code or Cursor (cursor.sh).
2. Open your terminal (Command Prompt on Windows, Terminal on Mac). Type: `git clone https://github.com/kodytyrel/vantak-os.git`
3. Navigate into the folder: `cd vantak-os`
4. Install dependencies: `npm install`
5. Ask Kody for the `.env` file (this has the secret keys for Supabase and Stripe — NEVER share this file or commit it to GitHub).
6. Save the `.env` file in the root of the vantak-os folder.
7. Start the app: `npm run dev`
8. Open your browser and go to http://localhost:3000 — you should see the VantakOS landing page.
9. Note: The signup flow is currently broken. Don't panic — that's one of the things we're fixing. You can still explore the codebase and work on your tasks.
10. If something doesn't work, screenshot the error and send it to Kody or paste it into Claude and ask for help.

---

## Chris — Co-Founder / VantakOS Lead

**Role:** You're co-founder and running point on VantakOS. Your job is a mix of product vision, content creation, QA testing, building features with AI, and coordinating Shon and Dallin. You've got the sales instinct and the vision — own this product.

### Priority Tasks

### Task C1: Write All Website Copy for vantakOS.com (New Pricing Model)

**Difficulty:** Beginner | **Tools:** Claude, Google Docs

The landing page needs to sell the NEW pricing model. This is premium software, not a $99/month tool. The copy needs to make a business owner feel like $5K for a Production App is an absolute steal compared to the $30K–$150K a custom app would cost.

1. Study the pricing table above. Understand the philosophy: we're not cheap, we're an insane value compared to the alternative.
2. Open Claude and give it this context: *"I'm writing website copy for Vantak, a business-in-a-box platform for service businesses. Our pricing ranges from $0/month (Bootstrap) to $100K+ (Custom Development). Our philosophy: offer so good they'd feel dumb saying no — not because it's cheap, but because a custom app costs $30K–$150K and we deliver it for $5K. Write landing page copy for: Hero section, Value proposition, Pricing breakdown, Social proof / use cases, FAQ, CTA sections. Tone: confident, premium but accessible, no jargon. Speak to a shop owner, not a developer."*
3. Review and edit in your own voice. Make it sound like something you'd say to a prospect face-to-face.
4. Write the pricing page as a separate section. Each tier needs: name, price, one-sentence pitch, bullet list of what's included, and a "Who is this for?" blurb.
5. Include the Production App guarantee in the copy: *"Process $1K in your first 30 days and your first month is on us."*
6. Put everything in a Google Doc organized by section. Share with Kody for review.

### Task C2: QA Audit: Document Every Bug, Broken Flow, and UX Issue

**Difficulty:** Beginner | **Tools:** Browser, Phone, Google Docs

We know the signup is broken. But we need a COMPLETE list of everything that's broken, ugly, or confusing. Go through the entire app systematically and document everything.

1. Start at vantakOS.com. Go through the landing page — note anything that doesn't match our new pricing or feels off.
2. Try the signup flow. It's broken — document exactly where it fails. Screenshot the error. This helps Shon fix it.
3. If you can get into the dashboard (Kody may give you test credentials), test EVERY feature: creating services, products, invoices, using the terminal, changing branding, booking flow.
4. Open any working business page on your phone. Does it look like something worth $1,000/month? Be brutally honest.
5. Create a Google Doc called "VantakOS QA Report — Feb 2026". For each issue: screenshot, URL/page, what you expected, what actually happened, severity (Blocker / Major / Minor / Cosmetic).
6. Categorize issues: (1) Blockers — can't launch without fixing these, (2) Major — need to fix soon, (3) Minor — can live with for now, (4) Cosmetic — polish later.
7. Share with Kody and Shon. This becomes Shon's bug fix hit list.

### Task C3: Create Sales Materials and Demo Deck

**Difficulty:** Beginner | **Tools:** Google Docs/Slides, Claude

You're the sales arm. You need materials to pitch Vantak to prospective businesses. Build a simple pitch deck and one-pager.

1. Create a one-page PDF or Google Doc that you could hand to a business owner. Include: what Vantak does (3 sentences max), the value comparison (custom app = $30K–$150K vs. Vantak Production App = $5K), the tier overview, and one compelling use case.
2. Build a short pitch deck (5–8 slides max): Problem (running a business with scattered tools), Solution (Vantak = everything in one place), Demo screenshots, Pricing, Guarantee, Next steps.
3. Write a 30-second elevator pitch. Practice saying it out loud. This is what you say when someone asks "What's Vantak?"
4. For the demo screenshots: since the app needs visual work, you can use screenshots of the best-looking parts OR create mockups showing the vision using Claude to help with design concepts.
5. Share all materials with Kody for review.

### Task C4: Set Up Demo Businesses for Sales Pitches

**Difficulty:** Beginner | **Tools:** Browser, Phone

Once the signup flow is fixed (Shon's working on it), we need 3–4 polished demo businesses loaded into VantakOS.

1. Wait until Shon confirms the signup flow is working (Task S1).
2. Create 3–4 demo businesses through the signup flow. Ideas: a barber shop, a mobile car detailer, a personal trainer, a pressure washing company.
3. For each: set branding colors that look premium, add 3–5 realistic services with real market prices, add products if applicable.
4. Create at least one invoice and one estimate to demo those features.
5. Install each business's PWA on your phone. Screenshot everything.
6. Document login credentials in a secure note shared ONLY with Kody (never in GitHub).
7. These demos need to look like they're worth $1,000/month. If they don't, note what needs to change.

### Task C5: Build a Basic Appointment Calendar View

**Difficulty:** Intermediate | **Tools:** Cursor/Claude, Terminal

Business owners can receive bookings, but there's no calendar to see their schedule. This is a feature that justifies the monthly price.

1. Open Claude or Cursor with the vantak-os codebase loaded.
2. Tell Claude: *"I need a weekly calendar component for a Next.js 16 app using React 19 and Tailwind CSS. It should show 7 days as columns with time slots. Appointments should appear as colored blocks. Here's the appointment data shape from Supabase:"* then paste the appointment type/schema.
3. Ask Claude to create the file at: `app/dashboard/calendar/page.tsx`
4. The calendar should fetch appointments from Supabase for the current tenant (`tenant_id` from the session).
5. Add a link to the calendar in the dashboard sidebar/navigation.
6. Test by creating appointments through the booking flow, then check if they show on the calendar.
7. Don't aim for perfection — get it functional. We'll polish later.
8. Commit: `git checkout -b feature/calendar && git add . && git commit -m "Add basic weekly calendar view" && git push origin feature/calendar`

---

## Shon — Backend & Infrastructure

**Role:** You're the most technical person on the team. IT Masters, Fishbowl experience, and you know how systems work. Your tasks are the critical engineering work that unblocks everyone else. The signup flow fix is the single most important task across the entire team — nothing else matters until people can create accounts.

### Priority Tasks (Do These In Order)

### Task S1: FIX THE SIGNUP FLOW (Critical Blocker)

**Difficulty:** Intermediate | **Tools:** VS Code/Cursor, Claude, Terminal, Supabase Dashboard, Chrome DevTools

This is the #1 priority across the entire team. Nobody can test, demo, or sell anything until users can sign up. The signup is a 4-step onboarding flow that's currently broken.

1. Run the app locally (`npm run dev`) and go to the signup page.
2. Try to sign up. Document exactly where it fails — what step, what error message, what the console says (open Chrome DevTools with F12, check the Console and Network tabs).
3. Copy the full error output and the signup-related code into Claude. Key files to check: `app/signup/page.tsx`, `app/api/tenants/create/route.ts`, and any auth-related files.
4. Tell Claude: *"This is a 4-step signup flow for a multi-tenant Next.js app with Supabase Auth. It's broken. Here are the errors I'm seeing: [paste errors]. Here are the relevant files: [paste code]. Help me fix this step by step."*
5. Common issues to check: Supabase Auth configuration (email confirmations, redirect URLs), missing environment variables, API route errors, database permissions (RLS policies blocking inserts).
6. Test the fix by signing up a new business. Go through ALL 4 steps. Make sure the tenant gets created in Supabase, Stripe Connect fields are initialized, and the user can log in after signup.
7. Once it works, message the team: "Signup is live. Go create your test businesses."
8. Commit: `git checkout -b fix/signup-flow && git add . && git commit -m "Fix signup flow — unblocks all testing" && git push origin fix/signup-flow`

### Task S2: Fix TypeScript Build Errors and Re-enable Type Checking

**Difficulty:** Intermediate | **Tools:** Terminal, VS Code/Cursor, Claude

The project has TypeScript errors being suppressed (`ignoreBuildErrors: true` in `next.config.js`). This is a ticking time bomb — it means bugs are hiding. Fix the errors and turn the safety net back on.

1. Run: `npx tsc --noEmit` from the project root. This shows all TypeScript errors without building.
2. Copy the full error output into Claude. Say: *"These are TypeScript errors in my Next.js 16 project using React 19 and Framer Motion. Help me fix them one at a time."*
3. Most errors are probably Framer Motion type conflicts with React 19. Claude will know the fixes (usually type assertions or updated imports).
4. Fix each error. After each fix, run `npx tsc --noEmit` again to confirm it's resolved.
5. Once ALL errors are fixed, open `next.config.js` and change `ignoreBuildErrors` from `true` to `false`.
6. Run `npm run build` to verify everything compiles cleanly.
7. Commit: `git checkout -b fix/typescript-errors && git add . && git commit -m "Fix TypeScript errors, re-enable type checking" && git push origin fix/typescript-errors`

### Task S3: Build the Email Notification System

**Difficulty:** Intermediate | **Tools:** VS Code/Cursor, Claude, Terminal, Resend

VantakOS has almost no email notifications. Business owners need emails when they get a booking or payment. Customers need confirmations. This makes the product feel professional and worth the price.

1. Sign up for Resend (resend.com) — free tier, great API, works perfectly with Next.js. Get an API key.
2. Add to `.env`: `RESEND_API_KEY=your_key_here`
3. Install: `npm install resend`
4. Create `lib/email.ts`. Ask Claude: *"Create a reusable email utility using Resend for a Next.js app. I need: sendBookingConfirmation(customerEmail, details), sendPaymentReceipt(customerEmail, details), sendNewBookingAlert(ownerEmail, details), sendEstimateToCustomer(customerEmail, estimateLink). Use clean, professional HTML templates that look like they belong to a premium platform."*
5. Hook into existing flows: booking API (`app/api/appointments/`) → send booking confirmation + owner alert. Stripe webhook → send payment receipt.
6. Test by creating a booking and making a test payment. Check your email.
7. Commit: `feature/email-notifications`

### Task S4: Rebuild the Customer-Facing PWA to Look Premium

**Difficulty:** Advanced | **Tools:** VS Code/Cursor, Claude, Terminal

The customer-facing app (the page at `/{slug}`) needs to look like something worth paying for. Right now it's ugly and non-functional. This is what the business owner's CUSTOMERS see — it needs to be polished.

1. Look at the current public page: `app/[slug]/page.tsx` and related components.
2. Paste it into Claude with this prompt: *"This is the customer-facing page for a white-label business platform. Each business gets their own branded page. It needs to look like a premium app that's worth $1,000/month to the business owner. Rebuild this with: clean hero section with the business name and branding colors, service cards with prices and booking buttons, a 'Book Now' flow, business info section, and a polished mobile-first design using Tailwind CSS. The branding colors come from the tenant's Supabase record."*
3. Focus on mobile-first. Most customers will see this on their phone.
4. Make sure the PWA install banner still works (check components for the install prompt logic).
5. Test with one of the demo businesses once Chris has them set up (Task C4).
6. Commit: `feature/rebuild-customer-pwa`

### Task S5: Complete the Estimate System with Signature Collection

**Difficulty:** Advanced | **Tools:** VS Code/Cursor, Claude, Terminal

Estimates with signature collection are a key selling point, especially for the Business Tools tier and above. The backend exists but the frontend is a stub.

1. Read existing code: `app/dashboard/estimates/create/page.tsx` and `app/api/estimate/` routes.
2. Paste into Claude: *"This is a partially built estimate system in Next.js with Supabase. Complete it with: (1) a form for line items with descriptions and prices, (2) a professional-looking estimate preview, (3) a shareable link for the customer, (4) a customer-facing page where they view, sign, and approve, (5) signature collection using HTML5 Canvas, (6) optional deposit collection via Stripe."*
3. The approval page partially exists at `app/approve/[id]/page.tsx` — build on it.
4. Test full flow: create estimate → copy link → open in incognito → customer signs and approves → shows in dashboard.
5. Commit: `feature/estimate-system`

### Task S6: Clean Up Legacy Code

**Difficulty:** Intermediate | **Tools:** Terminal, VS Code/Cursor

There's a `_legacy_vite` folder and old code from the Vite era. Clean house so the codebase is easier to work in.

1. Delete `_legacy_vite` folder: `rm -rf _legacy_vite`
2. Search for any imports referencing `_legacy_vite` files. Update if found.
3. Check the old `/api` folder (not `/app/api`) — if routes have been migrated to `/app/api`, remove the old ones.
4. Run `npm run dev` and `npm run build` to verify nothing broke.
5. Commit: `chore/cleanup-legacy-code`

---

## Dallin — Business Testing & Content

**Role:** You bring something nobody else on this team has — you run a multi-million dollar business. You know what it actually feels like to need software that works. Your perspective on what a real business owner needs is more valuable than any developer's opinion. Your tasks focus on testing, feedback, content, and getting your feet wet with code.

### Priority Tasks

### Task D1: Business Owner UX Audit

**Difficulty:** Beginner | **Tools:** Browser, Phone, Google Docs

Go through VantakOS as if you were evaluating it for your roofing company. Your feedback is gold because you actually run a business that does millions in revenue. Would you pay $1,000/month for this?

1. Look at the landing page at vantakOS.com. Read every word. Does this make you want to sign up? Does it feel like a premium product or a toy? Write down your gut reaction.
2. Try the signup (it may be broken — if so, Kody will give you test credentials to explore the dashboard).
3. Go through every dashboard feature. For each one, answer: Does this make sense? Is anything missing that you'd need? Would you actually use this in your roofing business?
4. Look at the pricing tiers. As someone who runs a $3–4M business: would you pay $5K + $1K/month for a Production App? What about $15K for White Label? What would make you say yes or no?
5. Create a Google Doc: "VantakOS Business Owner Feedback — Dallin". Be brutally honest. Sections: First Impressions, Dashboard Review, Pricing Reaction, What's Missing, What Would Make Me Switch From My Current Tools.
6. Key question: If VantakOS added features for roofing/contracting (insurance claim tracking, photo documentation, etc.), would you use it for your own company?
7. Share with Kody and Chris.

### Task D2: Write FAQ Content Based on Real Business Owner Questions

**Difficulty:** Beginner | **Tools:** Google Docs, Claude

You know what questions a real business owner would ask before putting their operations on a new platform. Write the FAQ from that perspective.

1. Think about what YOU would want to know before paying $5K+ for a business platform. Examples: How fast do I get paid? What happens if the platform goes down? Can my customers see my prices? What if I want to cancel? Is my data mine? Can I switch later?
2. Write 10–15 questions and answers. Keep answers to 2–3 sentences. Write like you're explaining to a business owner friend, not writing a legal document.
3. Include at least 3 questions about money/pricing specifically (this is what people really care about).
4. Include the Production App guarantee in one of the answers.
5. Use Claude to help polish the writing, but the QUESTIONS should come from your brain as a business owner.
6. Put in a Google Doc and share with Kody and Chris.

### Task D3: Create 5 Use-Case Stories for Different Business Types

**Difficulty:** Beginner | **Tools:** Google Docs, Claude

We need to show potential customers how different businesses use VantakOS. These become testimonials on the website.

1. Write 5 realistic use cases. For each include: business name, what they do, their biggest pain point BEFORE Vantak, which tier they chose, which features they use most, and a 1–2 sentence quote from the "owner."
2. Business types: (1) a mobile auto detailer, (2) a house cleaning service, (3) a personal trainer, (4) a lawn care company, (5) a small bakery or food truck.
3. Make these feel REAL. Use your business experience. Real pain points: missed calls, lost invoices, looking unprofessional with no website, paying too much for scattered software subscriptions, etc.
4. For at least one, show the upgrade path: started on Bootstrap, grew to Production App as they got busier.
5. Share in Google Docs with Kody and Chris.

### Task D4: Competitor Research: How We Stack Up

**Difficulty:** Beginner | **Tools:** Browser, Google Docs/Sheets, Claude

We need to know what competitors charge and offer so we can position Vantak properly in sales conversations.

1. Research these competitors: Square for Business, Jobber, Housecall Pro, ServiceTitan, GoHighLevel.
2. For each: monthly price per tier, setup/upfront costs, transaction fees, key features, what kind of businesses they target, contract terms.
3. Create a comparison showing VantakOS vs. each competitor. Key angles: total cost of ownership (not just monthly fee), what you get for the money, customization level, whether you get your own branded app.
4. Highlight where we WIN: custom branded app at a fraction of custom dev cost, all-in-one vs. scattered tools, the guarantee.
5. Highlight where we're WEAK: we're newer, smaller feature set in some areas. Be honest — this helps us prioritize.
6. Share with Kody and Chris. This feeds directly into sales materials.

### Task D5: Your First Code Task: Update the Landing Page Footer

**Difficulty:** Beginner | **Tools:** VS Code/Cursor, Terminal, Claude

Small, safe task to get your hands in the code. You're going to update the footer on the VantakOS landing page.

1. Make sure the project is running locally (Task 0).
2. Open the project in VS Code or Cursor.
3. Ask Claude: *"In this Next.js project, where is the footer component for the landing page?"* and share the file structure (or let Cursor scan it).
4. Open the footer file. Even if you don't understand all the code, you'll see text content you can change.
5. Update: copyright year to 2026, make sure KC Dev Studio LLC is credited, update any placeholder links or social media URLs.
6. Save the file. Your browser at localhost:3000 should auto-refresh with your changes.
7. If it works: `git checkout -b fix/footer-update && git add . && git commit -m "Update footer content" && git push origin fix/footer-update`
8. You just shipped code. Welcome to the team.

---

## Team Workflow & Schedule

### How We Communicate

- **Git Branches:** Never work on the "main" branch directly. Always create a new branch (the tasks tell you how). When done, message Kody to review and merge.
- **Group Chat:** Post updates when you finish a task or when you're stuck. Don't go quiet for days.
- **Stuck?** Paste your error into Claude FIRST. 90% of the time it'll fix it. If Claude can't help, screenshot everything and send to Kody.
- **Google Docs:** All non-code work (copy, feedback, research) goes in Google Docs shared with Kody.
- **15-Minute Rule:** Don't sit stuck for more than 15 minutes. Ask Claude. Ask Kody. Ask each other. Speed comes from not spinning your wheels.

### Using AI as Your Coding Partner

This is how Kody built 120,000+ lines of code with zero prior experience. Here's the workflow:

1. Open Claude (claude.ai) or the AI chat in Cursor.
2. Describe what you want to build in plain English.
3. Share the relevant code files so Claude has context.
4. Claude writes the code. Ask it to explain anything you don't understand.
5. Paste the code into the right file and save.
6. Check your browser. Did it work?
7. If it broke, copy the error and ask Claude to fix it. Repeat.

---

## Priority Schedule

### WEEK 1 — Foundation

- **Everyone:** Task 0 (get the project running locally)
- **Shon:** S1 (FIX SIGNUP — this unblocks everything) + S2 (TypeScript fixes)
- **Chris:** C1 (website copy) + C2 (QA audit — document what's broken while Shon fixes signup)
- **Dallin:** D1 (business owner UX audit) + D2 (FAQ content)

### WEEK 2 — Features & Content

- **Shon:** S3 (email notifications) + S4 (rebuild customer-facing PWA)
- **Chris:** C3 (sales materials) + C4 (demo businesses — once signup works)
- **Dallin:** D3 (use-case stories) + D4 (competitor research) + D5 (footer code task)

### WEEK 3 — Polish & Expand

- **Shon:** S5 (estimate system with signatures) + S6 (legacy code cleanup)
- **Chris:** C5 (calendar view) + begin planning next feature priorities
- **Dallin:** Review everything with fresh eyes. More UX feedback based on new features.

### ONGOING

- **Chris:** Owns the product roadmap. Coordinates team. Starts selling to prospects.
- **Shon:** Tackles new backend/infrastructure work as it comes up. Customer portal is next after Week 3.
- **Dallin:** Continues business feedback, content, and testing. Gradually takes on more code tasks.

---

**Remember:** The goal is to get VantakOS to a state where Chris can demo it to a prospect and close a $5K Production App deal. Every task in this document moves us toward that moment.
