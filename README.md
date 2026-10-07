# InvesTech.AI

**Type a US stock ticker, get a one-page research report built from public data, plus a clear Invest / Hold / Avoid verdict that shows its work.**

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-API_image-2496ED?logo=docker&logoColor=white)

---

## Contents

- [What it is](#what-it-is)
- [What's in a report](#whats-in-a-report)
- [How it's built](#how-its-built)
- [Repository layout](#repository-layout)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [API reference](#api-reference)
- [Deploying](#deploying)
- [CI](#ci)
- [Limitations](#limitations)
- [License](#license)

## What it is

InvesTech.AI is a stock research web app. From the landing page you search a ticker (or click an example such as `AAPL`, `MSFT` or `NVDA`) and land on `/stock/:ticker`, where a single page pulls together the company's reported financials, how its sector is trading, where it ranks among competitors, what analysts and headlines are saying, and the state of the wider economy. Each section is scored, and the scores roll up into a weighted verdict with every reason listed.

It also has an **AI Assistant** page (`/assistant`), a chat with an AI analyst about companies, sectors and markets, powered by OpenAI through the project's own API server.

Nothing is made up: when a data source is down or its key isn't configured, the affected section shows a setup or error message rather than placeholder numbers.

> **Not financial advice.** The verdict is produced by simple, documented rules of thumb.

## What's in a report

| Section | Contents | Where the data comes from |
| --- | --- | --- |
| **Company financials** | Revenue, net income, margins, EPS, cash, debt, free cash flow, P/E, debt-to-equity, ROE, current ratio and year-over-year growth, shown as a 6-year chart and table | SEC EDGAR XBRL company facts (10-K filings) combined with price data |
| **Industry outlook** | The matching SPDR Select Sector ETF compared with the S&P 500 over 3, 6 and 12 months, its 200-day trend, and median revenue growth across peers | SEC SIC code mapped to a sector, Yahoo Finance prices, SEC EDGAR |
| **Industry position** | Competitor list, rank by revenue and by market cap, growth and margin versus peers, and share of peer-group revenue over time | Finnhub (peers, market cap) and SEC EDGAR (revenue) |
| **Market sentiment** | Analyst recommendation trend, the last 30 days of news headlines scored with a transparent keyword method, and price momentum | Finnhub, Yahoo Finance |
| **Economic factors** | Fed funds rate, CPI, real GDP, unemployment and the 10-year yield, plus indicators chosen for the company's sector (e.g. oil prices, mortgage rates, the yield curve, retail sales), each with a plain-English note on why it matters | FRED (Federal Reserve Bank of St. Louis) |
| **Conclusion** | Invest / Hold / Avoid, with reasons for and against and a disclaimer | Every section above |

### How the verdict is calculated

The scoring lives in [`src/services/research/analysis.ts`](src/services/research/analysis.ts). Each section produces a score, and those are combined using these weights:

| Section | Weight |
| --- | --- |
| Company financials | 0.30 |
| Industry position | 0.20 |
| Market sentiment | 0.20 |
| Industry outlook | 0.15 |
| Economic factors | 0.15 |

Only sections that actually returned data count toward the composite. A composite of **+0.5 or higher** is *Invest*, **−0.5 or lower** is *Avoid*, and anything in between is *Hold*. If sections covering less than half of the total weight have data, the result is *Insufficient data* instead of a guess.

## How it's built

The project has two parts that live in one repository:

- **Web app** (repo root): React 18 + TypeScript, built with Vite, styled with Tailwind CSS and shadcn/ui (Radix) components, charts drawn with Recharts, and data fetching orchestrated by TanStack Query. Routing is React Router.
- **API server** (`server/`): a small Node 20 + TypeScript service built on [Hono](https://hono.dev/) that the browser talks to for all data and chat.

Why a server at all? SEC EDGAR, FRED and Yahoo Finance don't accept cross-origin requests from browsers, and the Finnhub and OpenAI keys must never be shipped to the client. So the web app only ever calls the InvesTech API, which:

- proxies a fixed **allow-list** of upstream endpoints (one module per source in `server/src/sources/`);
- keeps an **in-memory cache** with in-flight de-duplication, so concurrent identical requests share one upstream call (SEC company facts and filings: 6 h, SEC ticker list: 12 h, FRED: 6 h, Yahoo prices and Finnhub: 15 min);
- **throttles outbound calls** to stay under each provider's free tier (SEC ≤ 8 req/s, Finnhub ≤ 55 req/min, FRED and Yahoo ≤ 5 req/s);
- applies a **per-client-IP rate limit** to research and chat requests;
- holds the OpenAI key server-side and forwards chat messages to OpenAI's Chat Completions API.

There is no database and nothing is written to disk.

## Repository layout

```
.
├── index.html
├── vite.config.ts                 # dev server on :8080, proxies /api to the API (:8787 by default)
├── .env / .env.example            # public, build-time web config (VITE_API_BASE_URL)
├── scripts/dev-api.mjs            # starts the API for `npm run dev`, installing its deps on first run
├── src/
│   ├── App.tsx                    # routes: /, /stock/:ticker, /assistant
│   ├── pages/
│   │   ├── Research.tsx           # landing page and ticker search
│   │   ├── StockReport.tsx        # the one-page report
│   │   └── Assistant.tsx          # AI chat page
│   ├── hooks/useStockResearch.ts  # fetches every source and assembles the scored report
│   ├── lib/api.ts                 # API client, reads VITE_API_BASE_URL
│   ├── services/
│   │   ├── chat.ts
│   │   └── research/              # per-source data shaping and the scoring logic
│   │       ├── secEdgar.ts  prices.ts  fred.ts  finnhub.ts
│   │       ├── sectors.ts   newsSentiment.ts  analysis.ts
│   │       └── format.ts    transport.ts  types.ts
│   └── components/
│       ├── AIChat.tsx
│       ├── layout/AppLayout.tsx
│       └── research/              # one component per report section, plus search and status cards
└── server/                        # InvesTech API (Node 20, TypeScript, Hono)
    ├── Dockerfile
    ├── .env.example
    └── src/
        ├── index.ts               # starts the HTTP server (PORT, default 8787)
        ├── app.ts                 # routes, CORS, rate limits
        ├── config.ts / env.ts     # reads env vars; loads server/.env in development
        ├── routes/research.ts     # POST /api/research
        ├── routes/chat.ts         # POST /api/chat
        ├── chat/systemPrompt.ts   # assistant instructions
        ├── sources/               # sec.ts, yahoo.ts, fred.ts, finnhub.ts
        └── lib/                   # cache, upstream limiter, per-IP rate limit, errors, HTTP helper
```

## Running it locally

### Prerequisites

- Node.js 20 or newer (the API uses `process.loadEnvFile`, and `server/package.json` requires `>=20`)
- npm

### Steps

```sh
git clone https://github.com/Dev2193/investech.git
cd investech
npm install

# API configuration: at minimum set SEC_USER_AGENT
cp server/.env.example server/.env

# Start the web app and the API together
npm run dev
```

- Web app: <http://localhost:8080>
- API: <http://localhost:8787> (try `/health` and `/api/status`)

`npm run dev` uses `concurrently` to run Vite and the API side by side. The first time, it installs the dependencies in `server/` for you. Vite forwards every `/api` request to the API, so the web app's `VITE_API_BASE_URL` can stay empty during development. To forward to a different address, set `API_PROXY_TARGET` (default `http://localhost:8787`).

When the API starts it logs which keys are missing, so you can tell at a glance which report sections will be unavailable.

## Environment variables

### API server

Put these in `server/.env` for local work, or in your host's environment settings in production.

| Variable | Required | How to get it | What it enables |
| --- | --- | --- | --- |
| `SEC_USER_AGENT` | **Yes** | No account needed. The SEC asks automated clients to send a descriptive User-Agent that includes a contact email, e.g. `InvesTech.AI you@yourdomain.com` ([SEC guidance](https://www.sec.gov/os/accessing-edgar-data)) | Ticker lookup, financials, sector (SIC) classification, peer revenue |
| `FINNHUB_API_KEY` | Optional, recommended | Free key at [finnhub.io/register](https://finnhub.io/register) (60 calls/min) | Peers, analyst recommendations, company news, market cap |
| `FRED_API_KEY` | Optional | Free key at [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) | Economic data through the official FRED API; without a key the server falls back to FRED's public CSV download |
| `OPENAI_API_KEY` | Optional | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (paid) | The AI Assistant chat |
| `OPENAI_MODEL` | Optional | n/a | Chat model; defaults to `gpt-4.1-2025-04-14` |
| `ALLOWED_ORIGINS` | Recommended in production | n/a | Comma-separated list of browser origins allowed by CORS, e.g. `https://investech.ai,https://<project>.lovable.app`. Defaults to `*` |
| `PORT` | Usually set by the host | n/a | Port to listen on; defaults to `8787` |
| `RATE_LIMIT_RESEARCH_PER_MIN` | Optional | n/a | Research requests allowed per client IP per minute (default `300`) |
| `RATE_LIMIT_CHAT_PER_MIN` | Optional | n/a | Chat requests allowed per client IP per minute (default `20`) |

Price history comes from Yahoo Finance's public chart endpoint, which needs no key but is unofficial.

### Web app

The root `.env` file is committed on purpose and must only ever contain public values, because Vite bakes them into the built JavaScript.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Public URL of the deployed API, without a trailing slash (e.g. `https://investech-api.onrender.com`). Leave empty to call the same origin, which is what the dev proxy expects. Applied at build time. |
| `API_PROXY_TARGET` | Dev only. Where the Vite dev server sends `/api` requests (default `http://localhost:8787`). |

API secrets never belong in the root `.env`; they go to the server only.

## npm scripts

Run these from the repository root.

| Script | What it does |
| --- | --- |
| `npm run dev` | Web app and API together |
| `npm run dev:web` | Web app only (Vite) |
| `npm run dev:api` | API only, via `scripts/dev-api.mjs` |
| `npm run build` | Production build of the web app into `dist/` |
| `npm run build:dev` | Web build in development mode |
| `npm run preview` | Serve the built web app locally |
| `npm run lint` | ESLint |
| `npm run server` | API in watch mode (`tsx watch`) |
| `npm run server:build` | Compile the API to `server/dist/` |
| `npm run server:start` | Run the compiled API |
| `npm run server:typecheck` | Type-check the API without emitting files |

## API reference

| Method and path | Description |
| --- | --- |
| `GET /` | Service name and links to the health and status routes |
| `GET /health` | Liveness check, returns `{ "ok": true }` |
| `GET /api/status` | Which integrations are configured (true/false only, never the values), the active OpenAI model, and cache size |
| `POST /api/research` | Body `{ source, path, params }`, where `source` is one of `sec`, `yahoo`, `fred`, `finnhub` and `path` must be on that source's allow-list |
| `POST /api/chat` | Body `{ messages: [{ role: "user" \| "assistant", content }] }`; up to the last 30 messages are used, each trimmed to 8,000 characters |

Every `/api` response has one of two shapes:

```jsonc
{ "ok": true, "data": ... }
{ "ok": false, "code": "missing_key" | "rate_limited" | "not_found" | "bad_request" | "upstream", "message": "...", "source": "..." }
```

Expected failures on `/api/research` and `/api/chat` come back as HTTP 200 with `ok: false`, so the UI can show a precise message; a client that exceeds its rate limit gets HTTP 429 with a `Retry-After` header.

## Deploying

### The API

`server/` is a standalone Node app with its own Dockerfile and needs no database or disk, so any Node or Docker host will do. After deploying, open `https://<your-api>/health` and `https://<your-api>/api/status` to confirm it's up and configured.

**Docker (any host)**

```sh
docker build -t investech-api ./server
docker run -p 8787:8787 \
  -e SEC_USER_AGENT="InvesTech.AI you@domain.com" \
  -e FINNHUB_API_KEY=... \
  investech-api
```

The image runs as the non-root `node` user, listens on 8787, and has a built-in health check against `/health`.

**Render:** create a Web Service from this repo, set *Root Directory* to `server`, and choose the Docker runtime (or the Node runtime with build command `npm ci && npm run build` and start command `npm start`). Use `/health` as the health check path and add the environment variables above.

**Railway:** deploy from the GitHub repo, set the service's *Root Directory* to `server` so the Dockerfile is picked up, add the environment variables, then generate a public domain.

**Fly.io:**

```sh
cd server
fly launch            # uses the Dockerfile; internal port 8787
fly secrets set SEC_USER_AGENT="InvesTech.AI you@domain.com" FINNHUB_API_KEY=... OPENAI_API_KEY=...
fly deploy
```

The cache and rate limits are held in memory per instance. One small instance is enough for personal use; if you run several, put a shared store such as Redis behind the cache and limiter.

### The web app

The frontend is a static Vite build (`npm run build` produces `dist/`) and is currently hosted through Lovable. To connect a hosted frontend to your API:

1. Set `VITE_API_BASE_URL` in the root `.env` to the API's public URL and commit it, so the next build picks it up.
2. Set `ALLOWED_ORIGINS` on the API to the frontend's origins (for example the custom domain and the `*.lovable.app` preview URL).
3. Open `/stock/AAPL`. If the frontend can't reach the API, the page shows a "backend not connected" card instead of data.

## CI

[`.github/workflows/datadog-synthetics.yml`](.github/workflows/datadog-synthetics.yml) runs on pushes and pull requests to `main` and triggers Datadog Synthetic tests tagged `e2e-tests`. It needs `DD_API_KEY` and `DD_APP_KEY` repository secrets. There is no unit test suite in the repository yet.

## Limitations

- Only companies that file with the SEC (US-listed) are covered. Foreign filers using 20-F or 40-F often lack the standard XBRL tags, and funds/ETFs have no financial statements to show.
- Financials are annual 10-K figures as reported. EPS is not restated for later stock splits, and line items reported under company-specific tags show as "—".
- The industry outlook is derived from market prices and peer growth; free data sources don't provide forward-looking industry forecasts.
- Analyst price targets and social-media sentiment require paid data plans and are not included. Headline tone uses a basic keyword approach.
- The scoring thresholds are deliberately simple heuristics. Treat the verdict as a starting point for your own research, not a recommendation.

## License

No license has been specified for this project yet. Until one is added, all rights are reserved by the author.
