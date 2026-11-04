import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT DISTINCT ON (i.symbol)
        i.symbol, i.company_name, i.market, i.sector,
        s.signal, s.score, s.reasons, s.indicators,
        s.strategy_key, s.data_source, s.generated_at,
        c.close_price, c.volume, c.candle_time
      FROM signal_snapshots s
      JOIN instruments i ON i.id = s.instrument_id
      LEFT JOIN LATERAL (
        SELECT close_price, candle_time
        FROM market_candles
        WHERE instrument_id = i.id AND interval = '1d'
        ORDER BY candle_time DESC LIMIT 1
      ) c ON TRUE
      WHERE i.is_active = TRUE AND s.is_synthetic = FALSE
      ORDER BY i.symbol, s.generated_at DESC
    `);
    return NextResponse.json({
      mode: "DATABASE",
      count: result.rowCount ?? 0,
      signals: result.rows,
      disclaimer: "النتایج خروجی قواعد آماری هستند، نه تضمین بازده یا توصیه شخصی سرمایه‌گذاری."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Signal query failed", error);
    return NextResponse.json({ error: "SIGNALS_UNAVAILABLE" }, { status: 503 });
  }
}
