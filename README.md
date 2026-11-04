# Boursa AI

A Persian-first Iranian capital-market analytics workspace built with Next.js, TypeScript and PostgreSQL.

## Current foundation
- Responsive Persian RTL dashboard with symbol watchlist and a demo signal screener.
- Explainable technical-indicator engine (SMA 20/50 and RSI 14).
- Demo signal endpoint: `GET /api/demo-signal`.
- Neon PostgreSQL schema for instruments, daily candles, signal snapshots and paper portfolios.
- Database-backed overview endpoint: `GET /api/market/overview`.
- Database-backed latest signal feed: `GET /api/signals`.
- Database health/status endpoint: `GET /api/market/health`.
- Protected OHLCV ingestion endpoint: `POST /api/market/ingest` (requires a server-side `INGEST_API_KEY`).
- Vercel deployment connected to the GitHub repository.

## Important data status
The dashboard's current prices, chart and displayed BUY/HOLD/SELL examples are synthetic fixtures. They are not live quotes, not recommendations, and not an estimate of future returns. The technical indicator module is a starter implementation and has not been validated on historical out-of-sample market data.

Before enabling a market-data adapter, verify the provider's official documentation, permitted use, data delay, rate limits, coverage, and reliability. Prefer the official TSETMC REST API documentation at https://api.tsetmc.com/docs/ over undocumented community endpoints.

## Local development
```bash
npm install
npm run dev
```

Set `DATABASE_URL` in your local environment to a Neon PostgreSQL connection string. Never commit credentials.

For protected ingestion, set a strong random `INGEST_API_KEY` in Vercel Project Settings → Environment Variables (Production and Preview as appropriate). Send it only as an `Authorization: Bearer ...` header; never place it in browser code or commit it. Also send `X-Market-Data-Source` with a short provider identifier.

Example request body:
```json
{
  "candles": [
    { "symbol": "فملی", "time": "2026-11-03T00:00:00.000Z", "open": 8100, "high": 8500, "low": 8000, "close": 8420, "volume": 28400000 }
  ]
}
```

Prices must be numeric OHLCV values from a provider whose access and redistribution terms you have verified. This endpoint validates and stores submitted candles, then creates a signal snapshot once at least 51 daily closes are available. It does not fetch market data by itself.

## Database
Run `database/schema.sql` against the Neon database to create the initial tables. The schema supports:
- Instrument master data
- OHLCV candles with source and synthetic-data markers
- Explainable signal snapshots
- Simulated portfolios and simulated orders

## Next milestones
1. Integrate and validate a permitted market-data source; the current ingestion route accepts provider-normalized OHLCV but does not scrape a provider.
2. Build a scheduled ingestion and data-quality pipeline.
3. Calculate indicators from persisted historical candles.
4. Add walk-forward backtesting with fees, slippage, market hours and price-limit constraints.
5. Build portfolio analytics and paper-trading workflows.
6. Add authentication, user isolation, monitoring and operational safeguards.

## Scope
This repository is an educational analytics and simulation project. It does not connect to brokerage accounts or submit live orders.
