export type StreamDataQuote = {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type StreamDataResponse = {
  s?: string;
  errmsg?: string;
  t?: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v?: number;
};

function requiredToken(): string {
  const token = process.env.STREAMDATA_API_TOKEN?.trim();
  if (!token) throw new Error("STREAMDATA_NOT_CONFIGURED");
  return token;
}

export function getStreamDataSymbolMap(): Record<string, string> {
  const raw = process.env.STREAMDATA_SYMBOL_MAP;
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("STREAMDATA_SYMBOL_MAP_INVALID_JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("STREAMDATA_SYMBOL_MAP_INVALID_SHAPE");
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  if (entries.length > 10 || entries.some(([key, value]) =>
    !key.trim() || typeof value !== "string" || !value.trim() || value.length > 120
  )) {
    throw new Error("STREAMDATA_SYMBOL_MAP_INVALID_ENTRIES");
  }
  return Object.fromEntries(entries.map(([key, value]) => [key.trim(), String(value).trim()]));
}

export async function fetchStreamDataQuote(providerSymbol: string): Promise<StreamDataQuote> {
  const token = requiredToken();
  const url = new URL(
    `https://v6.streamdata.ir/api/cdl/v1/service/${encodeURIComponent(token)}/getLive`
  );
  url.searchParams.set("symbol", providerSymbol);

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000)
  });
  if (!response.ok) throw new Error(`STREAMDATA_HTTP_${response.status}`);

  const payload = await response.json() as StreamDataResponse;
  if (payload.s !== "ok") {
    throw new Error(payload.errmsg ? "STREAMDATA_UPSTREAM_ERROR" : "STREAMDATA_EMPTY_RESPONSE");
  }

  const values = [payload.t, payload.o, payload.h, payload.l, payload.c, payload.v];
  if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("STREAMDATA_INVALID_PAYLOAD");
  }

  const time = new Date(payload.t as number);
  const open = payload.o as number;
  const high = payload.h as number;
  const low = payload.l as number;
  const close = payload.c as number;
  const volume = payload.v as number;
  if (!Number.isFinite(time.getTime()) || Math.abs(Date.now() - time.getTime()) > 7 * 24 * 60 * 60 * 1000 ||
      open <= 0 || high <= 0 || low <= 0 || close <= 0 || volume < 0 ||
      high < Math.max(open, close, low) || low > Math.min(open, close, high)) {
    throw new Error("STREAMDATA_INVALID_MARKET_VALUES");
  }

  return {
    symbol: providerSymbol,
    time: time.toISOString(),
    open,
    high,
    low,
    close,
    volume
  };
}
