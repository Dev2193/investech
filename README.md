# InvesTech.AI — Stock Research

Enter a US stock ticker and get a one-page research report:

| Section | What it shows | Data source |
| --- | --- | --- |
| **Company financials** | Revenue, net income, margins, EPS, cash, debt, FCF, key ratios (P/E, D/E, ROE, current ratio), YoY growth, 6-year chart + table | SEC EDGAR XBRL company facts (10-K) + price |
| **Industry outlook** | Sector ETF (SPDR Select Sector) vs S&P 500 over 3/6/12 months, 200-day trend, peers' median revenue growth | SEC SIC code → sector, Yahoo Finance prices, SEC EDGAR |
| **Industry position** | Competitors, revenue rank, market-cap rank, revenue growth & margin vs peers, share of peer-group revenue over time | Finnhub peers + market cap, SEC EDGAR revenue |
| **Market sentiment** | Analyst recommendation trend, 30-day news headlines with transparent keyword tone, price momentum | Finnhub, Yahoo Finance |
| **Economic factors** | Fed funds, CPI, real GDP, unemployment, 10Y yield + sector-specific indicators (oil, mortgage rates, yield curve, retail sales…) with plain-English relevance | FRED (St. Louis Fed) |
| **Conclusion** | Invest / Hold / Avoid from a weighted, fully itemised score with reasons for and against, plus a not-financial-advice disclaimer | All of the above |

No numbers are ever invented: if a source is unavailable or a key is missing, that section shows a setup or error message instead.

The AI Assistant (OpenAI chat, bring-your-own key) lives at `/assistant`.

## Architecture

```
src/                              React + Vite web app (deployed by Lovable)
  pages/Research.tsx              landing page + ticker search
  pages/StockReport.tsx           /stock/:ticker report
  pages/Assistant.tsx             /assistant AI chat
  hooks/useStockResearch.ts       react-query orchestration of all data + scoring
  lib/api.ts                      API client (VITE_API_BASE_URL)
  services/research/              client-side data shaping + scoring, one module per source
    secEdgar.ts prices.ts fred.ts finnhub.ts sectors.ts newsSentiment.ts analysis.ts
  components/research/            report sections

server/                           InvesTech API — Node 20 + TypeScript + Hono
  src/index.ts                    HTTP server (PORT, default 8787)
  src/app.ts                      routes, CORS, per-client rate limits
  src/routes/research.ts          POST /api/research  { source, path, params }
  src/routes/chat.ts              POST /api/chat      { messages }  (OpenAI, key server-side)
  src/sources/                    sec.ts yahoo.ts fred.ts finnhub.ts — one module per upstream
  src/lib/                        cache (TTL + in-flight de-dupe), upstream limiters, errors
  Dockerfile
```

SEC EDGAR, FRED and Yahoo don't allow browser (CORS) requests, and API keys (Finnhub, OpenAI) must not ship to the browser, so the web app talks only to the API server. The server only proxies an allow-list of endpoints, caches responses in memory (SEC facts 6h, prices/Finnhub 15 min, FRED 6h), de-duplicates concurrent identical calls, throttles each upstream below its free-tier limit (SEC ≤ 8 req/s, Finnhub ≤ 55 req/min) and rate-limits each client IP.

API routes: `GET /health`, `GET /api/status` (which integrations are configured — booleans only), `POST /api/research`, `POST /api/chat`. Every `/api` response is `{ ok: true, data }` or `{ ok: false, code, message, source }` with codes `missing_key | rate_limited | not_found | bad_request | upstream`.

## Environment variables

**API server** (`server/.env` locally, or the host's environment settings in production):

| Variable | Required? | Where to get it | Used for |
| --- | --- | --- | --- |
| `SEC_USER_AGENT` | **Yes** | No signup. SEC requires a descriptive User-Agent with a contact email, e.g. `InvesTech.AI you@yourdomain.com` ([SEC policy](https://www.sec.gov/os/accessing-edgar-data)) | Ticker lookup, financials, industry (SIC), peer revenue |
| `FINNHUB_API_KEY` | Optional (recommended) | Free at [finnhub.io/register](https://finnhub.io/register) — 60 calls/min | Peers, analyst recommendations, company news, market cap |
| `FRED_API_KEY` | Optional | Free at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) | Macro data via the official API (otherwise FRED's public CSV download) |
| `OPENAI_API_KEY` | Optional | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (paid) | AI Assistant chat. `OPENAI_MODEL` overrides the model (default `gpt-4.1-2025-04-14`) |
| `ALLOWED_ORIGINS` | Recommended in prod | — | Comma-separated CORS origins, e.g. `https://investech.ai,https://<project>.lovable.app` (default `*`) |
| `PORT` | Set by most hosts | — | Listen port (default 8787) |
| `RATE_LIMIT_RESEARCH_PER_MIN` / `RATE_LIMIT_CHAT_PER_MIN` | Optional | — | Per-IP budgets (defaults 300 / 20) |

**Web app** (`.env`, committed — public values only):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | URL of the deployed API, e.g. `https://investech-api.onrender.com`. Empty = same origin (dev proxy). Baked in at build time. |

Price history uses Yahoo Finance's public chart endpoint (no key; unofficial).

## Run locally

```sh
npm i
cp server/.env.example server/.env   # set SEC_USER_AGENT (and optionally FINNHUB_API_KEY, OPENAI_API_KEY)
npm run dev                          # web on http://localhost:8080 + API on http://localhost:8787
```

`npm run dev` starts both with `concurrently` (it installs `server/` dependencies on first run); Vite proxies `/api` to the API. Other scripts: `npm run dev:web`, `npm run server` (API only), `npm run server:build`, `npm run server:start`, `npm run server:typecheck`.

## Deploy the API

The API is a plain Node app in `server/` with a Dockerfile, so any host works. No database or disk is needed.

**Render** (Web Service): New → Web Service → this repo, *Root Directory* `server`, Runtime *Docker* (or Node with build `npm ci && npm run build`, start `npm start`). Health check path `/health`. Add the env vars above.

**Railway**: New project → Deploy from GitHub repo → set the service *Root Directory* to `server` (it picks up the Dockerfile), add the env vars, then *Generate Domain*.

**Fly.io**: `cd server && fly launch` (uses the Dockerfile; internal port 8787), then `fly secrets set SEC_USER_AGENT="InvesTech.AI you@domain.com" FINNHUB_API_KEY=... OPENAI_API_KEY=...` and `fly deploy`.

**Any Docker host**:

```sh
docker build -t investech-api ./server
docker run -p 8787:8787 -e SEC_USER_AGENT="InvesTech.AI you@domain.com" -e FINNHUB_API_KEY=... investech-api
```

Then check `https://<your-api>/health` and `https://<your-api>/api/status`.

### Point the Lovable site at the API

1. Set `VITE_API_BASE_URL` in `.env` to the API's public URL (edit the file in Lovable or GitHub, commit) — Lovable rebuilds the site with it.
2. Set `ALLOWED_ORIGINS` on the API to the site's origins (custom domain and `*.lovable.app` preview URL).
3. Open `/stock/AAPL` on the site. If the API is unreachable the page shows a "backend not connected" card instead of data.

The in-memory cache and rate limits are per instance; one small instance is plenty for personal use. For several instances, add a shared cache/limiter (e.g. Redis).

### Known limitations

- Covers companies that file with the SEC (US-listed). Foreign filers (20-F/40-F) often lack standard XBRL tags; funds/ETFs have no financials.
- Financials are annual (10-K) as reported; EPS isn't adjusted for later splits; some line items use company-specific tags and show "—".
- Industry outlook is inferred from market pricing and peer growth; free sources don't offer forward industry forecasts.
- Analyst price targets and social-media sentiment need paid plans and are not included. Headline tone is a simple keyword method.
- Scoring thresholds are simple rules of thumb (see `src/services/research/analysis.ts`). **Not financial advice.**

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ca1613e2-2e0c-4672-bc3e-43d1efb9c19e

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ca1613e2-2e0c-4672-bc3e-43d1efb9c19e) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ca1613e2-2e0c-4672-bc3e-43d1efb9c19e) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
