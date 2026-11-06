import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchStreamDataQuote, getStreamDataSymbolMap } from "@/lib/market-data/streamdata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROVIDER = "streamdata";
const REFRESH_WINDOW_MS = 55_000;

async function readLatest(client: Awaited<ReturnType<typeof db.connect>>) {
  const result = await client.query(`
    SELECT i.symbol, i.company_name, q.provider_symbol, q.last_price,
      q.open_price, q.high_price, q.low_price, q.volume, q.quote_time,
      q.fetched_at, q.price_unit, q.provider
    FROM instruments i
    JOIN LATERAL (
      SELECT provider_symbol, last_price, open_price, high_price, low_price,
        volume, quote_time, fetched_at, price_unit, provider
      FROM market_quotes
      WHERE instrument_id = i.id AND provider = $1
      ORDER BY quote_time DESC, fetched_at DESC
      LIMIT 1
    ) q ON TRUE
    WHERE i.is_active = TRUE
    ORDER BY i.symbol
  `, [PROVIDER]);
  return result.rows;
}

export async function GET() {
  const token = process.env.STREAMDATA_API_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({
      ok: false,
      status: "NOT_CONFIGURED",
      message: "STREAMDATA_API_TOKEN هنوز در تنظیمات سرور ثبت نشده است."
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  let symbolMap: Record<string, string>;
  try {
    symbolMap = getStreamDataSymbolMap();
  } catch {
    return NextResponse.json({
      ok: false,
      status: "INVALID_SYMBOL_MAP",
      message: "ساختار STREAMDATA_SYMBOL_MAP معتبر نیست."
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  if (Object.keys(symbolMap).length === 0) {
    return NextResponse.json({
      ok: false,
      status: "SYMBOLS_NOT_CONFIGURED",
      message: "شناسه‌های رسمی نمادها از ارائه‌دهنده داده هنوز تنظیم نشده‌اند."
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const lock = await client.query("SELECT pg_try_advisory_xact_lock(81726041) AS acquired");
    if (!lock.rows[0]?.acquired) {
      await client.query("ROLLBACK");
      const cachedClient = await db.connect();
      try {
        const quotes = await readLatest(cachedClient);
        return NextResponse.json({ ok: true, status: "CACHED", provider: PROVIDER, quotes }, {
          headers: { "Cache-Control": "no-store" }
        });
      } finally {
        cachedClient.release();
      }
    }

    const freshness = await client.query(
      "SELECT MAX(fetched_at) AS latest FROM market_quotes WHERE provider = $1",
      [PROVIDER]
    );
    const latestFetchedAt = freshness.rows[0]?.latest ? new Date(freshness.rows[0].latest).getTime() : 0;
    if (latestFetchedAt && Date.now() - latestFetchedAt < REFRESH_WINDOW_MS) {
      const quotes = await readLatest(client);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, status: "CACHED", provider: PROVIDER, quotes }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    const instruments = await client.query(
      "SELECT id, symbol, company_name FROM instruments WHERE is_active = TRUE ORDER BY symbol"
    );
    const configured = instruments.rows.filter((row: { symbol: string }) => symbolMap[row.symbol]);
    if (configured.length === 0) {
      await client.query("COMMIT");
      return NextResponse.json({
        ok: true, status: "NO_MATCHING_INSTRUMENTS", provider: PROVIDER, quotes: [],
        message: "کلیدهای نقشه نماد با نمادهای فعال دیتابیس مطابقت ندارند."
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const failures: string[] = [];
    for (const instrument of configured) {
      try {
        const quote = await fetchStreamDataQuote(symbolMap[instrument.symbol]);
        await client.query(`
          INSERT INTO market_quotes (
            instrument_id, provider, provider_symbol, last_price, open_price,
            high_price, low_price, volume, quote_time, fetched_at, price_unit
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
          ON CONFLICT (instrument_id, provider, quote_time)
          DO UPDATE SET
            provider_symbol = EXCLUDED.provider_symbol,
            last_price = EXCLUDED.last_price,
            open_price = EXCLUDED.open_price,
            high_price = EXCLUDED.high_price,
            low_price = EXCLUDED.low_price,
            volume = EXCLUDED.volume,
            fetched_at = NOW(),
            price_unit = EXCLUDED.price_unit
        `, [
          instrument.id, PROVIDER, quote.symbol, quote.close, quote.open,
          quote.high, quote.low, quote.volume, quote.time,
          process.env.STREAMDATA_PRICE_UNIT?.trim() || "UNVERIFIED"
        ]);
      } catch (error) {
        console.error("StreamData quote fetch failed", instrument.symbol, error);
        failures.push(instrument.symbol);
      }
    }

    const quotes = await readLatest(client);
    await client.query("COMMIT");
    return NextResponse.json({
      ok: true,
      status: failures.length ? "PARTIAL" : "UPDATED",
      provider: PROVIDER,
      updated: configured.length - failures.length,
      failedSymbols: failures,
      quotes,
      fetchedAt: new Date().toISOString()
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Market quote refresh failed", error);
    return NextResponse.json({
      ok: false, status: "UPSTREAM_OR_DATABASE_ERROR",
      message: "به‌روزرسانی قیمت‌ها انجام نشد."
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  } finally {
    client.release();
  }
}
