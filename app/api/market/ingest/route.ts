import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { evaluateSignal } from "@/lib/indicators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CandleInput = {
  symbol: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function authorized(request: NextRequest): boolean {
  const expected = process.env.INGEST_API_KEY;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function validCandle(row: CandleInput): boolean {
  const values = [row.open, row.high, row.low, row.close, row.volume];
  const time = Date.parse(row.time);
  return /^[\u0600-\u06FFa-zA-Z0-9_-]{1,24}$/.test(row.symbol)
    && Number.isFinite(time)
    && values.every(Number.isFinite)
    && row.open > 0 && row.high > 0 && row.low > 0 && row.close > 0 && row.volume >= 0
    && row.high >= Math.max(row.open, row.close, row.low)
    && row.low <= Math.min(row.open, row.close, row.high);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "کلید دسترسی معتبر نیست." }, { status: 401 });
  }

  const source = request.headers.get("x-market-data-source")?.trim();
  if (!source || source.length > 80) {
    return NextResponse.json({ error: "INVALID_SOURCE", message: "هدر X-Market-Data-Source الزامی است." }, { status: 400 });
  }

  const raw = await request.text();
  if (raw.length > 1_000_000) {
    return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let payload: unknown;
  try { payload = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 }); }

  const candles = (payload as { candles?: unknown })?.candles;
  if (!Array.isArray(candles) || candles.length < 1 || candles.length > 1000) {
    return NextResponse.json({ error: "INVALID_BATCH", message: "بسته باید بین ۱ تا ۱۰۰۰ کندل داشته باشد." }, { status: 400 });
  }
  if (!candles.every((item) => item && typeof item === "object" && validCandle(item as CandleInput))) {
    return NextResponse.json({ error: "INVALID_CANDLE", message: "ساختار یا مقادیر حداقل یک کندل نامعتبر است." }, { status: 422 });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    let inserted = 0;
    const touched = new Set<string>();

    for (const candle of candles as CandleInput[]) {
      const instrument = await client.query(
        "SELECT id FROM instruments WHERE symbol = $1 AND is_active = TRUE LIMIT 1",
        [candle.symbol]
      );
      if (!instrument.rowCount) continue;

      await client.query(
        `INSERT INTO market_candles
          (instrument_id, interval, candle_time, open_price, high_price, low_price, close_price, volume, source, is_synthetic)
         VALUES ($1, '1d', $2, $3, $4, $5, $6, $7, $8, FALSE)
         ON CONFLICT (instrument_id, interval, candle_time, source)
         DO UPDATE SET open_price = EXCLUDED.open_price,
           high_price = EXCLUDED.high_price, low_price = EXCLUDED.low_price,
           close_price = EXCLUDED.close_price, volume = EXCLUDED.volume,
           is_synthetic = FALSE`,
        [instrument.rows[0].id, new Date(candle.time).toISOString(), candle.open, candle.high, candle.low, candle.close, candle.volume, source]
      );
      inserted++;
      touched.add(candle.symbol);
    }

    const generated: Array<{ symbol: string; signal: string; score: number }> = [];
    for (const symbol of touched) {
      const instrument = await client.query("SELECT id FROM instruments WHERE symbol = $1", [symbol]);
      const history = await client.query(
        "SELECT close_price FROM market_candles WHERE instrument_id = $1 AND interval = '1d' ORDER BY candle_time DESC LIMIT 80",
        [instrument.rows[0].id]
      );
      const closes = history.rows.map((row: { close_price: string }) => Number(row.close_price)).reverse();
      const analysis = evaluateSignal(closes);
      if (analysis.indicators.sma20 === null) continue;

      await client.query(
        `INSERT INTO signal_snapshots
          (instrument_id, strategy_key, signal, score, reasons, indicators, data_source, is_synthetic)
         VALUES ($1, 'sma20-sma50-rsi14-v1', $2, $3, $4::jsonb, $5::jsonb, $6, FALSE)`,
        [instrument.rows[0].id, analysis.signal, analysis.score, JSON.stringify(analysis.reasons), JSON.stringify(analysis.indicators), source]
      );
      generated.push({ symbol, signal: analysis.signal, score: analysis.score });
    }

    await client.query("COMMIT");
    return NextResponse.json({
      ok: true,
      source,
      received: candles.length,
      stored: inserted,
      symbolsAnalyzed: generated.length,
      signals: generated,
      note: "این API فقط داده دریافتی را ذخیره و تحلیل الگوریتمی می‌کند؛ سفارش معاملاتی ارسال نمی‌کند."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Market ingestion failed", error);
    return NextResponse.json({ error: "INGESTION_FAILED", message: "ذخیره‌سازی داده بازار ناموفق بود." }, { status: 500 });
  } finally {
    client.release();
  }
}
