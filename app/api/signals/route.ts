import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (i.symbol)
        i.symbol, i.company_name, i.market, i.sector,
        CASE s.signal WHEN 'BUY' THEN 'BULLISH' WHEN 'SELL' THEN 'BEARISH' ELSE 'NEUTRAL' END AS signal,
        s.score, s.reasons, s.indicators,
        s.strategy_key, s.data_source, s.generated_at,
        c.close_price, c.volume, c.candle_time,
        CASE WHEN c.previous_close IS NOT NULL AND c.previous_close > 0
          THEN ROUND(((c.close_price - c.previous_close) / c.previous_close) * 100, 2)
          ELSE NULL END AS change_pct
      FROM signal_snapshots s
      JOIN instruments i ON i.id = s.instrument_id
      LEFT JOIN LATERAL (
        SELECT latest_candle.close_price, latest_candle.volume, latest_candle.candle_time,
          (SELECT prior.close_price FROM market_candles prior
            WHERE prior.instrument_id = i.id AND prior.interval = '1d'
              AND prior.is_synthetic = FALSE AND prior.candle_time < latest_candle.candle_time
            ORDER BY prior.candle_time DESC LIMIT 1) AS previous_close
        FROM market_candles latest_candle
        WHERE latest_candle.instrument_id = i.id AND latest_candle.interval = '1d'
          AND latest_candle.is_synthetic = FALSE
        ORDER BY latest_candle.candle_time DESC LIMIT 1
      ) c ON TRUE
      WHERE i.is_active = TRUE AND s.is_synthetic = FALSE
      ORDER BY i.symbol, s.generated_at DESC
    `);
    return NextResponse.json({
      mode: "DATABASE",
      count: result.rowCount ?? 0,
      signals: result.rows,
      disclaimer: "این خروجی صرفاً توصیف جهت‌گیری شاخص‌های تکنیکال است؛ توصیه شخصی یا تضمین بازده نیست."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Signal query failed", error);
    return NextResponse.json({ error: "SIGNALS_UNAVAILABLE" }, { status: 503 });
  }
}
