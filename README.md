# Next.js + Supabase Template

Production-ready scaffold for Next.js (App Router) + Supabase + Vitest + Playwright + GitHub Actions CI/CD.

## What's included

| Category | Detail |
|---|---|
| **Supabase** | Browser + server clients (`lib/supabase/`), empty migrations folder |
| **Testing** | Vitest + Testing Library for unit tests, Playwright (chromium) for e2e |
| **CI/CD** | GitHub Actions: typecheck → unit → e2e on PR; smoke test on merge to main |
| **Env split** | Preview deployments → QA Supabase project, Production → Prod project |

## Usage

Click **"Use this template"** on GitHub, then follow the setup steps below.

---

## Setup walkthrough

### Step 1 — Create two Supabase projects

You need two projects: one for QA (preview + local dev) and one for production. Keeping them separate prevents dev data from ever touching prod.

1. Go to [supabase.com](https://supabase.com) → your organization
2. Create project **`[app]-qa`** — choose your region, save the database password somewhere safe
3. Create project **`[app]-prod`** — same region

For **each** project, collect three values from **Settings → API**:

| What | Where on the page | Used for |
|---|---|---|
| **Project URL** | Top of the page | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable key** | "Publishable and secret API keys" tab → Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret key** | "Publishable and secret API keys" tab → Secret key (`sb_secret_...`) | `SUPABASE_SERVICE_ROLE_KEY` |

> **Note on key types:** Supabase now uses Publishable keys (replaces the old "anon" JWT key) and Secret keys (replaces the old "service_role" JWT key). Use the new **"Publishable and secret API keys"** tab, not the legacy tab. The env var names in this template are unchanged — only the value format is different.

> **Publishable key** is safe for the browser — it's like a guest pass, and Row Level Security (RLS) controls what it can access. **Secret key** bypasses RLS entirely and must only ever be used server-side. Never put it in a `NEXT_PUBLIC_` variable.

---

### Step 2 — Set Vercel environment variables

In **Vercel dashboard → your project → Settings → Environment Variables**, add the following. Scope matters — do not mix them up.

**Preview scope** (used for every PR / branch deployment → points at QA project):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | QA project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | QA publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | QA secret key |

**Production scope** (used only when deploying from `main` → points at Prod project):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Prod project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod secret key |

> **Do not set these in Development scope** — local dev uses `.env.local` (see Step 4).

---

### Step 3 — Add GitHub Actions secrets

The CI pipeline needs two secrets to run e2e tests against Vercel deployments.

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value | How to get it |
|---|---|---|
| `VERCEL_TOKEN` | Your Vercel personal access token | [vercel.com/account/tokens](https://vercel.com/account/tokens) → New Token → any name, full scope |
| `PROD_URL` | Your production URL | e.g. `https://myapp.vercel.app` — visible in Vercel dashboard |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions — you do not need to add it.

---

### Step 4 — Local dev setup

```bash
# 1. Copy the env example and fill in your QA project values
cp .env.local.example .env.local

# 2. Install dependencies
npm install

# 3. Install Playwright browser (one-time, per machine)
npx playwright install --with-deps chromium

# 4. Verify everything works
npm test            # unit tests — should pass immediately
npm run type-check  # TypeScript — should be clean
npm run dev         # start dev server at localhost:3000
```

For e2e tests locally, run against your dev server:
```bash
# Terminal 1
npm run dev

# Terminal 2
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e
```

Or run against your deployed preview/prod URL:
```bash
PLAYWRIGHT_BASE_URL=https://your-preview-url.vercel.app npm run test:e2e
```

---

### Step 5 — Connect Vercel GitHub integration

This enables automatic preview deployments on every PR (required for the CI e2e job to work).

1. Go to **Vercel dashboard → your project → Settings → Git**
2. Connect your GitHub repository
3. Verify: open a PR and confirm a preview URL appears in the PR checks

---

## How CI/CD works

### On every pull request (`ci.yml`)

```
typecheck → unit tests → e2e tests (against Vercel preview URL)
```

The e2e job polls the GitHub Deployments API until Vercel's preview URL is ready, then runs Playwright against it. Requires `VERCEL_TOKEN` secret.

### On merge to main (`deploy-prod.yml`)

```
wait 60s → smoke test (Playwright against PROD_URL)
```

Runs only `tests/e2e/home.spec.ts` against your production URL to confirm the deploy is healthy.

---

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run type-check` | TypeScript check without emit |
