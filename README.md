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
src/pages/Research.tsx          landing page + ticker search
src/pages/StockReport.tsx       /stock/:ticker report
src/hooks/useStockResearch.ts   react-query orchestration of all data + scoring
src/services/research/
  transport.ts                  calls the edge function (or local dev proxy)
  secEdgar.ts  prices.ts  fred.ts  finnhub.ts   one module per data source
  sectors.ts                    SIC → sector/ETF, sector macro indicators
  newsSentiment.ts              keyword headline tone
  analysis.ts                   ratios, section scores, verdict (all rules in one place)
src/components/research/        report sections
supabase/functions/stock-research/   edge function (holds secrets, fixes CORS)
supabase/functions/_shared/researchProxy.ts  shared handler (edge function + Vite dev server)
```

SEC EDGAR, FRED and Yahoo don't allow browser (CORS) requests, and API keys shouldn't ship to the browser, so all data goes through the `stock-research` Supabase edge function. The handler only proxies an allow-list of endpoints.

## Configuration (API keys)

Set these as **Supabase edge-function secrets** (Supabase dashboard → Edge Functions → Secrets, or via Lovable's Supabase integration):

| Secret | Required? | Where to get it | Used for |
| --- | --- | --- | --- |
| `SEC_USER_AGENT` | **Yes** | No signup. SEC requires a descriptive User-Agent with a contact email, e.g. `InvesTech.AI you@yourdomain.com` ([SEC policy](https://www.sec.gov/os/accessing-edgar-data)) | Ticker lookup, financials, industry (SIC), peer revenue |
| `FINNHUB_API_KEY` | Optional (recommended) | Free at [finnhub.io/register](https://finnhub.io/register) — 60 calls/min | Peers, analyst recommendations, company news, market cap |
| `FRED_API_KEY` | Optional | Free at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html) | Macro data via the official API (without it, FRED's public CSV download is used) |

Price history uses Yahoo Finance's public chart endpoint (no key; unofficial).

### Local development

```sh
npm i
cp .env.example .env.local   # then fill SEC_USER_AGENT (and optionally FINNHUB_API_KEY)
npm run dev                  # http://localhost:8080
```

With `VITE_RESEARCH_TRANSPORT=local`, the Vite dev server serves `/api/research` using the same handler as the edge function, reading the secrets from `.env.local` (non-`VITE_` variables are never bundled into the client).

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
