# Next.js + Supabase Template

Production-ready scaffold for Next.js (App Router) + Supabase + Vitest + Playwright + GitHub Actions CI/CD.

## What's included

| Category | Detail |
|---|---|
| **Supabase** | Browser + server clients (`lib/supabase/`), empty migrations folder |
| **Testing** | Vitest + Testing Library for unit tests, Playwright (chromium) for e2e |
| **CI/CD** | GitHub Actions: typecheck → unit → e2e on PR; smoke test on merge to main |
| **Env split** | Preview deployments → QA Supabase project, Production → Prod project |
| **Auth bypass** | Vercel deployment protection stays on; CI bypasses via secret header |

## Usage

Click **"Use this template"** on GitHub, then follow the setup steps below.

---

## Setup walkthrough

### Step 1 — Create two Supabase projects

You need two projects: one for QA (preview + local dev) and one for production. Keeping them separate prevents dev data from ever touching prod.

1. Go to [supabase.com](https://supabase.com) → your organization
2. Create project **`[app]-qa`** — choose your region, save the database password
3. Create project **`[app]-prod`** — same region

> **Free tier note:** Supabase allows 2 active projects on the free tier. If you're at the limit, pause an unused project first.

For **each** project, collect three values from **Settings → API**:

| What | Where on the page | Env var |
|---|---|---|
| **Project URL** | Top of the page | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable key** | "Publishable and secret API keys" tab → Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret key** | "Publishable and secret API keys" tab → Secret key (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` |

> **Key types:** Supabase now uses Publishable keys (replaces the old "anon" JWT key) and Secret keys (replaces the old "service_role" JWT key). Use the **"Publishable and secret API keys"** tab, not the legacy tab.

> **Publishable key** is safe in the browser — RLS controls what it can access. **Secret key** bypasses RLS entirely — server-only, never in a `NEXT_PUBLIC_` variable.

---

### Step 2 — Set Vercel environment variables

In **Vercel dashboard → your project → Settings → Environment Variables**:

**Preview scope** (every PR / branch deployment → QA project):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | QA project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | QA publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | QA secret key |

**Production scope** (main branch deployments only → Prod project):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod secret key |

> Do **not** set these in Development scope — local dev uses `.env.local`.

---

### Step 3 — Set up Vercel deployment protection + CI bypass

Vercel Authentication (enabled by default) protects preview URLs so only logged-in Vercel teammates can view them. This is correct — but CI also needs access. The bypass pattern keeps protection on while letting the test runner through via a secret header.

**3a. Create a bypass secret**

Generate a random 32-character string (exactly 32):
```bash
openssl rand -hex 16
```

**3b. Add it to Vercel**

Vercel dashboard → **your project → Settings → Deployment Protection → Protection Bypass for Automation → Add bypass**

- Name: `PLAYWRIGHT_BYPASS` (or any label)
- Secret: your 32-character string
- Click **Add**

**3c. Add it to GitHub Actions secrets**

GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Your 32-character string (same one) |

The `playwright.config.ts` in this template already reads this secret and attaches it as an `x-vercel-protection-bypass` header when present. No code changes needed.

---

### Step 4 — Add remaining GitHub Actions secrets

Same place: GitHub repo → **Settings → Secrets and variables → Actions**:

| Secret name | Value | How to get it |
|---|---|---|
| `VERCEL_TOKEN` | Vercel personal access token | [vercel.com/account/tokens](https://vercel.com/account/tokens) → New Token |
| `PROD_URL` | Your production URL | e.g. `https://myapp.vercel.app` — visible in Vercel dashboard |

> `GITHUB_TOKEN` is provided automatically — do not add it.

---

### Step 5 — Local dev setup

```bash
# 1. Copy the env example and fill in your QA project values
cp .env.local.example .env.local

# 2. Install dependencies
npm install

# 3. Install Playwright browser (one-time per machine)
npx playwright install --with-deps chromium

# 4. Verify everything works
npm test            # unit tests
npm run type-check  # TypeScript
npm run dev         # dev server at localhost:3000
```

For e2e tests locally:
```bash
# Terminal 1
npm run dev

# Terminal 2
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

> The bypass header is only sent when `VERCEL_AUTOMATION_BYPASS_SECRET` is set. It's never needed for local dev.

---

### Step 6 — Connect Vercel GitHub integration

Vercel dashboard → **your project → Settings → Git** → connect your GitHub repository.

This enables automatic preview deployments on every PR — required for the e2e CI job to work.

---

## How CI/CD works

### On every pull request (`ci.yml`)

```
Lint & Type Check → Unit Tests → E2E Tests (against Vercel preview URL)
```

The e2e job:
1. Polls the GitHub Deployments API until the Vercel preview URL is ready (up to 5 min)
2. Runs Playwright against that URL with the bypass header
3. Requires secrets: `GITHUB_TOKEN` (automatic), `VERCEL_AUTOMATION_BYPASS_SECRET`, `VERCEL_TOKEN`

### On merge to main (`deploy-prod.yml`)

```
Wait 60s → Smoke test (Playwright against PROD_URL)
```

Runs only `tests/e2e/home.spec.ts` against your production URL to confirm the deploy is healthy.

### Playwright report artifact

After every CI run (pass or fail), the full HTML report is uploaded as a GitHub Actions artifact named **`playwright-report`** and kept for 7 days.

To view it:
1. Go to the Actions run on GitHub → scroll to **Artifacts** → download `playwright-report`
2. Unzip and run:
```bash
npx playwright show-report path/to/playwright-report
```

The report includes pass/fail per test, step-by-step traces on retry, screenshots on failure, and timing. Most useful when a test fails in CI but passes locally.

---

## Playwright UI — local development

Two modes for running tests locally:

**Interactive UI** (best for writing new tests — watch tests run in real time, inspect each step):
```bash
npm run test:e2e:ui
```

**HTML report** (review results after a run):
```bash
npm run test:e2e
npx playwright show-report
```

---

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run test:e2e:ui` | Playwright interactive UI mode |
| `npm run type-check` | TypeScript check without emit |
