export type MarketCandle = {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketDataProvider = {
  readonly id: string;
  readonly displayName: string;
  fetchDailyCandles(symbol: string, limit: number): Promise<MarketCandle[]>;
};

// Provider adapters implement this contract. Keep credentials server-side and
// record the provider ID on every persisted candle and generated signal.
