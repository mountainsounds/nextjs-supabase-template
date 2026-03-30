# Next.js + Supabase Template

Production-ready scaffold for Next.js (App Router) + Supabase + Vitest + Playwright + GitHub Actions CI/CD.

## What's included

| Category | Detail |
|---|---|
| **Supabase** | Browser + server clients (`lib/supabase/`), empty migrations folder |
| **Testing** | Vitest + Testing Library for unit tests, Playwright (chromium) for e2e |
| **CI/CD** | GitHub Actions: typecheck → unit → e2e on PR; smoke test on merge to main |
| **Env split** | Preview deployments → QA Supabase project, Production → Prod project |

## Setup checklist

### 1. Create two Supabase projects
- `[app]-qa` — for local dev and Vercel preview deployments
- `[app]-prod` — for production only

For each, grab the **Project URL**, **Anon key**, and **Service Role key**.

### 2. Set Vercel environment variables

| Variable | Preview scope | Production scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | QA URL | Prod URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | QA anon key | Prod anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | QA service role key | Prod service role key |

Do **not** set these in Development scope — use `.env.local` for that.

### 3. Add GitHub Actions secrets

Go to your repo → **Settings → Secrets and variables → Actions**:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | Your Vercel personal access token |
| `PROD_URL` | Your production URL (e.g. `https://myapp.vercel.app`) |

### 4. Local dev setup

```bash
cp .env.local.example .env.local
# Fill in your QA project values
npm install
npx playwright install --with-deps chromium
npm test          # unit tests
npm run test:e2e  # e2e (requires PLAYWRIGHT_BASE_URL or running dev server)
```

### 5. Connect Vercel GitHub integration

In Vercel dashboard → project → **Settings → Git** → connect your GitHub repo.
This enables automatic preview deployments on every PR.

## Usage

Click **"Use this template"** on GitHub to create a new repo from this scaffold.

## Scripts

| Script | What it does |
|---|---|
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run type-check` | TypeScript check without emit |
