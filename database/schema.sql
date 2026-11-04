-- Boursa AI initial PostgreSQL schema.
-- Market prices must only be populated by a verified, licensed data adapter.
CREATE TABLE IF NOT EXISTS instruments (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'TSE',
  sector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS market_candles (
  id BIGSERIAL PRIMARY KEY,
  instrument_id BIGINT NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  interval TEXT NOT NULL CHECK (interval IN ('1d','1w','1m')),
  candle_time TIMESTAMPTZ NOT NULL,
  open_price NUMERIC(20,4) NOT NULL CHECK (open_price > 0),
  high_price NUMERIC(20,4) NOT NULL CHECK (high_price > 0),
  low_price NUMERIC(20,4) NOT NULL CHECK (low_price > 0),
  close_price NUMERIC(20,4) NOT NULL CHECK (close_price > 0),
  volume NUMERIC(24,4) NOT NULL DEFAULT 0 CHECK (volume >= 0),
  source TEXT NOT NULL,
  is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (instrument_id, interval, candle_time, source)
);
CREATE INDEX IF NOT EXISTS market_candles_lookup_idx ON market_candles(instrument_id, interval, candle_time DESC);
CREATE TABLE IF NOT EXISTS signal_snapshots (
  id BIGSERIAL PRIMARY KEY,
  instrument_id BIGINT NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  strategy_key TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY','HOLD','SELL')),
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_source TEXT NOT NULL,
  is_synthetic BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS signal_snapshots_recent_idx ON signal_snapshots(instrument_id, generated_at DESC);
CREATE TABLE IF NOT EXISTS paper_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key TEXT NOT NULL,
  name TEXT NOT NULL,
  initial_cash NUMERIC(22,2) NOT NULL DEFAULT 100000000 CHECK (initial_cash >= 0),
  cash_balance NUMERIC(22,2) NOT NULL DEFAULT 100000000 CHECK (cash_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'IRR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS paper_portfolios_owner_idx ON paper_portfolios(owner_key);
CREATE TABLE IF NOT EXISTS paper_orders (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES paper_portfolios(id) ON DELETE CASCADE,
  instrument_id BIGINT NOT NULL REFERENCES instruments(id),
  side TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
  quantity NUMERIC(22,4) NOT NULL CHECK (quantity > 0),
  order_price NUMERIC(20,4) NOT NULL CHECK (order_price > 0),
  fee NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  status TEXT NOT NULL DEFAULT 'SIMULATED' CHECK (status IN ('SIMULATED','CANCELLED')),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);
CREATE INDEX IF NOT EXISTS paper_orders_portfolio_idx ON paper_orders(portfolio_id, executed_at DESC);
