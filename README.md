# Boursa AI

A Persian-first analytics workspace for the Iranian capital market, built with Next.js, TypeScript and PostgreSQL.

## Product scope
- Read-only market monitoring and explainable technical analysis.
- Descriptive trend states for educational use.
- No brokerage integration, no order execution, and no automated trading.
- No synthetic prices or synthetic signal fixtures in the production dashboard.

## Current capabilities
- Responsive Persian RTL analytics dashboard.
- Neon PostgreSQL schema for instruments, daily OHLCV candles, quote snapshots and signal snapshots.
- Technical indicator engine: SMA 20, SMA 50 and RSI 14.
- Database-backed endpoints:
  - `GET /api/market/health`
  - `GET /api/market/status`
  - `GET /api/market/overview`
  - `GET /api/signals`
  - `GET /api/market/quotes` — server-side quote refresh/cache from StreamData when configured.
- Protected OHLCV ingestion:
  - `POST /api/market/ingest`
  - Requires `Authorization: Bearer <INGEST_API_KEY>`
  - Requires `X-Market-Data-Source`
  - Accepts 1–1000 normalized daily candles per batch.
- Quote snapshots are stored separately from daily candles. Intraday quotes are never mislabeled as daily candles.

## StreamData provider setup
The app includes a server-side REST adapter for StreamData's documented `getLive` endpoint. The provider documents one symbol per request and a REST limit of 60 requests/minute. Its public documentation examples do not establish the exact identifiers for the six configured Tehran symbols, so do not guess them.

Set these server-only Vercel Production environment variables after obtaining the provider's authorized symbol identifiers:
- `STREAMDATA_API_TOKEN`: private API token. Never commit it or expose it to browser code.
- `STREAMDATA_SYMBOL_MAP`: JSON object mapping each Boursa AI symbol to the exact provider symbol ID, e.g. `{"فملی":"<provider-symbol-id>","فولاد":"<provider-symbol-id>"}`.
- `STREAMDATA_PRICE_UNIT`: set to `IRR` or `TOMAN` only after the provider confirms the unit. Otherwise leave unset; the app labels it unverified.

The adapter refreshes no more than once per 55 seconds per shared database lock, validates timestamps and OHLC values, and stores quote snapshots with source timestamps. It does not log in to Mofid or Agah and does not bypass anti-bot controls.

## Data provider status and limitations
The app is not considered live until a provider token and verified symbol mappings are configured and the quote endpoint returns fresh provider timestamps. A snapshot feed is not the same as an exchange tick-by-tick stream. Confirm latency, market coverage, price units, symbol IDs, redistribution permission and terms with the provider before public display.

## Existing daily-candle ingestion
`POST /api/market/ingest` stores normalized provider-supplied daily OHLCV candles and computes an initial indicator snapshot after sufficient history is available. It does not turn intraday quotes into daily history.

## Analysis methodology
The current rule engine compares SMA 20 and SMA 50 and evaluates RSI 14. The 0–100 score is a rule-alignment score, not a probability of profit or accuracy. This initial strategy is not yet validated with walk-forward/out-of-sample backtests, corporate-action adjustments, trading fees, slippage, suspensions or price-limit constraints. Treat its outputs as educational analytics only.

## Local development
```bash
npm install
npm run dev
```
Set `DATABASE_URL` and `INGEST_API_KEY` as server-side environment variables. Never commit secrets.

## Risk disclosure
All outputs are algorithmic summaries, not personalized financial advice, guarantees or instructions to trade. Market data may be delayed, incomplete, adjusted or incorrect. The app never connects to brokerage accounts or submits orders.
