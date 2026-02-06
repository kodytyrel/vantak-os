 # START HERE - Vantak Setup Guide
 
 **Welcome, Chris!**
 
 This guide will walk you through getting Vantak running on your computer from scratch. Follow every step in order.
 
 **Total time:** ~30 minutes
 
 ---
 
 ## What You'll Need
 
 Before you start, make sure you have:
 - [ ] A computer (Windows, Mac, or Linux)
 - [ ] Internet connection
 - [ ] A GitHub account (free)
 - [ ] A Supabase account (free) - we'll create this in Step 3
 - [ ] A Stripe account (free) - we'll create this in Step 4
 
 ---
 
 ## Step 1: Install Required Software
 
 ### 1.1 Install Git
 
 **What it does:** Git lets you download and manage code.
 
 **Windows:**
 1. Go to https://git-scm.com/download/win
 2. Download the installer
 3. Run it and click "Next" through all the prompts (defaults are fine)
 4. Restart your computer
 
 **Mac:**
 1. Open Terminal (search "Terminal" in Spotlight)
 2. Type: `git --version` and press Enter
 3. If it says "command not found", it will prompt you to install Xcode Command Line Tools - click "Install"
 
 **Verify it worked:**
 - Open Command Prompt (Windows) or Terminal (Mac)
 - Type: `git --version`
 - You should see something like: `git version 2.43.0`
 
 ### 1.2 Install Node.js
 
 **What it does:** Node.js runs JavaScript on your computer (needed for Vantak).
 
 **For everyone:**
 1. Go to https://nodejs.org
 2. Download the **LTS version** (the one that says "Recommended for most users")
 3. Run the installer
 4. Click "Next" through all prompts (defaults are fine)
 5. Restart your computer
 
 **Verify it worked:**
 - Open Command Prompt (Windows) or Terminal (Mac)
 - Type: `node --version`
 - You should see something like: `v20.11.0`
 
 ### 1.3 Install VS Code or Cursor (Code Editor)
 
 **What it does:** This is where you'll write code.
 
 **Recommended: Cursor (VS Code with AI built-in)**
 1. Go to https://cursor.com
 2. Download for your OS
 3. Install it
 4. Open it
 
 **Alternative: VS Code**
 1. Go to https://code.visualstudio.com
 2. Download for your OS
 3. Install it
 
 ---
 
 ## Step 2: Get the Code from GitHub
 
 ### 2.1 Create a GitHub Account (if you don't have one)
 
 1. Go to https://github.com
 2. Click "Sign up"
 3. Follow the prompts to create a free account
 
 ### 2.2 Download the Vantak Code
 
 **Option A: Using Command Line (Recommended)**
 
 1. Open Command Prompt (Windows) or Terminal (Mac)
 2. Navigate to where you want to store the code:
 ```bash
    cd Documents
 ```
 3. Clone the repository:
 ```bash
    git clone https://github.com/kodytyrel/vantak-os.git
 ```
 4. You should see: "Cloning into 'vantak-os'..."
 5. Navigate into the folder:
 ```bash
    cd vantak-os
 ```
 
 **Option B: Download as ZIP**
 
 1. Go to https://github.com/kodytyrel/vantak-os
 2. Click the green "Code" button
 3. Click "Download ZIP"
 4. Extract the ZIP file to your Documents folder
 5. Rename the folder from `vantak-os-main` to `vantak-os`
 
 **Verify it worked:**
 - You should have a folder called `vantak-os` in your Documents
 - Inside it, you should see folders like: `app`, `components`, `lib`, etc.
 
 ### 2.3 Open the Project in Your Code Editor
 
 **In Cursor/VS Code:**
 1. File → Open Folder
 2. Navigate to your `vantak-os` folder
 3. Click "Select Folder"
 4. You should now see all the files in the sidebar
 
 ---
 
 ## Step 3: Create Your Supabase Account & Project
 
 **What Supabase does:** It's your database and authentication system.
 
 ### 3.1 Sign Up
 
 1. Go to https://supabase.com
 2. Click "Start your project"
 3. Sign up with GitHub (easiest) or email
 4. Verify your email if prompted
 
 ### 3.2 Create a New Project
 
 1. Click "New Project"
 2. Fill in:
    - **Name:** `vantak` (or whatever you want)
    - **Database Password:** Create a strong password (SAVE THIS!)
    - **Region:** Choose closest to you (e.g., "US West" if you're in California)
    - **Pricing Plan:** Free (for now)
 3. Click "Create new project"
 4. Wait ~2 minutes while it sets up (grab a coffee)
 
 ### 3.3 Get Your API Keys
 
 1. Once the project is ready, click on **Settings** (gear icon in sidebar)
 2. Click **API**
 3. You'll see three important values:
 
 **Project URL:**
 ```
 https://abcdefghijk.supabase.co
 ```

**Anon (public) key:**
```
YOUR_SUPABASE_ANON_KEY
```

**Service role (secret) key:**
```
YOUR_SUPABASE_SERVICE_ROLE_KEY
```

**Important:** The service role key is secret. Never share it publicly.

---

## Step 4: Create Your Stripe Account & Keys

**What Stripe does:** It handles payments.

### 4.1 Sign Up

1. Go to https://stripe.com
2. Click "Start now"
3. Create a free account

### 4.2 Get Your Stripe Keys

1. In Stripe, click **Developers** (top right)
2. Click **API keys**
3. Copy these:

**Secret key:**
```
YOUR_STRIPE_SECRET_KEY
```

**Webhook secret (needed later):**
We will add this after you create a webhook in Step 7.

---

## Step 5: Set Up Your Environment File

**What this does:** It stores your secret keys locally.

### 5.1 Create `.env.local`

In your project folder, create a file named `.env.local`.

You can also copy the example:
```bash
cp .env.example .env.local
```

### 5.2 Paste These Values

Open `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_URL=http://localhost:3000
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

If you don't have a Gemini key yet, leave it blank for now:
```
GEMINI_API_KEY=
```

---

## Step 6: Install Dependencies

In Terminal (inside the project folder), run:
```bash
npm install
```

This may take a few minutes.

---

## Step 7: Run the App

Start the dev server:
```bash
npm run dev
```

Then open your browser and go to:
```
http://localhost:3000
```

You should see the Vantak app.

---

## Step 8: (Later) Set Up Stripe Webhooks

This is needed for payments to work fully.

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL:
```
http://localhost:3000/api/webhooks/stripe
```
4. Select event:
   - `checkout.session.completed`
5. Click **Add endpoint**
6. Copy the **Signing secret** and paste into `.env.local`:
```
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET
```

---

## Step 9: You’re Done

If you see the app running at `http://localhost:3000`, you’re all set.

If something breaks, take a screenshot and ask for help.
