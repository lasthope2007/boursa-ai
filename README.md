# Boursa AI

A Persian-first analytics workspace for the Iranian capital market, built with Next.js, TypeScript and PostgreSQL.

## Product scope
- Market monitoring and explainable technical analysis.
- Descriptive signal states: positive bias, neutral, and negative bias.
- No brokerage integration, no order execution, and no automated trading.
- No synthetic prices or synthetic signal fixtures in the production dashboard.

## Current capabilities
- Responsive Persian RTL analytics dashboard.
- Neon PostgreSQL schema for instruments, daily OHLCV candles and signal snapshots.
- Technical indicator engine: SMA 20, SMA 50 and RSI 14.
- Database-backed endpoints:
  - `GET /api/market/health`
  - `GET /api/market/status`
  - `GET /api/market/overview`
  - `GET /api/signals`
- Protected OHLCV ingestion:
  - `POST /api/market/ingest`
  - Requires `Authorization: Bearer <INGEST_API_KEY>`
  - Requires `X-Market-Data-Source`
  - Accepts 1–1000 normalized daily candles per batch.
  - Validates OHLCV values and stores only provider-supplied data.
  - Computes an initial signal snapshot after at least 51 daily closes.
- Dashboard refreshes market status and analysis every 60 seconds.

## Data provider status and limitations
The application does not currently fetch market data from TSETMC or another provider by itself. It accepts normalized data through the protected ingestion endpoint. Do not describe any quote as real-time until a permitted provider has been integrated and its timestamps, delays, symbol mapping, adjustment policy, rate limits and redistribution terms have been verified.

TSETMC announced a newer REST web service and recommends REST for new development. Its documentation is published at https://api.tsetmc.com/docs/. The documentation host was not reachable during the latest implementation review, so endpoint contracts have deliberately not been guessed. Community endpoint catalogs are useful for investigation but are unofficial and may change without notice.

## Ingestion payload
```json
{
  "candles": [
    {
      "symbol": "فملی",
      "time": "2026-11-03T00:00:00.000Z",
      "open": 8100,
      "high": 8500,
      "low": 8000,
      "close": 8420,
      "volume": 28400000
    }
  ]
}
```

Prices must come from a verified data source. Never send the ingestion key from browser code or commit it to the repository.

## Analysis methodology
The current rule engine compares SMA 20 and SMA 50 and evaluates RSI 14. The 0–100 score is a rule-alignment score, not a probability of profit or accuracy. This initial strategy is not yet validated with walk-forward/out-of-sample backtests, corporate-action adjustments, trading fees, slippage, suspensions or price-limit constraints. Treat its outputs as educational analytics only.

## Production checklist
1. Confirm a provider's permission, coverage, latency, terms and endpoint schema.
2. Implement and schedule a provider adapter with retries, rate limiting, data-quality checks and monitoring.
3. Backfill adjusted historical candles and validate symbol mappings.
4. Add walk-forward backtests with realistic fees, slippage and market restrictions.
5. Add user authentication and private watchlists only after access-control review.
6. Add monitoring, alerting, backups and operational documentation.

## Local development
```bash
npm install
npm run dev
```
Set `DATABASE_URL` and `INGEST_API_KEY` as server-side environment variables. Never commit secrets.

## Risk disclosure
All outputs are algorithmic summaries, not personalized financial advice, guarantees or instructions to trade. Market data may be delayed, incomplete, adjusted or incorrect. Users must independently assess suitability and risk. The app never connects to brokerage accounts or submits orders.
