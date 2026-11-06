-- Additive migration: store provider quote snapshots separately from daily OHLC candles.
CREATE TABLE IF NOT EXISTS market_quotes (
  id BIGSERIAL PRIMARY KEY,
  instrument_id BIGINT NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_symbol TEXT NOT NULL,
  last_price NUMERIC(20,6) NOT NULL CHECK (last_price > 0),
  open_price NUMERIC(20,6) NOT NULL CHECK (open_price > 0),
  high_price NUMERIC(20,6) NOT NULL CHECK (high_price > 0),
  low_price NUMERIC(20,6) NOT NULL CHECK (low_price > 0),
  volume NUMERIC(24,4) NOT NULL DEFAULT 0 CHECK (volume >= 0),
  quote_time TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  price_unit TEXT NOT NULL DEFAULT 'UNVERIFIED',
  UNIQUE (instrument_id, provider, quote_time),
  CHECK (high_price >= GREATEST(open_price, last_price, low_price)),
  CHECK (low_price <= LEAST(open_price, last_price, high_price))
);
CREATE INDEX IF NOT EXISTS market_quotes_latest_idx
  ON market_quotes(instrument_id, provider, quote_time DESC, fetched_at DESC);
CREATE INDEX IF NOT EXISTS market_quotes_fetched_idx
  ON market_quotes(provider, fetched_at DESC);
